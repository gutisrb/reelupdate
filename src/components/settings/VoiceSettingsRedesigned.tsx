import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

interface GroupedVoice {
  baseName: string;
  baseVoiceId: string;
  gender: string;
  description: string;
  flash: VoicePreset | null;
  pro: VoicePreset | null;
}

interface VoiceSettingsProps {
  userId: string;
}

const DEFAULT_STYLE_INSTRUCTIONS = 'UGC style voiceover with warm, confident delivery in a sophisticated professional tone, emphasizing key features naturally, in a Belgrade Serbian dialect. and fast pace';

export function VoiceSettingsRedesigned({ userId }: VoiceSettingsProps) {
  const [voices, setVoices] = useState<VoicePreset[]>([]);
  const [groupedVoices, setGroupedVoices] = useState<GroupedVoice[]>([]);
  const [filteredGroupedVoices, setFilteredGroupedVoices] = useState<GroupedVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [selectedModels, setSelectedModels] = useState<Record<string, 'flash' | 'pro'>>({});
  const [styleInstructions, setStyleInstructions] = useState<string>(DEFAULT_STYLE_INSTRUCTIONS);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadVoices();
    loadUserSettings();
  }, [userId]);

  useEffect(() => {
    groupVoices();
  }, [voices]);

  useEffect(() => {
    filterVoices();
  }, [groupedVoices, genderFilter, searchQuery]);

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

  const groupVoices = () => {
    const grouped: Record<string, GroupedVoice> = {};

    voices.forEach(voice => {
      // Extract base name (remove model suffix from voice_id)
      const baseVoiceId = voice.voice_id.replace(/-flash$|-pro$/, '');
      const baseName = voice.name.replace(/\s*\((Flash|Pro)\)\s*$/, '').trim();

      if (!grouped[baseVoiceId]) {
        grouped[baseVoiceId] = {
          baseName,
          baseVoiceId,
          gender: voice.gender,
          description: voice.description,
          flash: null,
          pro: null,
        };
      }

      if (voice.voice_type === 'flash') {
        grouped[baseVoiceId].flash = voice;
      } else if (voice.voice_type === 'pro') {
        grouped[baseVoiceId].pro = voice;
      }
    });

    setGroupedVoices(Object.values(grouped));
  };

  const loadUserSettings = async () => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('voice_id, voice_style_instructions')
      .eq('user_id', userId)
      .single();

    if (data) {
      setSelectedVoiceId((data as any).voice_id);
      setStyleInstructions((data as any).voice_style_instructions || DEFAULT_STYLE_INSTRUCTIONS);
    }
  };

  const filterVoices = () => {
    let filtered = [...groupedVoices];

    // Gender filter
    if (genderFilter !== 'all') {
      filtered = filtered.filter(v => v.gender === genderFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.baseName.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query)
      );
    }

    setFilteredGroupedVoices(filtered);
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
      } as any, {
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

  const saveStyleInstructions = async () => {
    setSaving(true);

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        voice_style_instructions: styleInstructions,
        updated_at: new Date().toISOString(),
      } as any, {
        onConflict: 'user_id',
      });

    setSaving(false);

    if (error) {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom čuvanja stilskih instrukcija.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Uspešno",
        description: "Stilske instrukcije su sačuvane.",
      });
    }
  };

  const getSelectedModel = (baseVoiceId: string): 'flash' | 'pro' => {
    return selectedModels[baseVoiceId] || 'flash';
  };

  const setSelectedModel = (baseVoiceId: string, model: 'flash' | 'pro') => {
    setSelectedModels(prev => ({ ...prev, [baseVoiceId]: model }));
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
        {/* Style Instructions */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Stilske Instrukcije</label>
            <p className="text-xs text-muted-foreground mt-1">
              Opišite kako želite da glas zvuči (ton, tempo, akcenat, stil isporuke)
            </p>
          </div>
          <Textarea
            value={styleInstructions}
            onChange={(e) => setStyleInstructions(e.target.value)}
            placeholder={DEFAULT_STYLE_INSTRUCTIONS}
            className="min-h-[100px]"
          />
          <div className="flex gap-2">
            <Button
              onClick={saveStyleInstructions}
              disabled={saving}
              size="sm"
            >
              {saving ? 'Čuvanje...' : 'Sačuvaj Instrukcije'}
            </Button>
            <Button
              onClick={() => setStyleInstructions(DEFAULT_STYLE_INSTRUCTIONS)}
              variant="outline"
              size="sm"
            >
              Vrati na Podrazumevano
            </Button>
          </div>
        </div>

        <div className="border-t pt-6" />

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
        </div>

        {/* Voice Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroupedVoices.map((groupedVoice) => {
            const selectedModel = getSelectedModel(groupedVoice.baseVoiceId);
            const currentVoice = selectedModel === 'flash' ? groupedVoice.flash : groupedVoice.pro;
            const currentVoiceId = currentVoice?.voice_id || '';

            // Check if this grouped voice contains the selected voice (either flash or pro variant)
            const isSelected = selectedVoiceId === groupedVoice.flash?.voice_id ||
              selectedVoiceId === groupedVoice.pro?.voice_id;

            return (
              <div
                key={groupedVoice.baseVoiceId}
                className={`relative group rounded-lg border-2 p-4 transition-all cursor-pointer hover:shadow-lg ${isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/50'
                  }`}
                onClick={() => currentVoice && selectVoice(currentVoice.voice_id)}
              >
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-primary rounded-full p-1">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}

                {/* Voice Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{groupedVoice.baseName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {groupedVoice.gender === 'male' ? 'Muški' : 'Ženski'}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {groupedVoice.description}
                  </p>

                  {/* Model Selector */}
                  <div className="flex gap-2">
                    <Button
                      variant={selectedModel === 'flash' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModel(groupedVoice.baseVoiceId, 'flash');
                      }}
                      disabled={!groupedVoice.flash}
                    >
                      Flash
                    </Button>
                    <Button
                      variant={selectedModel === 'pro' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModel(groupedVoice.baseVoiceId, 'pro');
                      }}
                      disabled={!groupedVoice.pro}
                    >
                      Pro
                    </Button>
                  </div>

                  {/* Preview Button */}
                  <Button
                    variant={playingVoice === currentVoiceId ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      playPreview(currentVoice?.preview_url || null, currentVoiceId);
                    }}
                    disabled={!currentVoice?.preview_url}
                  >
                    {playingVoice === currentVoiceId ? (
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
            );
          })}
        </div>

        {/* No Results */}
        {filteredGroupedVoices.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nema pronađenih glasova</p>
            <p className="text-sm">Pokušajte promeniti filtere ili pretragu</p>
          </div>
        )}

        {/* Count */}
        <div className="text-sm text-muted-foreground text-center">
          Prikazano {filteredGroupedVoices.length} od {groupedVoices.length} glasova
        </div>
      </CardContent>
    </Card>
  );
}
