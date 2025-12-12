import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Copy, ArrowLeft, Loader2, Clock, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';

interface Video {
  id: string;
  user_id: string;
  status: string;
  video_url: string | null;
  thumbnail_url: string | null;
  title: string | null;
  meta: any;
  posted_channels_json: any;
  created_at: string;
  duration_seconds: number | null;
}

const statusColors = {
  processing: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  ready: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const platformIcons: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

const channelStatusColors = {
  posted: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-600 border-red-500/20',
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

const optimizeCloudinaryUrl = (url: string): string => {
  // Our Edge Function already optimizes Cloudinary URLs with q_auto:good
  // Adding transformations here breaks the carefully constructed transformation chain
  // So we just return the URL as-is
  return url;
};

export function GalerijaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const { profile } = useProfile(user);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const fetchVideo = async () => {
    if (!id) return;

    try {
      const { data, error } = await (supabase as any)
        .from('videos')
        .select('id, user_id, status, video_url, thumbnail_url, title, meta, posted_channels_json, created_at, duration_seconds')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      setVideo(data);
    } catch (error: any) {
      toast({
        title: 'Greška',
        description: error.message || 'Nije moguće učitati sadržaj',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideo();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const channel = (supabase as any)
      .channel(`video-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'videos',
          filter: `id=eq.${id}`,
        },
        (payload: any) => {
          setVideo(payload.new as Video);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const videoUrl = video?.video_url ? optimizeCloudinaryUrl(video.video_url) : null;
  const description = video?.meta?.description || null;

  const handleDownload = async () => {
    if (!videoUrl) return;

    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-${video.id}.mp4`;
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

  const handleCopyUrl = () => {
    if (!videoUrl) return;
    navigator.clipboard.writeText(videoUrl);
    toast({
      title: 'Kopirano',
      description: 'URL je kopiran u clipboard',
    });
  };

  const handleCopyDescription = () => {
    if (!description) return;
    navigator.clipboard.writeText(description);
    toast({
      title: 'Kopirano',
      description: 'Opis je kopiran u clipboard',
    });
  };

  const handlePostEverywhere = async () => {
    if (!video || !profile) return;

    setPosting(true);
    try {
      // Define supported platforms
      const platforms = ['tiktok', 'instagram'];
      const results: Record<string, string> = {};

      // Post to each platform
      for (const platform of platforms) {
        try {
          // We use the optimized URL if available, otherwise the raw one
          const urlToPost = videoUrl || video.video_url;

          const { data, error } = await supabase.functions.invoke('post-social-content', {
            body: {
              userId: video.user_id,
              platform,
              videoUrl: urlToPost,
              caption: description
            }
          });

          if (error) throw error;
          if (data?.error) throw new Error(data.error);

          results[platform] = 'posted';
          toast({
            title: `Objavljeno na ${platformIcons[platform] || platform}`,
            description: 'Video je uspešno poslat.',
          });
        } catch (err: any) {
          console.error(`Failed to post to ${platform}:`, err);
          // If the error is "No connection found", we can ignore it or mark as skipped
          if (err.message && err.message.includes('No connection')) {
            // results[platform] = 'skipped'; 
          } else {
            results[platform] = 'failed';
            toast({
              title: `Greška za ${platformIcons[platform] || platform}`,
              description: err.message || 'Nije moguće objaviti.',
              variant: 'destructive',
            });
          }
        }
      }

      // Update video status in DB
      // We merge with existing posted_channels_json
      const currentChannels = video.posted_channels_json || {};
      const updatedChannels = { ...currentChannels, ...results };

      await (supabase as any)
        .from('videos')
        .update({ posted_channels_json: updatedChannels })
        .eq('id', video.id);

    } catch (error: any) {
      toast({
        title: 'Greška',
        description: error.message || 'Nije moguće objaviti video',
        variant: 'destructive',
      });
    } finally {
      setPosting(false);
    }
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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Button variant="ghost" onClick={() => navigate('/app/galerija')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Nazad na galeriju
        </Button>
        <Alert>
          <AlertDescription>Nije pronađeno</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <Button variant="ghost" onClick={() => navigate('/app/galerija')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Nazad na galeriju
      </Button>

      {video.status === 'processing' && (
        <Alert className="mb-6 border-amber-500/20 bg-amber-500/10">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-600">
            Obrada u toku… obično par minuta. Stranica se automatski osvežava.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="relative bg-black rounded-lg overflow-hidden">
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    poster={video.thumbnail_url || ''}
                    controls
                    className="w-full h-auto"
                  />
                ) : video.status === 'processing' ? (
                  <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-text-muted">Obrada u toku…</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-20 min-h-[400px] text-muted-foreground">
                    Video nije dostupan
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {description && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Opis</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyDescription}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-primary whitespace-pre-wrap">{description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {/* Akcije Card - Now First */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Akcije</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {profile?.review_first && video.status === 'ready' && (
                <Button
                  onClick={handlePostEverywhere}
                  className="w-full gradient-primary text-white shadow-md hover:shadow-lg transition-all"
                  disabled={posting}
                  size="lg"
                >
                  {posting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Objavi svuda
                </Button>
              )}
              <Button
                onClick={handleCopyUrl}
                variant="outline"
                className="w-full"
                disabled={!videoUrl}
              >
                <Copy className="h-4 w-4 mr-2" />
                Kopiraj URL
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full"
                disabled={!videoUrl}
              >
                <Download className="h-4 w-4 mr-2" />
                Preuzmi
              </Button>
            </CardContent>
          </Card>

          {/* Status Card - Now Second */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                className={`${statusColors[video.status as keyof typeof statusColors] ||
                  'bg-muted text-muted-foreground'
                  } px-3 py-1.5 text-sm font-medium`}
              >
                {video.status === 'processing'
                  ? 'Obrađuje se'
                  : video.status === 'ready'
                    ? 'Spremno'
                    : 'Greška'}
              </Badge>
            </CardContent>
          </Card>

          {/* Status objave Card */}
          {video.posted_channels_json && typeof video.posted_channels_json === 'object' && Object.keys(video.posted_channels_json).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Status objave</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(video.posted_channels_json).map(([platform, status]: [string, any]) => (
                    <Badge
                      key={platform}
                      className={`${channelStatusColors[status as keyof typeof channelStatusColors] || 'bg-muted'} px-2.5 py-1 text-xs font-medium`}
                    >
                      {platformIcons[platform] || platform}: {status}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meta podaci Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Meta podaci</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {video.title && (
                <div className="flex justify-between items-start gap-4">
                  <span className="text-muted-foreground">Naslov:</span>
                  <span className="text-foreground font-medium text-right">{video.title}</span>
                </div>
              )}
              {video.duration_seconds && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Trajanje:</span>
                  <span className="text-foreground font-medium">
                    {formatDuration(video.duration_seconds)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Kreirano:</span>
                <span className="text-foreground font-medium">{formatDate(video.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}