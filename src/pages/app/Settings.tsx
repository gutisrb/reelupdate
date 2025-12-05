import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'voice';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (!user) {
    return <div className="container mx-auto px-6 py-8">Učitavanje...</div>;
  }

  return (
    <div className="container mx-auto px-6 py-8 h-[calc(100vh-80px)]">
      <div className="flex h-full gap-8">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-2">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Brand Kit</h1>
            <p className="text-sm text-muted-foreground">
              Manage your brand assets
            </p>
          </div>

          <nav className="space-y-1">
            <SidebarItem
              active={activeTab === 'voice'}
              onClick={() => handleTabChange('voice')}
              label="Glas (Voice)"
            />
            <SidebarItem
              active={activeTab === 'music'}
              onClick={() => handleTabChange('music')}
              label="Muzika"
            />
            <SidebarItem
              active={activeTab === 'logo'}
              onClick={() => handleTabChange('logo')}
              label="Logo & Branding"
            />
            <SidebarItem
              active={activeTab === 'captions'}
              onClick={() => handleTabChange('captions')}
              label="Titlovi (Captions)"
            />
            <SidebarItem
              active={activeTab === 'post'}
              onClick={() => handleTabChange('post')}
              label="Post Template"
            />
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 h-full overflow-y-auto pr-4">
          {activeTab === 'voice' && <VoiceSettingsRedesigned userId={user.id} />}
          {activeTab === 'music' && <MusicSettings userId={user.id} />}
          {activeTab === 'logo' && <LogoSettings userId={user.id} />}
          {activeTab === 'captions' && <CaptionSettings userId={user.id} />}
          {activeTab === 'post' && <PostTemplateSettings userId={user.id} />}
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active
        ? 'bg-primary text-primary-foreground'
        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
        }`}
    >
      {label}
    </button>
  );
}
