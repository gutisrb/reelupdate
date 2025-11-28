import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Play, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VoicePreset {
  id: string;
  voice_id: string;
  name: string;
  gender: string;
  description: string;
  preview_url: string | null;
}

interface VoiceSettingsProps {
  userId: string;
}

export function VoiceSettings({ userId }: VoiceSettingsProps) {
  const [voices, setVoices] = useState<VoicePreset[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadVoices();
    loadUserSettings();
  }, [userId]);

  const loadVoices = async () => {
    const { data, error } = await supabase
      .from('voice_presets')
      .select('*')
      .eq('active', true)
      .order('sort_order');

    if (error) {
      console.error('Error loading voices:', error);
      return;
    }

    setVoices(data || []);
    setLoading(false);
  };

  const loadUserSettings = async () => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('voice_id')
      .eq('user_id', userId)
      .single();

    if (data) {
      setSelectedVoiceId(data.voice_id);
    } else if (voices.length > 0) {
      setSelectedVoiceId(voices[0].voice_id);
    }
  };

  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const playPreview = (previewUrl: string, voiceId: string) => {
    if (!previewUrl) {
      toast({
        title: "Preview nije dostupan",
        description: "Preview za ovaj glas još nije postavljen.",
        variant: "destructive",
      });
      return;
    }

    // If clicking the same voice that's playing, stop it
    if (playingVoice === voiceId && currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setPlayingVoice(null);
      setCurrentAudio(null);
      return;
    }

    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    // Play new audio
    const audio = new Audio(previewUrl);
    setPlayingVoice(voiceId);
    setCurrentAudio(audio);

    audio.onended = () => {
      setPlayingVoice(null);
      setCurrentAudio(null);
    };

    audio.onerror = () => {
      setPlayingVoice(null);
      setCurrentAudio(null);
      toast({
        title: "Greška",
        description: "Nije moguće reproducirati preview.",
        variant: "destructive",
      });
    };

    audio.play();
  };

  const saveSettings = async () => {
    setSaving(true);

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        voice_id: selectedVoiceId,
        updated_at: new Date().toISOString(),
      });

    setSaving(false);

    if (error) {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom čuvanja podešavanja.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Uspešno",
        description: "Podešavanja glasa su sačuvana.",
      });
    }
  };

  if (loading) {
    return <div>Učitavanje...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Odabir Glasa</CardTitle>
        <CardDescription>
          Izaberite glas koji će se koristiti za naraciju vaših videa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={selectedVoiceId} onValueChange={setSelectedVoiceId}>
          <div className="space-y-4">
            {voices.map((voice) => (
              <div
                key={voice.id}
                className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <RadioGroupItem value={voice.voice_id} id={voice.voice_id} />
                <div className="flex-1">
                  <Label htmlFor={voice.voice_id} className="cursor-pointer">
                    <div className="font-medium">{voice.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {voice.gender === 'male' ? 'Muški glas' : 'Ženski glas'} • {voice.description}
                    </div>
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playPreview(voice.preview_url || '', voice.voice_id)}
                  disabled={!voice.preview_url || playingVoice === voice.voice_id}
                >
                  {playingVoice === voice.voice_id ? (
                    <Volume2 className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span className="ml-2">Preview</span>
                </Button>
              </div>
            ))}
          </div>
        </RadioGroup>

        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? 'Čuvanje...' : 'Sačuvaj Podešavanja'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
