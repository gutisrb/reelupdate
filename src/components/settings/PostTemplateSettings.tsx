import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PostTemplateSettingsProps {
  userId: string;
}

const AVAILABLE_VARIABLES = [
  { key: '{title}', description: 'Naslov nekretnine' },
  { key: '{location}', description: 'Lokacija' },
  { key: '{price}', description: 'Cena' },
  { key: '{size}', description: 'Kvadratura' },
  { key: '{beds}', description: 'Broj soba' },
  { key: '{baths}', description: 'Broj kupatila' },
  { key: '{sprat}', description: 'Sprat' },
  { key: '{extras}', description: 'Dodatne pogodnosti' },
];

const DEFAULT_TEMPLATE = `🏡 {title}

📍 Lokacija: {location}
💰 Cena: {price}€
📐 Kvadratura: {size}m²
🛏️ Sobe: {beds}
🚿 Kupatila: {baths}
🏢 Sprat: {sprat}

✨ {extras}

📞 Pozovite nas za više informacija!

#nekretnine #stanovi #prodaja #real estate`;

export function PostTemplateSettings({ userId }: PostTemplateSettingsProps) {
  const [template, setTemplate] = useState('');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [userId]);

  useEffect(() => {
    // Generate preview with sample data
    const sampleData = {
      title: 'Dvoiposoban stan u centru',
      location: 'Beograd, Vračar',
      price: '120,000',
      size: '65',
      beds: '2.5',
      baths: '1',
      sprat: '4/6',
      extras: 'Lift, parking, terasa',
    };

    let previewText = template;
    Object.entries(sampleData).forEach(([key, value]) => {
      previewText = previewText.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });

    setPreview(previewText);
  }, [template]);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('post_description_template')
      .eq('user_id', userId)
      .single();

    if (data?.post_description_template) {
      setTemplate(data.post_description_template);
    } else {
      setTemplate(DEFAULT_TEMPLATE);
    }
  };

  const saveSettings = async () => {
    setSaving(true);

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        post_description_template: template,
        updated_at: new Date().toISOString(),
      });

    setSaving(false);

    if (error) {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom čuvanja template-a.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Uspešno",
        description: "Post template je sačuvan.",
      });
    }
  };

  const insertVariable = (variable: string) => {
    setTemplate((prev) => prev + variable);
  };

  const resetToDefault = () => {
    setTemplate(DEFAULT_TEMPLATE);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post Description Template</CardTitle>
        <CardDescription>
          Kreirajte template za opis posta koji će biti generisan uz video
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="template">Template Tekst</Label>
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              Vrati na podrazumevani
            </Button>
          </div>
          <Textarea
            id="template"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            placeholder="Unesite template sa promenljivim..."
          />
        </div>

        {/* Available Variables */}
        <div className="space-y-4">
          <Label>Dostupne Promenljive</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {AVAILABLE_VARIABLES.map((variable) => (
              <Button
                key={variable.key}
                variant="outline"
                size="sm"
                onClick={() => insertVariable(variable.key)}
                className="justify-start text-xs"
              >
                <code className="bg-muted px-1 rounded">{variable.key}</code>
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Kliknite na promenljivu da je dodate u template. Promenljive će biti zamenjene stvarnim vrednostima.
          </p>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="border rounded-lg p-4 bg-muted/50 whitespace-pre-wrap min-h-[200px]">
            {preview || 'Unesite template da vidite preview...'}
          </div>
          <p className="text-xs text-muted-foreground">
            Preview prikazuje kako će izgledati post sa primernim podacima
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? 'Čuvanje...' : 'Sačuvaj Template'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
