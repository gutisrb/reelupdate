import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, ExternalLink, Loader2, Share2, PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';

interface Asset {
  id: string;
  user_id: string;
  kind: string;
  status: string;
  src_url: string | null;
  thumb_url: string | null;
  prompt: string | null;
  inputs: any;
  posted_to: any;
  created_at: string;
}

interface Video {
  id: string;
  user_id: string;
  title: string | null;
  status: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  posted_channels_json: any;
  created_at: string;
}

const PAGE_SIZE = 24;

const statusColors = {
  processing: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  ready: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const platformIcons: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
};

export function Galerija() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [postingVideoIds, setPostingVideoIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const previousVideos = useRef<Video[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile } = useProfile(user);

  // Fetch current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const fetchAssets = useCallback(async (offset = 0, append = false) => {
    try {
      // Fetch assets (images only, since videos come from videos table)
      let assetsQuery = (supabase as any)
        .from('assets')
        .select('id, user_id, kind, status, src_url, thumb_url, prompt, inputs, posted_to, created_at')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (filter === 'image') {
        assetsQuery = assetsQuery.eq('kind', 'image');
      } else if (filter === 'video') {
        assetsQuery = assetsQuery.eq('kind', 'video');
      }

      const { data: assetsData, error: assetsError } = await assetsQuery;
      if (assetsError) throw assetsError;

      const typedAssets = (assetsData || []) as Asset[];

      // Fetch videos from videos table
      let videosData: Video[] = [];
      if (filter === 'all' || filter === 'video') {
        const { data: vids, error: vidsError } = await (supabase as any)
          .from('videos')
          .select('id, user_id, title, status, video_url, thumbnail_url, posted_channels_json, created_at')
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (vidsError) throw vidsError;
        videosData = (vids || []) as Video[];
      }

      if (append) {
        setAssets(prev => [...prev, ...typedAssets]);
        setVideos(prev => [...prev, ...videosData]);
      } else {
        setAssets(typedAssets);
        setVideos(videosData);
      }

      setHasMore(typedAssets.length === PAGE_SIZE || videosData.length === PAGE_SIZE);
    } catch (error: any) {
      toast({
        title: 'Greška',
        description: error.message || 'Došlo je do greške pri učitavanju galerije',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    setLoading(true);
    fetchAssets(0, false);
  }, [filter]);

  // Realtime subscription for assets
  useEffect(() => {
    const channel = (supabase as any)
      .channel('assets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assets',
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setAssets(prev => [payload.new as Asset, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setAssets(prev =>
              prev.map(asset =>
                asset.id === payload.new.id ? (payload.new as Asset) : asset
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Realtime subscription for videos
  useEffect(() => {
    const channel = (supabase as any)
      .channel('videos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos',
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setVideos(prev => [payload.new as Video, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setVideos(prev =>
              prev.map(video =>
                video.id === payload.new.id ? (payload.new as Video) : video
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fallback polling for processing items
  useEffect(() => {
    const hasProcessingAssets = assets.some(a => a.status === 'processing');
    const hasProcessingVideos = videos.some(v => !v.video_url);
    if (!hasProcessingAssets && !hasProcessingVideos) return;

    const interval = setInterval(() => {
      fetchAssets(0, false);
    }, 10000);

    return () => clearInterval(interval);
  }, [assets, videos, fetchAssets]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const totalItems = assets.length + videos.length;
          fetchAssets(totalItems, true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [assets.length, videos.length, hasMore, loading, fetchAssets]);

  const handleDownload = async (asset: Asset) => {
    if (asset.status !== 'ready' || !asset.src_url) return;

    try {
      const response = await fetch(asset.src_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${asset.kind}-${asset.id}.${asset.kind === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: 'Greška',
        description: 'Nije moguće preuzeti fajl',
        variant: 'destructive',
      });
    }
  };

  const getDisplayText = (asset: Asset) => {
    if (asset.kind === 'video') {
      try {
        const inputsStr = JSON.stringify(asset.inputs || {});
        return inputsStr.substring(0, 100) + (inputsStr.length > 100 ? '...' : '');
      } catch {
        return '';
      }
    }
    return (asset.prompt || '').substring(0, 100) + ((asset.prompt?.length || 0) > 100 ? '...' : '');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if video has been posted (has any status entries in posted_channels_json)
  const hasBeenPosted = (video: Video): boolean => {
    if (!video.posted_channels_json || typeof video.posted_channels_json !== 'object') return false;
    const channels = video.posted_channels_json as Record<string, any>;
    return Object.keys(channels).length > 0;
  };

  // Post video to social channels via webhook
  const postVideo = async (video: Video) => {
    if (postingVideoIds.has(video.id)) return;

    setPostingVideoIds(prev => new Set(prev).add(video.id));

    try {
      const webhookUrl = import.meta.env.VITE_MAKE_POST_WEBHOOK_URL;
      if (!webhookUrl) {
        throw new Error('Post webhook URL nije konfigurisan');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: video.user_id,
          video_id: video.id,
          channels: ['instagram', 'tiktok', 'facebook', 'youtube']
        })
      });

      if (!response.ok) {
        throw new Error('Webhook poziv nije uspeo');
      }

      // Update posted_channels_json with pending status
      const updatedChannels = {
        instagram: { status: 'pending' },
        tiktok: { status: 'pending' },
        facebook: { status: 'pending' },
        youtube: { status: 'pending' }
      };

      const { error } = await (supabase as any)
        .from('videos')
        .update({ posted_channels_json: updatedChannels })
        .eq('id', video.id);

      if (error) throw error;

      toast({
        title: 'Video poslat na objavu',
        description: 'Video je poslat na društvene mreže',
      });
    } catch (error: any) {
      toast({
        title: 'Greška',
        description: error.message || 'Nije moguće objaviti video',
        variant: 'destructive',
      });
    } finally {
      setPostingVideoIds(prev => {
        const next = new Set(prev);
        next.delete(video.id);
        return next;
      });
    }
  };

  // Auto-post when video becomes ready (if review_first is false)
  useEffect(() => {
    if (!profile || profile.review_first !== false) return;

    const newlyReadyVideos = videos.filter(video => {
      const wasProcessing = previousVideos.current.find(prev =>
        prev.id === video.id && !prev.video_url
      );
      const isNowReady = video.video_url !== null;
      const notPosted = !hasBeenPosted(video);

      return wasProcessing && isNowReady && notPosted;
    });

    newlyReadyVideos.forEach(video => {
      postVideo(video);
    });

    previousVideos.current = videos;
  }, [videos, profile]);

  const combinedItems = [
    ...assets.map(a => ({ type: 'asset' as const, data: a })),
    ...videos.map(v => ({ type: 'video' as const, data: v }))
  ].sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime());

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-heading-1 font-bold mb-2">Moja galerija</h1>
        <p className="text-text-muted text-lg">
          Sve vaše fotografije i video snimci na jednom mestu
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-8">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">Svi</TabsTrigger>
          <TabsTrigger value="image">Fotografije</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {loading && assets.length === 0 && videos.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : assets.length === 0 && videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-text-muted text-lg mb-4">
                Još uvek nemate sadržaja
              </p>
              <div className="flex gap-4">
                <Button onClick={() => navigate('/app/reel')}>Kreiraj video</Button>
                <Button variant="outline" onClick={() => navigate('/app/stage')}>
                  Staguj fotografiju
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {combinedItems.map((item) => {
                  if (item.type === 'asset') {
                    const asset = item.data;
                    const displayUrl = asset.thumb_url || asset.src_url || null;
                    const fallbackUrl = asset.inputs?.image_urls?.[0] || null;

                    return (
                      <Card key={`asset-${asset.id}`} className="hover-lift overflow-hidden">
                        <CardContent className="p-0">
                          {/* Media */}
                          <div className="relative aspect-video bg-muted flex items-center justify-center">
                            {asset.status === 'processing' ? (
                              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                <div className="text-center text-white">
                                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                  <p className="text-sm font-medium">Obrada u toku…</p>
                                </div>
                              </div>
                            ) : asset.status === 'ready' && !displayUrl ? (
                              <>
                                {fallbackUrl ? (
                                  <>
                                    <img
                                      src={fallbackUrl}
                                      alt={asset.prompt || 'Image'}
                                      className="w-full h-full object-cover opacity-60"
                                    />
                                    <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-sm flex items-center justify-center p-4">
                                      <div className="text-center text-amber-700 dark:text-amber-300">
                                        <p className="text-xs font-medium">Privremeni prikaz iz izvornog URL-a</p>
                                        <p className="text-xs mt-1">Fajl nije sačuvan u bazu</p>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-sm flex items-center justify-center p-4">
                                    <div className="text-center text-amber-700 dark:text-amber-300">
                                      <p className="text-sm font-medium">Greška pri učitavanju</p>
                                      <p className="text-xs mt-1">Fajl nije sačuvan u bazu</p>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : displayUrl ? (
                              asset.kind === 'image' ? (
                                <img
                                  src={displayUrl}
                                  alt={asset.prompt || 'Image'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <video
                                  src={displayUrl}
                                  poster={asset.thumb_url || ''}
                                  controls
                                  muted
                                  loop
                                  className="w-full h-full object-cover"
                                />
                              )
                            ) : (
                              <div className="text-muted-foreground text-sm">
                                Sadržaj nije dostupan
                              </div>
                            )}

                            {/* Status badge */}
                            <div className="absolute top-3 left-3">
                              <Badge
                                className={
                                  statusColors[asset.status as keyof typeof statusColors] ||
                                  'bg-muted text-muted-foreground'
                                }
                              >
                                {asset.status === 'processing'
                                  ? 'Obrađuje se'
                                  : asset.status === 'ready'
                                    ? 'Spremno'
                                    : 'Greška'}
                              </Badge>
                            </div>

                            {/* Platform badges */}
                            {asset.posted_to && Array.isArray(asset.posted_to) && asset.posted_to.length > 0 && (
                              <div className="absolute top-3 right-3 flex gap-1">
                                {asset.posted_to.map((platform: string) => (
                                  <Badge
                                    key={platform}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {platformIcons[platform] || platform}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <div className="text-xs text-text-subtle mb-2">
                              {formatDate(asset.created_at)}
                            </div>
                            <p className="text-sm text-text-muted line-clamp-2 mb-4">
                              {getDisplayText(asset)}
                            </p>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                disabled={!displayUrl}
                                onClick={() => handleDownload(asset)}
                                title={!displayUrl ? 'Download će biti omogućen kada se fajl sačuva' : 'Preuzmi'}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Preuzmi
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/app/galerija/${asset.id}`)}
                                title="Prikaži detalje"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  } else {
                    const video = item.data;
                    const displayUrl = video.video_url || video.thumbnail_url || null;
                    const isProcessing = !video.video_url;
                    const posted = hasBeenPosted(video);
                    const isPosting = postingVideoIds.has(video.id);
                    const showPostButton = profile?.review_first === true && !isProcessing && displayUrl && !posted && !isPosting;

                    // Parse platform badges from posted_channels_json
                    const platformBadges = (() => {
                      if (!video.posted_channels_json || typeof video.posted_channels_json !== 'object') return [];
                      const channels = video.posted_channels_json as Record<string, any>;
                      return Object.entries(channels).map(([platform, data]) => ({
                        platform,
                        status: data?.status || 'unknown'
                      }));
                    })();

                    return (
                      <Card
                        key={`video-${video.id}`}
                        className="hover-lift overflow-hidden cursor-pointer"
                        onClick={() => !isProcessing && displayUrl && navigate(`/app/galerija/${video.id}`)}
                      >
                        <CardContent className="p-0">
                          {/* Media */}
                          <div className="relative aspect-video bg-muted flex items-center justify-center">
                            {isProcessing ? (
                              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                <div className="text-center text-white">
                                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                  <p className="text-sm font-medium">Obrada u toku…</p>
                                </div>
                              </div>
                            ) : displayUrl ? (
                              <>
                                <img
                                  src={video.thumbnail_url || displayUrl}
                                  alt={video.title || 'Video thumbnail'}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                                  <PlayCircle className="h-16 w-16 text-white drop-shadow-lg" />
                                </div>
                              </>
                            ) : (
                              <div className="text-muted-foreground text-sm">
                                Sadržaj nije dostupan
                              </div>
                            )}

                            {/* Status badge */}
                            <div className="absolute top-3 left-3">
                              <Badge
                                className={
                                  isProcessing
                                    ? statusColors.processing
                                    : statusColors.ready
                                }
                              >
                                {isProcessing ? 'Obrađuje se' : 'Spremno'}
                              </Badge>
                            </div>

                            {/* Platform badges from posted_channels_json */}
                            {platformBadges.length > 0 && (
                              <div className="absolute top-3 right-3 flex flex-wrap gap-1">
                                {platformBadges.map(({ platform, status }) => (
                                  <Badge
                                    key={platform}
                                    variant={status === 'posted' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {platformIcons[platform] || platform}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <div className="text-xs text-text-subtle mb-2">
                              {formatDate(video.created_at)}
                            </div>
                            <p className="text-sm text-text-muted line-clamp-2 mb-4">
                              {video.title || 'Video bez naslova'}
                            </p>

                            <div className="flex gap-2">
                              {showPostButton && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    postVideo(video);
                                  }}
                                  disabled={isPosting}
                                >
                                  <Share2 className="h-4 w-4 mr-1" />
                                  Objavi
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className={showPostButton ? '' : 'flex-1'}
                                disabled={!displayUrl}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload({ ...video, kind: 'video', status: isProcessing ? 'processing' : 'ready', src_url: video.video_url, thumb_url: video.thumbnail_url, prompt: video.title, inputs: null, posted_to: video.posted_channels_json } as Asset);
                                }}
                                title={!displayUrl ? 'Download će biti omogućen kada se fajl sačuva' : 'Preuzmi'}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Preuzmi
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/app/galerija/${video.id}`);
                                }}
                                title="Prikaži detalje"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                })}
              </div>

              {/* Infinite scroll trigger */}
              {hasMore && (
                <div ref={observerTarget} className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}