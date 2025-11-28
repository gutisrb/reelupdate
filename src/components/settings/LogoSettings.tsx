import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LogoSettingsProps {
  userId: string;
}

const LOGO_POSITIONS = [
  { value: 'watermark', label: 'Vodeni Žig (Centar)', icon: '💧' },
  { value: 'corner_top_left', label: 'Gore Levo', icon: '↖️' },
  { value: 'corner_top_right', label: 'Gore Desno', icon: '↗️' },
  { value: 'corner_bottom_left', label: 'Dole Levo', icon: '↙️' },
  { value: 'corner_bottom_right', label: 'Dole Desno', icon: '↘️' },
];

export function LogoSettings({ userId }: LogoSettingsProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState('corner_top_right');
  const [logoSize, setLogoSize] = useState(15);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('logo_url, logo_position, logo_size_percent')
      .eq('user_id', userId)
      .single();

    if (data) {
      setLogoUrl(data.logo_url);
      setLogoPosition(data.logo_position);
      setLogoSize(data.logo_size_percent);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Greška",
        description: "Molimo odaberite sliku (PNG, JPG, SVG).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Greška",
        description: "Fajl je prevelik. Maksimalna veličina je 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload to Cloudinary via FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');
      formData.append('folder', `logos/${userId}`);

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dyarnpqaq/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setLogoUrl(data.secure_url);

      toast({
        title: "Uspešno",
        description: "Logo je uspešno otpremljen.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom otpremanja logoa.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => {
    setLogoUrl(null);
  };

  const saveSettings = async () => {
    setSaving(true);

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        logo_url: logoUrl,
        logo_position: logoPosition,
        logo_size_percent: logoSize,
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
        description: "Podešavanja loga su sačuvana.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo i Brending</CardTitle>
        <CardDescription>
          Dodajte vaš logo na videe i prilagodite poziciju i veličinu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-4">
          <Label>Logo Fajl</Label>
          {logoUrl ? (
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Logo je otpremljen</p>
                <Button variant="outline" size="sm" onClick={removeLogo}>
                  <X className="h-4 w-4 mr-2" />
                  Ukloni Logo
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  {uploading ? 'Otpremanje...' : 'Kliknite da otpremite logo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, SVG do 2MB
                </p>
              </Label>
            </div>
          )}
        </div>

        {/* Logo Position */}
        <div className="space-y-4">
          <Label>Pozicija Loga</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {LOGO_POSITIONS.map((position) => (
              <button
                key={position.value}
                onClick={() => setLogoPosition(position.value)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  logoPosition === position.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-2xl mb-1">{position.icon}</div>
                <div className="text-sm font-medium">{position.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Logo Size */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Veličina Loga</Label>
            <span className="text-sm text-muted-foreground">{logoSize}% širine videa</span>
          </div>
          <Slider
            value={[logoSize]}
            onValueChange={(value) => setLogoSize(value[0])}
            min={10}
            max={25}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Preporučeno: 15-20% za optimalan prikaz
          </p>
        </div>

        {/* Preview */}
        {logoUrl && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="relative w-full aspect-[9/16] max-w-xs mx-auto border rounded-lg overflow-hidden bg-muted">
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                Video Preview
              </div>
              {/* Logo overlay */}
              <div
                className={`absolute ${
                  logoPosition === 'watermark'
                    ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30'
                    : logoPosition === 'corner_top_left'
                    ? 'top-4 left-4'
                    : logoPosition === 'corner_top_right'
                    ? 'top-4 right-4'
                    : logoPosition === 'corner_bottom_left'
                    ? 'bottom-4 left-4'
                    : 'bottom-4 right-4'
                }`}
                style={{ width: `${logoSize}%` }}
              >
                <img src={logoUrl} alt="Logo" className="w-full h-auto" />
              </div>
            </div>
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
