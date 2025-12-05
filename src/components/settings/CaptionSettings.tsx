import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CaptionCustomizer } from './CaptionCustomizer';

interface CaptionTemplate {
  id: string;
  name: string;
  zapcap_template_id: string;
  preview_image_url: string | null;
  style_description: string;
}

interface CaptionSettingsProps {
  userId: string;
}

interface UserSettings {
  caption_template_id: string | null;
  caption_enabled: boolean;
  caption_style_type: string;
  caption_font_family: string;
  caption_font_size: number;
  caption_font_color: string;
  caption_bg_color: string;
  caption_bg_opacity: number;
  caption_system: string;
  caption_font_weight?: string;
  caption_uppercase?: boolean;
  caption_stroke_color?: string;
  caption_stroke_width?: number;
  caption_shadow_color?: string;
  caption_shadow_blur?: number;
  caption_shadow_x?: number;
  caption_shadow_y?: number;
  caption_position?: string;
  caption_animation?: string;
  caption_max_lines?: number;
  caption_emojis?: boolean;
  caption_single_word?: boolean;
}

export function CaptionSettings({ userId }: CaptionSettingsProps) {
  const [templates, setTemplates] = useState<CaptionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionSystem, setCaptionSystem] = useState<'zapcap' | 'whisper'>('whisper');
  const [styleType, setStyleType] = useState<'template' | 'custom'>('template');
  const [customSettings, setCustomSettings] = useState({
    fontFamily: 'Arial',
    fontSize: 34,
    fontColor: 'FFFFFF',
    bgColor: '000000',
    bgOpacity: 100,
    fontWeight: 'bold',
    uppercase: false,
    strokeColor: '000000',
    strokeWidth: 0,
    shadowColor: '000000',
    shadowBlur: 0,
    shadowX: 2,
    shadowY: 2,
    position: 'auto',
    animation: 'none',
    maxLines: 2,
    emojis: false,
    singleWord: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
    loadSettings();
  }, [userId]);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('caption_templates')
      .select('*')
      .eq('active', true)
      .order('sort_order');

    if (error) {
      console.error('Error loading templates:', error);
      return;
    }

    setTemplates(data || []);
    setLoading(false);
  };

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      const settings = data as unknown as UserSettings;
      setSelectedTemplateId(settings.caption_template_id);
      setCaptionsEnabled(settings.caption_enabled);
      setCaptionSystem((settings.caption_system as 'zapcap' | 'whisper') || 'whisper');
      setStyleType(settings.caption_style_type as 'template' | 'custom' || 'template');

      setCustomSettings({
        fontFamily: settings.caption_font_family || 'Arial',
        fontSize: settings.caption_font_size || 34,
        fontColor: settings.caption_font_color || 'FFFFFF',
        bgColor: settings.caption_bg_color || '000000',
        bgOpacity: settings.caption_bg_opacity || 100,
        fontWeight: settings.caption_font_weight || 'bold',
        uppercase: settings.caption_uppercase || false,
        strokeColor: settings.caption_stroke_color || '000000',
        strokeWidth: settings.caption_stroke_width || 0,
        shadowColor: settings.caption_shadow_color || '000000',
        shadowBlur: settings.caption_shadow_blur || 0,
        shadowX: settings.caption_shadow_x || 2,
        shadowY: settings.caption_shadow_y || 2,
        position: settings.caption_position || 'auto',
        animation: settings.caption_animation || 'none',
        maxLines: settings.caption_max_lines || 2,
        emojis: settings.caption_emojis || false,
        singleWord: settings.caption_single_word || false,
      });
    }
  };

  // Categorize templates
  const categorizeTemplates = () => {
    const categories = {
      popular: templates.filter(t => t.name.toLowerCase().includes('hormozi')),
      bold: templates.filter(t => ['Ali', 'Beast', 'Cairo', 'Dan', 'Felix', 'Jason', 'Karl', 'Luke'].includes(t.name)),
      minimal: templates.filter(t => ['Beth', 'Celine', 'Ella', 'Gstaad', 'Lira', 'Maya', 'Sage', 'Sydney'].includes(t.name)),
      colorful: templates.filter(t => ['Devin', 'Iman', 'Jordan', 'Noah', 'Tracy', 'Umi', 'Viktor'].includes(t.name)),
    };
    return categories;
  };

  const categories = categorizeTemplates();

  const saveSettings = async () => {
    setSaving(true);

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        caption_template_id: selectedTemplateId,
        caption_enabled: captionsEnabled,
        caption_system: captionSystem,
        caption_style_type: styleType,
        caption_font_family: customSettings.fontFamily,
        caption_font_size: customSettings.fontSize,
        caption_font_color: customSettings.fontColor,
        caption_bg_color: customSettings.bgColor,
        caption_bg_opacity: customSettings.bgOpacity,
        caption_font_weight: customSettings.fontWeight,
        caption_uppercase: customSettings.uppercase,
        caption_stroke_color: customSettings.strokeColor,
        caption_stroke_width: customSettings.strokeWidth,
        caption_shadow_color: customSettings.shadowColor,
        caption_shadow_blur: customSettings.shadowBlur,
        caption_shadow_x: customSettings.shadowX,
        caption_shadow_y: customSettings.shadowY,
        caption_position: customSettings.position,
        caption_animation: customSettings.animation,
        caption_max_lines: customSettings.maxLines,
        caption_emojis: customSettings.emojis,
        caption_single_word: customSettings.singleWord,
        updated_at: new Date().toISOString(),
      } as any, {
        onConflict: 'user_id'
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
        description: "Podešavanja titlova su sačuvana.",
      });
    }
  };

  if (loading) {
    return <div>Učitavanje...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Titlovi (Captions)</CardTitle>
        <CardDescription>
          Izaberite stil titlova za vaše videe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Captions */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="captions-enabled" className="text-base">
              Omogući Titlove
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatski dodaj titlove na sve videe
            </p>
          </div>
          <Switch
            id="captions-enabled"
            checked={captionsEnabled}
            onCheckedChange={setCaptionsEnabled}
          />
        </div>

        {/* Caption System Selection */}
        {captionsEnabled && (
          <div className="space-y-4">
            <Tabs value={captionSystem} onValueChange={(v) => setCaptionSystem(v as 'zapcap' | 'whisper')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="zapcap">🎨 ZapCap Templates</TabsTrigger>
                <TabsTrigger value="whisper">⚡ Whisper Custom (In-House)</TabsTrigger>
              </TabsList>

              {/* ZapCap System Tab */}
              <TabsContent value="zapcap" className="mt-0 space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>ZapCap Templates:</strong> Uses external ZapCap API for caption generation with pre-designed templates.
                  </p>
                </div>

                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-5 mb-6">
                    <TabsTrigger value="popular">Popularni</TabsTrigger>
                    <TabsTrigger value="bold">Bold</TabsTrigger>
                    <TabsTrigger value="minimal">Minimalni</TabsTrigger>
                    <TabsTrigger value="colorful">Šareni</TabsTrigger>
                    <TabsTrigger value="all">Svi</TabsTrigger>
                  </TabsList>

                  <TabsContent value="popular" className="mt-0">
                    <TemplateCarousel
                      templates={categories.popular}
                      selectedId={selectedTemplateId}
                      onSelect={setSelectedTemplateId}
                    />
                  </TabsContent>

                  <TabsContent value="bold" className="mt-0">
                    <TemplateCarousel
                      templates={categories.bold}
                      selectedId={selectedTemplateId}
                      onSelect={setSelectedTemplateId}
                    />
                  </TabsContent>

                  <TabsContent value="minimal" className="mt-0">
                    <TemplateCarousel
                      templates={categories.minimal}
                      selectedId={selectedTemplateId}
                      onSelect={setSelectedTemplateId}
                    />
                  </TabsContent>

                  <TabsContent value="colorful" className="mt-0">
                    <TemplateCarousel
                      templates={categories.colorful}
                      selectedId={selectedTemplateId}
                      onSelect={setSelectedTemplateId}
                    />
                  </TabsContent>

                  <TabsContent value="all" className="mt-0">
                    <TemplateCarousel
                      templates={templates}
                      selectedId={selectedTemplateId}
                      onSelect={setSelectedTemplateId}
                    />
                  </TabsContent>
                </Tabs>

                {templates.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg mb-2">Nema dostupnih stilova titlova.</p>
                    <p className="text-sm">Kontaktirajte administratora.</p>
                  </div>
                )}
              </TabsContent>

              {/* Whisper System Tab */}
              <TabsContent value="whisper" className="mt-0 space-y-4">
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    <strong>Whisper Custom (In-House):</strong> Uses OpenAI Whisper + Cloudinary for caption generation with full customization control.
                  </p>
                </div>

                <CaptionCustomizer
                  settings={customSettings}
                  onChange={setCustomSettings}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? 'Čuvanje...' : 'Sačuvaj Podešavanja'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Horizontal scrolling carousel component for templates
interface TemplateCarouselProps {
  templates: CaptionTemplate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function TemplateCarousel({ templates, selectedId, onSelect }: TemplateCarouselProps) {
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check scroll position on mount and when templates change
    handleScroll();
  }, [templates]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftButton(scrollLeft > 0);
    setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 300;
    const currentScroll = scrollContainerRef.current.scrollLeft;
    const newPosition = direction === 'left'
      ? currentScroll - scrollAmount
      : currentScroll + scrollAmount;

    scrollContainerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
  };

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nema dostupnih stilova u ovoj kategoriji.</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Left scroll button */}
      {showLeftButton && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg bg-background/95 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className={`relative flex-shrink-0 w-[180px] sm:w-[200px] rounded-xl border-2 overflow-hidden transition-all duration-300 ${selectedId === template.id
              ? 'border-primary ring-4 ring-primary/20 scale-105 shadow-lg'
              : 'border-border hover:border-primary/50 hover:scale-[1.02] hover:shadow-md'
              }`}
          >
            {/* Preview GIF */}
            <div className="aspect-[9/16] bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
              {template.preview_image_url ? (
                <img
                  src={template.preview_image_url}
                  alt={template.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="text-5xl mb-2 font-bold text-muted-foreground">Aa</div>
                    <div className="text-xs text-muted-foreground">
                      Preview unavailable
                    </div>
                  </div>
                </div>
              )}

              {/* Selection indicator */}
              {selectedId === template.id && (
                <div className="absolute top-3 right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <Check className="h-5 w-5 text-primary-foreground" />
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
            </div>

            {/* Template name */}
            <div className="p-4 bg-card">
              <div className="font-semibold text-base text-center">{template.name}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Right scroll button */}
      {showRightButton && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg bg-background/95 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
