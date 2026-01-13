import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Play, Save, Sparkles, MapPin, Home, BedDouble, Bath, Ruler, CheckCircle2, AlertCircle, Edit2, Film } from 'lucide-react';
import { WizardData } from '@/contexts/WizardContext';
import { Badge } from '@/components/ui/badge';

interface PreviewStepProps {
  wizardData: WizardData;
  onPrev: () => void;
  onGenerate: () => void;
  onSaveDraft: () => void;
  isLoading: boolean;
}

export const PreviewStep = ({
  wizardData,
  onPrev,
  onGenerate,
  onSaveDraft,
  isLoading
}: PreviewStepProps) => {
  const {
    formData,
    slots
  } = wizardData;

  const totalImages = slots.reduce((acc, slot) => acc + slot.images.length, 0);
  const totalSlots = slots.length;
  const isReady = totalImages > 0 && formData.title && formData.price;

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8 space-y-8">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Pregled Produkcije
            <Badge variant={isReady ? "default" : "secondary"} className="text-sm px-3 py-1">
              {isReady ? "Spremno za generisanje" : "Nedostaju podaci"}
            </Badge>
          </h2>
          <p className="text-muted-foreground text-lg">
            Proverite sve parametre pre nego što AI režiser preuzme kontrolu.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onSaveDraft} className="gap-2">
            <Save className="w-4 h-4" />
            Sačuvaj nacrt
          </Button>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* Left Column: Strategy & Content (8 cols) */}
        <div className="col-span-1 xl:col-span-8 space-y-8">

          {/* 1. Viral Strategy Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/10 p-8 transition-all hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20">
            <div className="absolute top-4 right-4">
              <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={onPrev}>
                <Edit2 className="w-4 h-4 mr-2" /> Izmeni
              </Button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-indigo-950 dark:text-indigo-100">Viralna Strategija</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Režiser (Vibe)</label>
                <div className="font-medium text-lg capitalize flex items-center gap-2">
                  {formData.director_personality === 'auto' ? '🤖 Auto-Pilot' :
                    formData.director_personality === 'luxury' ? '💎 Luxury' :
                      formData.director_personality === 'bold' ? '🦁 Bold' :
                        formData.director_personality}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Script Hook</label>
                <div className="text-base italic text-foreground/80 bg-background/50 p-3 rounded-lg border border-border/50">
                  "{formData.script_hook || "Automatski generisano..."}"
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visual Hook</label>
                <div className="text-base italic text-foreground/80 bg-background/50 p-3 rounded-lg border border-border/50">
                  "{formData.visual_hook || "Automatski odabrano..."}"
                </div>
              </div>
            </div>
          </div>

          {/* 2. Visual Assets Strip */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Film className="w-5 h-5 text-primary" />
                Vizuelni Materijali
                <span className="text-sm font-normal text-muted-foreground ml-2">({totalImages} slika raspoređeno u {totalSlots} scena)</span>
              </h3>
              <Button size="sm" variant="ghost" onClick={onPrev}>
                <Edit2 className="w-4 h-4 mr-2" /> Izmeni
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {slots.map((slot, idx) => (
                <div key={slot.id} className="aspect-[9/16] relative group rounded-xl overflow-hidden border border-border bg-muted shadow-sm">
                  {slot.images.length > 0 ? (
                    <>
                      <img
                        src={URL.createObjectURL(slot.images[0])}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        alt={`Slot ${idx}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <span className="text-white text-xs font-medium">Slot {idx + 1}</span>
                        {slot.images.length > 1 && <span className="text-white/80 text-[10px]">Animacija ({slot.images.length})</span>}
                      </div>
                      <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white">
                        {idx + 1}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/50">
                      <span className="text-xs text-muted-foreground">Prazno</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Market Data (4 cols) */}
        <div className="col-span-1 xl:col-span-4 space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-card h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Podaci o Nekretnini</h3>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {/* Navigate to step 1 via parent/context if needed, or just rely on stepper */ }}>
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Naslov</label>
                <p className="font-medium text-lg leading-snug mt-1">{formData.title || "Nije uneto"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Cena</label>
                  <p className="font-medium text-xl mt-1 text-primary">{formData.price ? `€${formData.price}` : "—"}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Lokacija</label>
                  <div className="flex items-center gap-1.5 mt-1 text-foreground/80">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {formData.location || "—"}
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50 my-4" />

              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Ruler className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Površina</span>
                  </div>
                  <p className="font-medium">{formData.size ? `${formData.size} m²` : "—"}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Tip</span>
                  </div>
                  <p className="font-medium capitalize">{formData.property_type || "Stan"}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BedDouble className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Sobe</span>
                  </div>
                  <p className="font-medium">{formData.beds || "—"}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Bath className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Kupatila</span>
                  </div>
                  <p className="font-medium">{formData.baths || "—"}</p>
                </div>
              </div>

              {formData.extras && (
                <div className="mt-6 pt-4 border-t border-border/50">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Posebnosti</label>
                  <p className="text-sm text-muted-foreground leading-relaxed">{formData.extras}</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};