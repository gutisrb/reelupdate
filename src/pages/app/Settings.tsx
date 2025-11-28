import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { VoiceSettingsRedesigned } from '@/components/settings/VoiceSettingsRedesigned';
import { LogoSettings } from '@/components/settings/LogoSettings';
import { CaptionSettings } from '@/components/settings/CaptionSettings';
import { PostTemplateSettings } from '@/components/settings/PostTemplateSettings';
import { MusicSettings } from '@/components/settings/MusicSettings';

export function Settings() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  if (!user) {
    return <div className="container mx-auto px-6 py-8">Učitavanje...</div>;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Podešavanja</h1>
          <p className="text-muted-foreground">
            Prilagodite glas, logo, titlove i druge opcije za vaše video generacije
          </p>
        </div>

        <Tabs defaultValue="voice" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="voice">Glas</TabsTrigger>
            <TabsTrigger value="music">Muzika</TabsTrigger>
            <TabsTrigger value="logo">Logo</TabsTrigger>
            <TabsTrigger value="captions">Titlovi</TabsTrigger>
            <TabsTrigger value="post">Post Template</TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="space-y-4">
            <VoiceSettingsRedesigned userId={user.id} />
          </TabsContent>

          <TabsContent value="music" className="space-y-4">
            <MusicSettings userId={user.id} />
          </TabsContent>

          <TabsContent value="logo" className="space-y-4">
            <LogoSettings userId={user.id} />
          </TabsContent>

          <TabsContent value="captions" className="space-y-4">
            <CaptionSettings userId={user.id} />
          </TabsContent>

          <TabsContent value="post" className="space-y-4">
            <PostTemplateSettings userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
