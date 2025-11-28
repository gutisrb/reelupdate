import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, Check, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VoicePreset {
  id: string;
  voice_id: string;
  name: string;
  gender: string;
  description: string;
  preview_url: string | null;
  voice_type: string;
}

interface VoiceSettingsProps {
  userId: string;
}

export function VoiceSettingsRedesigned({ userId }: VoiceSettingsProps) {
  const [voices, setVoices] = useState<VoicePreset[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<VoicePreset[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadVoices();
    loadUserSettings();
  }, [userId]);

  useEffect(() => {
    filterVoices();
  }, [voices, genderFilter, typeFilter, searchQuery]);

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
    }
  };

  const filterVoices = () => {
    let filtered = [...voices];

    // Gender filter
    if (genderFilter !== 'all') {
      filtered = filtered.filter(v => v.gender === genderFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(v => v.voice_type === typeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query)
      );
    }

    setFilteredVoices(filtered);
  };

  const playPreview = (previewUrl: string | null, voiceId: string) => {
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

  const selectVoice = async (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    setSaving(true);

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        voice_id: voiceId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
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

  const getVoiceTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'hd': return 'bg-purple-500';
      case 'premium': return 'bg-blue-500';
      case 'wavenet': return 'bg-blue-500';
      case 'ultra': return 'bg-indigo-500';
      case 'neural2': return 'bg-indigo-500';
      case 'studio': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Učitavanje...</div>;
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
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pretraži glasove..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Gender Filter */}
          <Tabs value={genderFilter} onValueChange={setGenderFilter} className="w-full md:w-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Svi</TabsTrigger>
              <TabsTrigger value="male">Muški</TabsTrigger>
              <TabsTrigger value="female">Ženski</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Tip glasa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Svi tipovi</SelectItem>
              <SelectItem value="hd">HD</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="wavenet">WaveNet</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Voice Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVoices.map((voice) => (
            <div
              key={voice.id}
              className={`relative group rounded-lg border-2 p-4 transition-all cursor-pointer hover:shadow-lg ${
                selectedVoiceId === voice.voice_id
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => selectVoice(voice.voice_id)}
            >
              {/* Selected Indicator */}
              {selectedVoiceId === voice.voice_id && (
                <div className="absolute top-2 right-2">
                  <div className="bg-primary rounded-full p-1">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}

              {/* Voice Info */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{voice.name.split('(')[0].trim()}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {voice.gender === 'male' ? 'Muški' : 'Ženski'}
                    </Badge>
                    <Badge className={`text-xs ${getVoiceTypeBadgeColor(voice.voice_type)}`}>
                      {voice.voice_type.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {voice.description}
                </p>

                {/* Preview Button */}
                <Button
                  variant={playingVoice === voice.voice_id ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    playPreview(voice.preview_url, voice.voice_id);
                  }}
                  disabled={!voice.preview_url}
                >
                  {playingVoice === voice.voice_id ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Preview
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredVoices.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nema pronađenih glasova</p>
            <p className="text-sm">Pokušajte promeniti filtere ili pretragu</p>
          </div>
        )}

        {/* Count */}
        <div className="text-sm text-muted-foreground text-center">
          Prikazano {filteredVoices.length} od {voices.length} glasova
        </div>
      </CardContent>
    </Card>
  );
}
