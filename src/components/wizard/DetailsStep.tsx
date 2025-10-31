// src/components/wizard/DetailsStep.tsx
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FormData = {
  title: string;
  price: string;
  location: string;
  size?: string;
  beds?: string;
  baths?: string;
  sprat?: string;
  extras?: string;
};

interface DetailsStepProps {
  formData: FormData;
  updateFormData: (data: FormData) => void; // <-- we use only this to change fields
  nextStep: () => void;
  canProceed: boolean;
  isLoading?: boolean;
}

const DetailsStep: React.FC<DetailsStepProps> = ({
  formData,
  updateFormData,
  nextStep,
  canProceed,
  isLoading = false,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll focused input into view on mobile
  useEffect(() => {
    if (isMobile && focusedField) {
      const element = document.getElementById(focusedField);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [focusedField, isMobile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Update the full formData object; no external onChange prop required
    updateFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canProceed) nextStep();
  };

  const handleFocus = (fieldName: string) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  // Mobile: Accordion Layout
  if (isMobile) {
    return (
      <div className="bg-surface rounded-2xl p-4 shadow-card border border-border">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Accordion type="multiple" defaultValue={["osnovni"]} className="space-y-3">
            {/* Osnovni podaci */}
            <AccordionItem value="osnovni" className="border border-border rounded-xl px-4 bg-surface">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Osnovni podaci
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-4">
                <div>
                  <Label htmlFor="title" className="text-xs text-muted-foreground mb-2 block">Naslov</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    onFocus={() => handleFocus('title')}
                    onBlur={handleBlur}
                    placeholder="npr. Trosoban stan, Vračar"
                    className="h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="price" className="text-xs text-muted-foreground mb-2 block">Cena</Label>
                  <Input
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    onFocus={() => handleFocus('price')}
                    onBlur={handleBlur}
                    placeholder="npr. 245.000 €"
                    className="h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="location" className="text-xs text-muted-foreground mb-2 block">Lokacija</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    onFocus={() => handleFocus('location')}
                    onBlur={handleBlur}
                    placeholder="npr. Vračar, Beograd"
                    className="h-12"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Detalji */}
            <AccordionItem value="detalji" className="border border-border rounded-xl px-4 bg-surface">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Detalji
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-4">
                <div>
                  <Label htmlFor="size" className="text-xs text-muted-foreground mb-2 block">Površina (m²)</Label>
                  <Input
                    id="size"
                    name="size"
                    value={formData.size || ""}
                    onChange={handleChange}
                    onFocus={() => handleFocus('size')}
                    onBlur={handleBlur}
                    className="h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="beds" className="text-xs text-muted-foreground mb-2 block">Spavaće sobe</Label>
                  <Input
                    id="beds"
                    name="beds"
                    value={formData.beds || ""}
                    onChange={handleChange}
                    onFocus={() => handleFocus('beds')}
                    onBlur={handleBlur}
                    className="h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="baths" className="text-xs text-muted-foreground mb-2 block">Kupatila</Label>
                  <Input
                    id="baths"
                    name="baths"
                    value={formData.baths || ""}
                    onChange={handleChange}
                    onFocus={() => handleFocus('baths')}
                    onBlur={handleBlur}
                    className="h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="sprat" className="text-xs text-muted-foreground mb-2 block">Sprat</Label>
                  <Input
                    id="sprat"
                    name="sprat"
                    value={formData.sprat || ""}
                    onChange={handleChange}
                    onFocus={() => handleFocus('sprat')}
                    onBlur={handleBlur}
                    className="h-12"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Dodatno */}
            <AccordionItem value="dodatno" className="border border-border rounded-xl px-4 bg-surface">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Dodatno
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-4">
                <div>
                  <Label htmlFor="extras" className="text-xs text-muted-foreground mb-2 block">Dodatne karakteristike</Label>
                  <Input
                    id="extras"
                    name="extras"
                    value={formData.extras || ""}
                    onChange={handleChange}
                    onFocus={() => handleFocus('extras')}
                    onBlur={handleBlur}
                    placeholder="npr. Garaža, terasa, lift…"
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground/70 mt-2">Garaža, terasa, lift ili druge značajne karakteristike</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </form>
      </div>
    );
  }

  // Desktop: Grid Layout
  return (
    <div className="bg-surface rounded-2xl p-6 shadow-card border border-border">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div>
          <Label htmlFor="title" className="text-13 text-muted-foreground mb-2 block">Naslov</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="npr. Trosoban stan, Vračar"
            className="h-11"
          />
        </div>

        <div>
          <Label htmlFor="price" className="text-13 text-muted-foreground mb-2 block">Cena</Label>
          <Input
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="npr. 245.000 €"
            className="h-11"
          />
        </div>

        <div className="md:col-span-2 border-t border-border/30 pt-6">
          <Label htmlFor="location" className="text-13 text-muted-foreground mb-2 block">Lokacija</Label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="npr. Vračar, Beograd"
            className="h-11"
          />
        </div>

        <div>
          <Label htmlFor="size" className="text-13 text-muted-foreground mb-2 block">Površina (m²)</Label>
          <Input
            id="size"
            name="size"
            value={formData.size || ""}
            onChange={handleChange}
            className="h-11"
          />
        </div>

        <div>
          <Label htmlFor="beds" className="text-13 text-muted-foreground mb-2 block">Spavaće sobe</Label>
          <Input
            id="beds"
            name="beds"
            value={formData.beds || ""}
            onChange={handleChange}
            className="h-11"
          />
        </div>

        <div>
          <Label htmlFor="baths" className="text-13 text-muted-foreground mb-2 block">Kupatila</Label>
          <Input
            id="baths"
            name="baths"
            value={formData.baths || ""}
            onChange={handleChange}
            className="h-11"
          />
        </div>

        <div>
          <Label htmlFor="sprat" className="text-13 text-muted-foreground mb-2 block">Sprat</Label>
          <Input
            id="sprat"
            name="sprat"
            value={formData.sprat || ""}
            onChange={handleChange}
            className="h-11"
          />
        </div>

        <div className="md:col-span-2 border-t border-border/30 pt-6">
          <Label htmlFor="extras" className="text-13 text-muted-foreground mb-2 block">Dodatno</Label>
          <Input
            id="extras"
            name="extras"
            value={formData.extras || ""}
            onChange={handleChange}
            placeholder="npr. Garaža, terasa, lift…"
            className="h-11"
          />
          <p className="text-13 text-muted-foreground/70 mt-1">Garaža, terasa, lift ili druge značajne karakteristike</p>
        </div>
      </form>
    </div>
  );
};

export { DetailsStep };
export default DetailsStep;
