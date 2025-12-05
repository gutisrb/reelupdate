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

interface UserSettings {
  logo_url: string | null;
  logo_position: string;
  logo_size_percent: number;
}

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
      const settings = data as unknown as UserSettings;
      setLogoUrl(settings.logo_url);
      setLogoPosition(settings.logo_position);
      setLogoSize(settings.logo_size_percent);
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
        description: "Podešavanja loga su sačuvana.",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* LEFT COLUMN - CONTROLS */}
      <div className="space-y-6 overflow-y-auto pb-20">
        <Card>
          <CardHeader>
            <CardTitle>Logo Upload</CardTitle>
            <CardDescription>Upload your brand logo (PNG, SVG recommended)</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Logo Upload */}
            <div className="space-y-4">
              {logoUrl ? (
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">Logo uploaded</p>
                    <Button variant="outline" size="sm" onClick={removeLogo}>
                      <X className="h-4 w-4 mr-2" />
                      Remove Logo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <Label htmlFor="logo-upload" className="cursor-pointer block w-full h-full">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">
                      {uploading ? 'Uploading...' : 'Click to upload logo'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, SVG up to 2MB
                    </p>
                  </Label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Position & Size</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Position */}
            <div className="space-y-4">
              <Label>Position</Label>
              <div className="grid grid-cols-3 gap-3">
                {LOGO_POSITIONS.map((position) => (
                  <button
                    key={position.value}
                    onClick={() => setLogoPosition(position.value)}
                    className={`p-3 rounded-lg border transition-all flex flex-col items-center justify-center gap-2 ${logoPosition === position.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                      }`}
                  >
                    <span className="text-xl">{position.icon}</span>
                    <span className="text-xs font-medium text-center">{position.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Logo Size */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Size</Label>
                <span className="text-sm text-muted-foreground">{logoSize}%</span>
              </div>
              <Slider
                value={[logoSize]}
                onValueChange={(value) => setLogoSize(value[0])}
                min={10}
                max={25}
                step={1}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button onClick={saveSettings} disabled={saving} size="lg">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* RIGHT COLUMN - PREVIEW */}
      <div className="hidden lg:block relative">
        <div className="sticky top-0">
          <Card className="overflow-hidden border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>See how your logo looks on a video</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative w-full max-w-[320px] mx-auto aspect-[9/16] rounded-3xl overflow-hidden border-4 border-gray-900 shadow-2xl bg-black">
                {/* Video Background */}
                <video
                  src="https://res.cloudinary.com/dyarnpqaq/video/upload/v1764418592/b954d382-6941-4b58-9c03-4eccceeb9dae_resultf68dc3e6237c62b1_u7jqyz_apivdl.mp4"
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                  autoPlay
                  loop
                  muted
                  playsInline
                />

                {/* Logo Overlay */}
                {logoUrl && (
                  <div
                    className={`absolute transition-all duration-300 ${logoPosition === 'watermark'
                      ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50'
                      : logoPosition === 'corner_top_left'
                        ? 'top-6 left-6'
                        : logoPosition === 'corner_top_right'
                          ? 'top-6 right-6'
                          : logoPosition === 'corner_bottom_left'
                            ? 'bottom-24 left-6' // Adjusted for captions area
                            : 'bottom-24 right-6'
                      }`}
                    style={{ width: `${logoSize}%` }}
                  >
                    <img src={logoUrl} alt="Logo" className="w-full h-auto drop-shadow-lg" />
                  </div>
                )}

                {!logoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm text-white text-sm">
                      Upload a logo to preview
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
