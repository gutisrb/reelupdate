import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface SocialConnection {
    platform: 'instagram' | 'facebook' | 'tiktok';
    platform_username: string;
    created_at: string;
    auto_post_enabled: boolean;
}

interface SocialConnectionsProps {
    userId: string;
}

export function SocialConnections({ userId }: SocialConnectionsProps) {
    const [connections, setConnections] = useState<SocialConnection[]>([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadConnections();
    }, [userId]);

    const loadConnections = async () => {
        const { data, error } = await supabase
            .from('social_connections')
            .select('platform, platform_username, created_at, auto_post_enabled')
            .eq('user_id', userId);

        if (error) {
            console.error('Error loading connections:', error);
        } else {
            setConnections((data as any) || []);
        }
        setLoading(false);
    };

    const handleConnect = async (platform: string) => {
        setConnecting(platform);
        try {
            const { data, error } = await supabase.functions.invoke('social-auth', {
                body: { platform, userId },
            });

            if (error) {
                // Try to parse the error body if it exists
                let errorMessage = error.message;
                try {
                    // Sometimes the error context has the response body
                    if (error instanceof Error && (error as any).context?.json) {
                        const body = await (error as any).context.json();
                        if (body.error) errorMessage = body.error;
                    }
                } catch (e) {
                    // Ignore parsing error
                }
                throw new Error(errorMessage);
            }

            if (data?.error) {
                throw new Error(data.error);
            }

            if (!data.url) throw new Error('No redirect URL returned');

            // Redirect to the OAuth URL
            window.location.href = data.url;
        } catch (error: any) {
            console.error('Connection error:', error);
            toast({
                title: "Connection Failed",
                description: error.message || "Could not initiate connection. Check console for details.",
                variant: "destructive",
            });
            setConnecting(null);
        }
    };

    const handleDisconnect = async (platform: string) => {
        try {
            const { error } = await supabase
                .from('social_connections')
                .delete()
                .eq('user_id', userId)
                .eq('platform', platform);

            if (error) throw error;

            setConnections(prev => prev.filter(c => c.platform !== platform));
            toast({
                title: "Disconnected",
                description: `Successfully disconnected ${platform}.`,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to disconnect account.",
                variant: "destructive",
            });
        }
    };

    const handleToggleAutoPost = async (platform: string, enabled: boolean) => {
        try {
            const { error } = await supabase
                .from('social_connections')
                .update({ auto_post_enabled: enabled })
                .eq('user_id', userId)
                .eq('platform', platform);

            if (error) throw error;

            setConnections(prev => prev.map(c =>
                c.platform === platform ? { ...c, auto_post_enabled: enabled } : c
            ));

            toast({
                title: enabled ? "Auto-Post Enabled" : "Auto-Post Disabled",
                description: `Automatic posting for ${platform} is now ${enabled ? 'ON' : 'OFF'}.`,
            });
        } catch (error: any) {
            console.error('Error toggling auto-post:', error);
            toast({
                title: "Error",
                description: "Failed to update settings.",
                variant: "destructive",
            });
        }
    };

    const isConnected = (platform: string) => {
        return connections.find(c => c.platform === platform);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Social Accounts</CardTitle>
                <CardDescription>
                    Connect your accounts to enable auto-posting.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* TikTok */}
                <div className="flex flex-col gap-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold">
                                TT
                            </div>
                            <div>
                                <h3 className="font-medium">TikTok</h3>
                                {isConnected('tiktok') ? (
                                    <p className="text-sm text-green-600 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Connected as @{isConnected('tiktok')?.platform_username}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Not connected</p>
                                )}
                            </div>
                        </div>
                        {isConnected('tiktok') ? (
                            <Button variant="outline" size="sm" onClick={() => handleDisconnect('tiktok')}>
                                Disconnect
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => handleConnect('tiktok')}
                                disabled={!!connecting}
                            >
                                {connecting === 'tiktok' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Connect
                            </Button>
                        )}
                    </div>

                    {isConnected('tiktok') && (
                        <div className="flex items-center space-x-2 pt-2 border-t">
                            <Switch
                                id="tiktok-autopost"
                                checked={isConnected('tiktok')?.auto_post_enabled}
                                onCheckedChange={(checked) => handleToggleAutoPost('tiktok', checked)}
                            />
                            <Label htmlFor="tiktok-autopost">Enable Auto-Posting</Label>
                        </div>
                    )}
                </div>

                {/* Instagram */}
                <div className="flex flex-col gap-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                IG
                            </div>
                            <div>
                                <h3 className="font-medium">Instagram</h3>
                                {isConnected('instagram') ? (
                                    <p className="text-sm text-green-600 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Connected as @{isConnected('instagram')?.platform_username}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Not connected</p>
                                )}
                            </div>
                        </div>
                        {isConnected('instagram') ? (
                            <Button variant="outline" size="sm" onClick={() => handleDisconnect('instagram')}>
                                Disconnect
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => handleConnect('instagram')}
                                disabled={!!connecting}
                            >
                                {connecting === 'instagram' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Connect
                            </Button>
                        )}
                    </div>

                    {isConnected('instagram') && (
                        <div className="flex items-center space-x-2 pt-2 border-t">
                            <Switch
                                id="instagram-autopost"
                                checked={isConnected('instagram')?.auto_post_enabled}
                                onCheckedChange={(checked) => handleToggleAutoPost('instagram', checked)}
                            />
                            <Label htmlFor="instagram-autopost">Enable Auto-Posting</Label>
                        </div>
                    )}
                </div>

                {/* Facebook */}
                <div className="flex items-center justify-between p-4 border rounded-lg opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            FB
                        </div>
                        <div>
                            <h3 className="font-medium">Facebook</h3>
                            <p className="text-sm text-muted-foreground">Coming Soon</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" disabled>
                        Connect
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
