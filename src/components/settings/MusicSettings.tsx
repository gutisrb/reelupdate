import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Music, Trash2, Play, Pause, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface CustomMusic {
  id: string;
  filename: string;
  cloudinary_url: string;
  duration_seconds: number;
  title: string | null;
  created_at: string;
}

interface MusicSettingsProps {
  userId: string;
}

export function MusicSettings({ userId }: MusicSettingsProps) {
  const [musicPreference, setMusicPreference] = useState<'auto_generate' | 'library_pick' | 'custom'>('auto_generate');
  const [customMusicList, setCustomMusicList] = useState<CustomMusic[]>([]);
  const [selectedMusicId, setSelectedMusicId] = useState<string | null>(null);
  const [licenseAccepted, setLicenseAccepted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const { toast } = useToast();

  // Load user settings and music list
  useEffect(() => {
    loadSettings();
    loadCustomMusic();
  }, [userId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('music_preference, selected_custom_music_id, music_license_accepted')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setMusicPreference(data.music_preference || 'auto_generate');
        setSelectedMusicId(data.selected_custom_music_id);
        setLicenseAccepted(data.music_license_accepted || false);
      } else {
        // No settings row exists yet - create one with defaults
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: userId,
            music_preference: 'auto_generate',
            voice_id: 'sr-RS-Standard-A',
            voice_language_code: 'sr-RS',
          });

        if (insertError) {
          console.error('Error creating default settings:', insertError);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomMusic = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_music_uploads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomMusicList(data || []);
    } catch (error) {
      console.error('Error loading custom music:', error);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Fajl je prevelik',
        description: 'Maksimalna veličina je 10MB',
        variant: 'destructive',
      });
      return;
    }

    // Check if license is accepted
    if (!licenseAccepted) {
      toast({
        title: 'Prihvatite uslove',
        description: 'Morate prihvatiti da imate prava da koristite ovu muziku',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, '')); // Remove extension

      // Get Supabase URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const uploadUrl = `${supabaseUrl}/functions/v1/upload-custom-music`;

      // Upload to Edge Function
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Upload failed');
      }

      const result = await response.json();

      toast({
        title: 'Uspešno!',
        description: 'Muzika je uspešno uploadovana',
      });

      // Update license acceptance in database
      await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          music_license_accepted: true,
          music_license_accepted_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
      setLicenseAccepted(true);

      // Reload music list
      await loadCustomMusic();

      // Auto-select the new music
      setSelectedMusicId(result.music.id);
      await updateMusicPreference('custom', result.music.id);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Greška',
        description: error.message || 'Došlo je do greške prilikom uploada',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'audio/x-m4a': ['.m4a'],
      'audio/aac': ['.aac'],
      'audio/ogg': ['.ogg'],
    },
    maxFiles: 1,
    disabled: uploading || !licenseAccepted,
  });

  const updateMusicPreference = async (preference: 'auto_generate' | 'library_pick' | 'custom', musicId?: string) => {
    try {
      const updates: any = {
        user_id: userId,
        music_preference: preference,
        selected_custom_music_id: preference === 'custom' && musicId ? musicId : null,
      };

      console.log('Updating music preference:', updates);

      const { data, error } = await supabase
        .from('user_settings')
        .upsert(updates, {
          onConflict: 'user_id',
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Music preference updated successfully:', data);
      setMusicPreference(preference);

      toast({
        title: 'Sačuvano',
        description: 'Podešavanja muzike su ažurirana',
      });
    } catch (error: any) {
      console.error('Error updating preference:', error);
      toast({
        title: 'Greška',
        description: error.message || 'Nije moguće sačuvati podešavanja',
        variant: 'destructive',
      });
    }
  };

  const deleteMusic = async (musicId: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovu muziku?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('custom_music_uploads')
        .delete()
        .eq('id', musicId);

      if (error) throw error;

      // If this was selected, switch to auto_generate
      if (selectedMusicId === musicId) {
        setSelectedMusicId(null);
        await updateMusicPreference('auto_generate');
      }

      toast({
        title: 'Obrisano',
        description: 'Muzika je uspešno obrisana',
      });

      await loadCustomMusic();
    } catch (error) {
      console.error('Error deleting music:', error);
      toast({
        title: 'Greška',
        description: 'Nije moguće obrisati muziku',
        variant: 'destructive',
      });
    }
  };

  const togglePlay = (url: string, id: string) => {
    if (playingId === id) {
      // Stop playing
      audioElement?.pause();
      setPlayingId(null);
      setAudioElement(null);
    } else {
      // Stop previous audio
      audioElement?.pause();

      // Play new audio
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => {
        setPlayingId(null);
        setAudioElement(null);
      };
      setPlayingId(id);
      setAudioElement(audio);
    }
  };

  const selectMusic = (musicId: string) => {
    setSelectedMusicId(musicId);
    updateMusicPreference('custom', musicId);
  };

  if (loading) {
    return <div>Učitavanje...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Music Preference */}
      <Card>
        <CardHeader>
          <CardTitle>Muzika u pozadini</CardTitle>
          <CardDescription>
            Izaberite kako želite da dodate muziku u vaše videe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={musicPreference}
            onValueChange={(value) => updateMusicPreference(value as 'auto_generate' | 'library_pick' | 'custom')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="auto_generate" id="auto" />
              <Label htmlFor="auto">Automatski generiši muziku (AI)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom">Moja uploadovana muzika</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Legal Disclaimer */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="space-y-3">
          <div className="font-semibold">Važno obaveštenje o autorskim pravima</div>
          <p className="text-sm">
            Ako uploadujete muziku, Vi ste odgovorni za obezbeđivanje prava za korišćenje te muzike
            u komercijalnim videima. Korišćenje muzike zaštićene autorskim pravima bez dozvole može
            dovesti do pravnih posledica.
          </p>
          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="license-accept"
              checked={licenseAccepted}
              onCheckedChange={(checked) => setLicenseAccepted(checked as boolean)}
            />
            <Label
              htmlFor="license-accept"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Potvrđujem da imam legalna prava da koristim muziku koju uploadujem u komercijalnim videima
            </Label>
          </div>
        </AlertDescription>
      </Alert>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaduj svoju muziku</CardTitle>
          <CardDescription>
            Maksimalna veličina: 10MB | Maksimalno trajanje: 60 sekundi | Formati: MP3, WAV, M4A, AAC, OGG
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${!licenseAccepted || uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {uploading ? (
              <p className="text-lg font-medium">Uploading...</p>
            ) : !licenseAccepted ? (
              <p className="text-lg font-medium text-muted-foreground">
                Prvo prihvatite uslove iznad
              </p>
            ) : isDragActive ? (
              <p className="text-lg font-medium">Pustite fajl ovde...</p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">
                  Prevucite muziku ovde ili kliknite da izaberete
                </p>
                <p className="text-sm text-muted-foreground">
                  MP3, WAV, M4A, AAC ili OGG do 10MB
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Music List */}
      {customMusicList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vaša muzika</CardTitle>
            <CardDescription>
              Izaberite muziku koju želite da koristite u videima
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customMusicList.map((music) => (
                <div
                  key={music.id}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border transition-colors
                    ${selectedMusicId === music.id ? 'border-primary bg-primary/5' : 'border-border'}
                  `}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePlay(music.cloudinary_url, music.id)}
                    >
                      {playingId === music.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="font-medium">{music.title || music.filename}</div>
                      <div className="text-sm text-muted-foreground">
                        {music.duration_seconds}s • {new Date(music.created_at).toLocaleDateString('sr-RS')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedMusicId === music.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                    <Button
                      variant={selectedMusicId === music.id ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => selectMusic(music.id)}
                      disabled={selectedMusicId === music.id}
                    >
                      {selectedMusicId === music.id ? 'Izabrano' : 'Izaberi'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMusic(music.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
