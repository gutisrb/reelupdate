import { useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Stepper } from '@/components/Stepper';
import { DetailsStep } from '@/components/wizard/DetailsStep';
import { PhotosStep } from '@/components/wizard/PhotosStep';
import { PreviewStep } from '@/components/wizard/PreviewStep';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useProgress } from '@/contexts/ProgressContext';
import { useWizard } from '@/contexts/WizardContext';
import { compressMappedEntries } from '@/lib/compressWebhookImage';
import { MAKE_VIDEO_URL } from '@/config/make';
import { supabase } from '@/integrations/supabase/client';
import { renderCaptionVideo, type CaptionSettings, type TranscriptSegment } from '@/lib/captionVideoRenderer';

interface VideoWizardProps {
  user: User;
  session: Session;
}

export const VideoWizard = ({ user, session }: VideoWizardProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const { profile, loading: profileLoading } = useProfile(user);
  const { settings: userSettings, loading: settingsLoading } = useUserSettings(user);
  const { progress, setProgress } = useProgress();
  const { 
    wizardData, 
    updateFormData, 
    updateSlots, 
    updateClipCount, 
    setCurrentStep,
    resetWizard
  } = useWizard();

  const nextStep = () => setCurrentStep(wizardData.currentStep < 3 ? (wizardData.currentStep + 1) as 1 | 2 | 3 : 3);
  const prevStep = () => setCurrentStep(wizardData.currentStep > 1 ? (wizardData.currentStep - 1) as 1 | 2 | 3 : 1);

  const canProceedToStep2 = () => !!(wizardData.formData.title && wizardData.formData.price && wizardData.formData.location);
  const canProceedToStep3 = () => wizardData.slots.some(s => s.images.length > 0);

 const createMultipartFormData = async () => {
  // Generate video_id
  const videoId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
    ? crypto.randomUUID() 
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

  // First, collect all images with their intended keys
  const imageEntries: { key: string; file: File }[] = [];
  const grouping: any[] = [];
  let imageIndex = 0;

  wizardData.slots.forEach((slot) => {
    if (slot.images.length === 0) return;

    if (slot.images.length >= 2) {
      // Frame-to-frame: pair the two images
      const firstIndex = imageIndex;
      imageEntries.push({ key: `image_${imageIndex}`, file: slot.images[0] });
      imageIndex++;
      imageEntries.push({ key: `image_${imageIndex}`, file: slot.images[1] });

      grouping.push({
        type: "frame-to-frame",
        files: [firstIndex, imageIndex],
        first_index: firstIndex,
        second_index: imageIndex
      });
      imageIndex++;
    } else {
      // Single image clip
      imageEntries.push({ key: `image_${imageIndex}`, file: slot.images[0] });
      grouping.push({ type: "single", index: imageIndex });
      imageIndex++;
    }
  });

  // Compress images to stay under budget
  const originalCount = imageEntries.length;
  const compressedEntries = await compressMappedEntries(imageEntries, {
    maxW: 1280,
    maxH: 1280,
    quality: 0.72,
    budgetBytes: 4.9 * 1024 * 1024
  });

  // Build FormData with compressed images
  const form = new FormData();
  
  // Form fields
  form.append("title", wizardData.formData.title);
  form.append("price", wizardData.formData.price);
  form.append("location", wizardData.formData.location);
  form.append("size", wizardData.formData.size || "");
  form.append("beds", wizardData.formData.beds || "");
  form.append("baths", wizardData.formData.baths || "");
  form.append("sprat", wizardData.formData.sprat || "");
  form.append("extras", wizardData.formData.extras || "");

  // Append compressed images
  let totalSize = 0;
  compressedEntries.forEach(({ key, file }) => {
    form.append(key, file);
    totalSize += file.size;
  });

  console.log(`📦 Payload size: ${(totalSize / 1024 / 1024).toFixed(2)} MB (${compressedEntries.length} images)`);

  form.append("grouping", JSON.stringify(grouping));
  form.append("slot_mode_info", JSON.stringify(grouping));
  form.append("total_images", String(compressedEntries.length));
  form.append("user_id", user.id);
  form.append("video_id", videoId);

  return { form, originalCount, compressedCount: compressedEntries.length };
};


  const handleGenerate = async () => {
    setIsLoading(true);
    setProgress(20);

    try {
      // Call Supabase Edge Function instead of Make.com
      const { form: multipartData, originalCount, compressedCount } = await createMultipartFormData();
      setProgress(30);

      // Captions will be generated server-side using voiceover script
      // No browser rendering needed
      console.log('[Video Generation] Captions will be added server-side using voiceover script');
      setProgress(35);

      // Get Supabase URL from environment or use default
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/process-video-generation`;

      console.log('📡 Calling Edge Function:', edgeFunctionUrl);

      const res = await fetch(edgeFunctionUrl, {
        method: "POST",
        body: multipartData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      setProgress(90);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.error === 'NO_VIDEO_CREDITS') {
          throw new Error('Nemate dovoljno kredita za generisanje videa.');
        }
        throw new Error(`HTTP ${res.status}: ${errorData.error || 'Unknown error'}`);
      }

      // Show warning if images were dropped
      if (compressedCount < originalCount) {
        toast({ 
          title: "Uspešno poslato!", 
          description: `Fotografije su velike; poslali smo prvih ${compressedCount} fotografija da bismo izbegli grešku. Dodajte manje ili manje fotografija za sledeći put.`,
          duration: 6000
        });
      } else {
        toast({ title: "Uspešno!", description: "Započeli smo generisanje videa." });
      }
      
      setProgress(100);
      
      // Reset wizard after successful submit
      setTimeout(() => {
        resetWizard();
        setProgress(0);
      }, 1200);
    } catch (e) {
      console.error(e);
      toast({ 
        title: "Greška", 
        description: "Došlo je do greške prilikom slanja.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = () => {
    toast({ title: "Sačuvano", description: "Vaš nacrt je sačuvan." });
  };

  return (
    <div className="showtime min-h-[calc(100vh-64px)] bg-background">
      <div className="grain-overlay"></div>
      <main className="container mx-auto px-6 py-8">
        <Stepper currentStep={wizardData.currentStep} />

        <div className="mt-8 relative pb-20">
          {wizardData.currentStep === 1 && (
            <DetailsStep
              formData={wizardData.formData}
              updateFormData={updateFormData}
              nextStep={nextStep}
              canProceed={canProceedToStep2()}
              isLoading={isLoading}
            />
          )}

          {wizardData.currentStep === 2 && (
            <PhotosStep
              slots={wizardData.slots}
              onSlotsChange={updateSlots}
              clipCount={wizardData.clipCount}
              onClipCountChange={updateClipCount}
              onPrev={prevStep}
              onNext={nextStep}
              canProceed={canProceedToStep3()}
            />
          )}
          
          {wizardData.currentStep === 3 && (
            <PreviewStep
              wizardData={wizardData}
              onPrev={prevStep}
              onGenerate={handleGenerate}
              onSaveDraft={handleSaveDraft}
              isLoading={isLoading}
            />
          )}

          {/* Sticky Action Bar */}
          <div className={`sticky-cta ${wizardData.currentStep > 0 ? 'visible' : ''}`}>
            <div className="p-4">
              <div className="container mx-auto flex justify-between items-center">
                {wizardData.currentStep > 1 && (
                  <Button variant="ghost" onClick={prevStep} className="text-muted-foreground">
                    Nazad
                  </Button>
                )}
                <div className="flex-1"></div>
                {wizardData.currentStep === 1 && (
                  <Button 
                    onClick={nextStep} 
                    disabled={!canProceedToStep2() || isLoading}
                    className="gradient-primary text-white hover-sheen"
                  >
                    Sledeći korak
                  </Button>
                )}
                {wizardData.currentStep === 2 && (
                  <Button 
                    onClick={nextStep} 
                    disabled={!canProceedToStep3()}
                    className="gradient-primary text-white hover-sheen"
                  >
                    Sledeći korak
                  </Button>
                )}
                {wizardData.currentStep === 3 && (
                  <Button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="btn-primary-enhanced focus-ring-enhanced h-12 px-6 py-3 gradient-primary text-white hover-sheen"
                  >
                    {isLoading ? "Generišem..." : "Generiši video"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
