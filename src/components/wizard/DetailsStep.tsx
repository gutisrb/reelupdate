// src/components/wizard/DetailsStep.tsx
import React, { useState, useEffect } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PresetScroll } from "./PresetScroll";
import { HookInputWithPresets } from "./HookPresetCombobox";
import { VisualHookSelector } from "./VisualHookSelector";

// Updated FormData to match WizardContext
type FormData = {
  title: string;
  price: string;
  location: string;
  size?: string;
  beds?: string;
  baths?: string;
  sprat?: string;
  extras?: string;
  logo_size?: number;
  director_personality?: string;
  property_type?: string;
  script_hook?: string;
  visual_hook?: string;
};

interface DetailsStepProps {
  formData: FormData;
  updateFormData: (data: FormData) => void;
  nextStep: () => void;
  canProceed: boolean;
  isLoading?: boolean;
}

const ROOM_OPTIONS = [
  "Garsonjera",
  "Jednosoban",
  "Jednoiposoban",
  "Dvosoban",
  "Dvoiposoban",
  "Trosoban",
  "Troiposoban",
  "Četvorosoban",
  "Četvoroiposoban",
  "Petosoban",
  "Šestosoban",
  "7+ soba"
];

const PROPERTY_TYPES = [
  { value: "stan", label: "Stan" },
  { value: "kuca", label: "Kuća" },
  { value: "poslovni", label: "Poslovni Prostor" },
  { value: "zemljiste", label: "Zemljište" },
  { value: "garaza", label: "Garaža" }
];

const DetailsStep: React.FC<DetailsStepProps> = ({
  formData,
  updateFormData,
  nextStep,
  canProceed,
  isLoading = false,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!formData.property_type) {
      updateFormData({ ...formData, property_type: 'stan' });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    updateFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canProceed) nextStep();
  };

  const handlePresetSelect = (data: any) => {
    // Merge preset data with current form, but keep title/price/location if preset doesn't have them? 
    // Usually presets are "complete configs" or "partial configs". 
    // Let's assume complete overwrite for matched fields, but safeguard.
    const merged = { ...formData, ...data };
    updateFormData(merged);
  };

  // Mobile: Accordion Layout
  if (isMobile) {
    return (
      <div className="bg-surface rounded-2xl p-4 shadow-card border border-border">
        <PresetScroll
          type="wizard"
          onSelect={handlePresetSelect}
          currentData={formData}
          className="mb-6"
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Accordion type="multiple" defaultValue={["osnovni", "viral"]} className="space-y-3">
            <AccordionItem value="osnovni" className="border border-border rounded-xl px-4 bg-surface">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">Osnovni podaci</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-4">
                {/* Fields... (Simplified for brevity, reusing logic) */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Naslov</Label>
                  <Input name="title" value={formData.title} onChange={handleChange} className="h-12" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Tip</Label>
                    <Select value={formData.property_type || "stan"} onValueChange={(v) => handleSelectChange('property_type', v)}>
                      <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                      <SelectContent>{PROPERTY_TYPES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Cena (€)</Label>
                    <Input name="price" value={formData.price} onChange={handleChange} className="h-12" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Lokacija</Label>
                  <Input name="location" value={formData.location} onChange={handleChange} className="h-12" />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="specifikacija" className="border border-border rounded-xl px-4 bg-surface">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">Specifikacija</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-4">
                {/* Fields... */}
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground mb-2 block">m²</Label><Input name="size" value={formData.size || ""} onChange={handleChange} className="h-12" /></div>
                  <div><Label className="text-xs text-muted-foreground mb-2 block">Sprat</Label><Input name="sprat" value={formData.sprat || ""} onChange={handleChange} className="h-12" /></div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Struktura</Label>
                  <Select value={formData.beds || ""} onValueChange={(v) => handleSelectChange('beds', v)}>
                    <SelectTrigger className="h-12"><SelectValue placeholder="Izaberi" /></SelectTrigger>
                    <SelectContent>{ROOM_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-muted-foreground mb-2 block">Kupatila</Label><Input name="baths" value={formData.baths || ""} onChange={handleChange} className="h-12" /></div>
                <div><Label className="text-xs text-muted-foreground mb-2 block">Dodatno</Label><Textarea name="extras" value={formData.extras || ""} onChange={handleChange} className="min-h-[80px]" /></div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="viral" className="border border-indigo-100 dark:border-indigo-900/50 rounded-xl px-4 bg-indigo-50/5 dark:bg-indigo-950/10">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline text-indigo-700 dark:text-indigo-300">✨ Viralna Strategija</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-4">
                <div className="bg-surface border border-border/50 rounded-lg p-3">
                  <Label className="text-xs text-muted-foreground mb-2 block">Vibe</Label>
                  <Select value={formData.director_personality || "auto"} onValueChange={(v) => handleSelectChange('director_personality', v)}>
                    <SelectTrigger className="h-11 w-full bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">🤖 Auto</SelectItem>
                      <SelectItem value="bold">🦁 Bold</SelectItem>
                      <SelectItem value="luxury">💎 Luxury</SelectItem>
                      <SelectItem value="funny">😂 Funny</SelectItem>
                      <SelectItem value="mystery">🕵️ Mystery</SelectItem>
                      <SelectItem value="professional">👔 Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-foreground/80 block mt-2">Manual Overrides</Label>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Script Hook</Label>
                    <HookInputWithPresets
                      type="script_hook"
                      value={formData.script_hook || ""}
                      onChange={(v) => updateFormData({ ...formData, script_hook: v })}
                      placeholder="Prva rečenica..."
                      multiline
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Visual Hook</Label>
                    <HookInputWithPresets
                      type="visual_hook"
                      value={formData.visual_hook || ""}
                      onChange={(v) => updateFormData({ ...formData, visual_hook: v })}
                      placeholder="Prvi kadar..."
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </form>
      </div>
    );
  }

  // Desktop
  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8">

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-16 items-start">
        {/* Left Col */}
        <div className="col-span-1 xl:col-span-8 space-y-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/40">
            <div className="h-8 w-1.5 bg-gradient-to-b from-primary to-accent-cyan rounded-full shadow-sm" />
            <h3 className="text-base font-bold uppercase tracking-widest text-foreground/80">Osnovne Informacije</h3>
          </div>

          <div className="space-y-8 p-6 rounded-xl border border-border/50 bg-white/50 dark:bg-black/10 transition-all hover:bg-white/70 dark:hover:bg-black/20">
            <div>
              <Label className="text-13 text-muted-foreground mb-1.5 block">Naslov Oglasa</Label>
              <Input name="title" value={formData.title} onChange={handleChange} className="h-12 bg-background/50 hover:bg-background transition-colors focus:ring-1 focus:ring-primary/20" placeholder="npr. Luksuzan stan na Vračaru" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-13 text-muted-foreground mb-1.5 block">Tip Nekretnine</Label>
                <Select value={formData.property_type || "stan"} onValueChange={(v) => handleSelectChange('property_type', v)}>
                  <SelectTrigger className="h-12 bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{PROPERTY_TYPES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-13 text-muted-foreground mb-1.5 block">Cena (€)</Label>
                <Input name="price" value={formData.price} onChange={handleChange} className="h-12 bg-background/50" placeholder="245.000" />
              </div>
            </div>
            <div>
              <Label className="text-13 text-muted-foreground mb-1.5 block">Lokacija</Label>
              <Input name="location" value={formData.location} onChange={handleChange} className="h-12 bg-background/50" placeholder="npr. Vračar, Beograd" />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-12 mb-6 pb-4 border-b border-border/40">
            <div className="h-8 w-1.5 bg-gradient-to-b from-primary/70 to-accent-cyan/70 rounded-full shadow-sm" />
            <h3 className="text-base font-bold uppercase tracking-widest text-foreground/80">Specifikacija</h3>
          </div>

          <div className="space-y-8 p-6 rounded-xl border border-border/50 bg-white/50 dark:bg-black/10 transition-all hover:bg-white/70 dark:hover:bg-black/20">
            <div className="grid grid-cols-2 gap-6">
              <div><Label className="text-13 text-muted-foreground mb-1.5 block">Površina (m²)</Label><Input name="size" value={formData.size || ""} onChange={handleChange} className="h-12 bg-background/50" /></div>
              <div>
                <Label className="text-13 text-muted-foreground mb-1.5 block">Struktura</Label>
                <Select value={formData.beds || ""} onValueChange={(v) => handleSelectChange('beds', v)}>
                  <SelectTrigger className="h-12 bg-background/50"><SelectValue placeholder="Izaberi" /></SelectTrigger>
                  <SelectContent>{ROOM_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div><Label className="text-13 text-muted-foreground mb-1.5 block">Sprat</Label><Input name="sprat" value={formData.sprat || ""} onChange={handleChange} className="h-12 bg-background/50" /></div>
              <div><Label className="text-13 text-muted-foreground mb-1.5 block">Kupatila</Label><Input name="baths" value={formData.baths || ""} onChange={handleChange} className="h-12 bg-background/50" /></div>
            </div>
            <div>
              <Label className="text-13 text-muted-foreground mb-1.5 block">Dodatne karakteristike</Label>
              <Textarea name="extras" value={formData.extras || ""} onChange={handleChange} className="min-h-[120px] resize-none bg-background/50" placeholder="Garaža, terasa..." />
            </div>
          </div>
        </div>

        {/* Right Col */}
        <div className="col-span-1 xl:col-span-4 relative h-full">
          {/* Glassmorphism Card */}
          <div className="relative overflow-hidden bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-6 sticky top-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] ring-1 ring-black/5 dark:ring-white/5 transition-all duration-500 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.12)]">

            {/* Header with Gradient Text */}
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  AI Režiser Studio
                </h3>
                <p className="text-xs text-muted-foreground font-medium">Virtuelni kreativni direktor</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Director Personality Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground/80">Karakter Režisera (Vibe)</Label>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">Stil</span>
                </div>

                <Select value={formData.director_personality || "auto"} onValueChange={(v) => handleSelectChange('director_personality', v)}>
                  <SelectTrigger className="h-14 w-full bg-background/50 border-indigo-100 dark:border-indigo-800/50 backdrop-blur-sm rounded-xl hover:bg-background/80 transition-all font-medium text-base shadow-sm group">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] p-1 glass-panel border-indigo-100/50">
                    <SelectItem value="auto" className="rounded-lg py-2.5 px-3 focus:bg-indigo-50 dark:focus:bg-indigo-900/30 cursor-pointer mb-1">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          <Wand2 className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-sm">🤖 Automatski</span>
                          <span className="text-[10px] text-muted-foreground">AI analizira i bira najbolje</span>
                        </div>
                      </div>
                    </SelectItem>

                    <div className="h-px bg-border/50 my-1 mx-2" />

                    <SelectItem value="bold" className="rounded-lg py-2.5 px-3 focus:bg-indigo-50 dark:focus:bg-indigo-900/30 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🦁</span>
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-sm">Dinamičan</span>
                          <span className="text-[10px] text-muted-foreground">Brz, atraktivan, moderan</span>
                        </div>
                      </div>
                    </SelectItem>

                    <SelectItem value="luxury" className="rounded-lg py-2.5 px-3 focus:bg-indigo-50 dark:focus:bg-indigo-900/30 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">💎</span>
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-sm">Luksuzan</span>
                          <span className="text-[10px] text-muted-foreground">Elegantan, spor, premium</span>
                        </div>
                      </div>
                    </SelectItem>

                    <SelectItem value="professional" className="rounded-lg py-2.5 px-3 focus:bg-indigo-50 dark:focus:bg-indigo-900/30 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">👔</span>
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-sm">Profesionalan</span>
                          <span className="text-[10px] text-muted-foreground">Ozbiljan, informativan, korporativan</span>
                        </div>
                      </div>
                    </SelectItem>

                    <SelectItem value="mystery" className="rounded-lg py-2.5 px-3 focus:bg-indigo-50 dark:focus:bg-indigo-900/30 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🕵️</span>
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-sm">Misteriozan</span>
                          <span className="text-[10px] text-muted-foreground">Teasing, cinematic, radoznao</span>
                        </div>
                      </div>
                    </SelectItem>

                    <SelectItem value="funny" className="rounded-lg py-2.5 px-3 focus:bg-indigo-50 dark:focus:bg-indigo-900/30 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">😂</span>
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-sm">Duhovit</span>
                          <span className="text-[10px] text-muted-foreground">Zabavan, opušten, engaging</span>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-indigo-100 dark:border-indigo-800/40"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-transparent px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 backdrop-blur-sm">Advanced Controls</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-foreground/80 mb-4 block flex justify-between items-center">
                  Finog Podešavanja
                  <span className="text-[10px] font-normal text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md">Opciono</span>
                </Label>
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs text-muted-foreground block flex justify-between">Uvodna rečenica <span className="text-[10px] opacity-70">(Hook)</span></Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="script-auto-mode"
                          checked={!formData.script_hook}
                          onCheckedChange={(c) => c && updateFormData({ ...formData, script_hook: "" })}
                          className="scale-75 data-[state=checked]:bg-indigo-500"
                        />
                        <Label htmlFor="script-auto-mode" className="text-[10px] font-medium cursor-pointer text-muted-foreground">
                          AI Auto
                        </Label>
                      </div>
                    </div>

                    <div className="relative">
                      {!formData.script_hook && (
                        <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-md border border-dashed border-indigo-200 dark:border-indigo-800 pointer-events-none">
                          <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-full shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            AI će generisati najbolji hook
                          </div>
                        </div>
                      )}

                      <HookInputWithPresets
                        type="script_hook"
                        value={formData.script_hook || ""}
                        onChange={(v) => updateFormData({ ...formData, script_hook: v })}
                        placeholder="npr. Ovo je stan iz snova..."
                        multiline
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block flex justify-between">Vizuelni Uvod <span className="text-[10px] opacity-70">(Prvi kadar)</span></Label>
                    <VisualHookSelector
                      value={formData.visual_hook || ""}
                      onChange={(v) => updateFormData({ ...formData, visual_hook: v })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export { DetailsStep };
export default DetailsStep;
