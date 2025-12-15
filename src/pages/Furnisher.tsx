// src/pages/Furnisher.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MAKE_CREATE_URL, MAKE_STATUS_URL } from '@/config/make';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useWizard } from '@/contexts/WizardContext';
import { Upload, X } from 'lucide-react';

export default function Furnisher() {
  const navigate = useNavigate();
  const { wizardData, updateSlots } = useWizard();
  const [images, setImages] = useState<File[]>([]);
  const [instructions, setInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [slotContext, setSlotContext] = useState<{ slotIndex: number, imageIndex: number } | null>(null);

  // Auto-load image from localStorage when component mounts
  useEffect(() => {
    const loadStagedImage = async () => {
      const stagedImageUrl = localStorage.getItem('stagingInputImage');
      const slotIndexStr = localStorage.getItem('stagingSlotIndex');
      const imageIndexStr = localStorage.getItem('stagingImageIndex');

      if (stagedImageUrl) {
        try {
          const response = await fetch(stagedImageUrl);
          const blob = await response.blob();
          const file = new File([blob], 'staged-image.jpg', { type: blob.type });
          setImages([file]);

          // Load slot context if available
          if (slotIndexStr !== null && imageIndexStr !== null) {
            setSlotContext({
              slotIndex: parseInt(slotIndexStr),
              imageIndex: parseInt(imageIndexStr)
            });
          }

          // Clean up localStorage
          localStorage.removeItem('stagingInputImage');
          localStorage.removeItem('stagingSlotIndex');
          localStorage.removeItem('stagingImageIndex');

          toast.success('Slika je učitana iz Reel Studio-a');
        } catch (error) {
          console.error('Failed to load staged image:', error);
          localStorage.removeItem('stagingInputImage');
          localStorage.removeItem('stagingSlotIndex');
          localStorage.removeItem('stagingImageIndex');
        }
      }
    };

    loadStagedImage();
  }, []);

  const checkStatus = async (jobId: string) => {
    try {
      // Your Make "status" scenario accepts GET with ?jobId=
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('No access token for status check');
        return true; // stop polling
      }

      // Your Make "status" scenario accepts GET with ?jobId=
      const response = await fetch(`${MAKE_STATUS_URL}?jobId=${encodeURIComponent(jobId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store',
      });

      const ct = response.headers.get('content-type') || '';
      if (ct.includes('image/')) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setResultImage(imageUrl);
        setIsProcessing(false);
        return true; // stop polling
      } else {
        const result = await response.json();
        if (result.status === 'processing') {
          return false; // keep polling
        } else if (result.status === 'done' && result.url) {
          setResultImage(result.url);
          setIsProcessing(false);
          return true; // stop polling
        } else {
          throw new Error('Unexpected status');
        }
      }
    } catch (error) {
      console.error('Status check error:', error);
      toast.error('Failed to check job status');
      setIsProcessing(false);
      return true; // stop polling on error
    }
  };

  const startPolling = (jobId: string) => {
    const pollInterval = setInterval(async () => {
      const shouldStop = await checkStatus(jobId);
      if (shouldStop) clearInterval(pollInterval);
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      toast.error('Najmanje jedna slika je obavezna');
      return;
    }

    try {
      setIsProcessing(true);
      setResultImage(null);

      const formData = new FormData();

      // ✅ CRITICAL: include user_id for Make → Supabase RPC credit checks
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id;
        if (uid) {
          formData.append('user_id', uid);
        } else {
          toast.error('Niste prijavljeni (user_id nije pronađen).');
          setIsProcessing(false);
          return;
        }
      } catch {
        toast.error('Ne mogu da očitam korisnika (auth).');
        setIsProcessing(false);
        return;
      }

      // Always send image1
      formData.append('image1', images[0]);

      // Always send image2 KEY:
      // - if there is a second image → send it
      // - else → send empty string so the key exists (your Make formulas expect it)
      if (images.length >= 2) {
        formData.append('image2', images[1]);
      } else {
        formData.append('image2', '');
      }

      // Clean instructions: remove leading/trailing whitespace and normalize newlines
      const cleanedInstructions = instructions.trim().replace(/\n+/g, ' ');
      formData.append('instructions', cleanedInstructions);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('No access token found in session');
        toast.error('Sesija je istekla. Molimo osvežite stranicu ili se prijavite ponovo.');
        setIsProcessing(false);
        return;
      }

      console.log('Sending request to:', MAKE_CREATE_URL);

      const response = await fetch(MAKE_CREATE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 402) {
          toast.error('Nema image kredita. Nadogradite paket.');
        } else {
          const txt = await response.text().catch(() => '');
          toast.error(`Failed to submit form${txt ? `: ${txt}` : ''}`);
        }
        setIsProcessing(false);
        return;
      }

      const result = await response.json();
      if (!result?.jobId) {
        // If your Make flow sometimes finishes instantly and returns an image URL:
        if (result?.url) {
          setResultImage(result.url);
        } else {
          toast.error('Nedostaje jobId u odgovoru scenarija.');
        }
        setIsProcessing(false);
        return;
      }

      setJobId(result.jobId);
      startPolling(result.jobId);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to generate image');
      setIsProcessing(false);
    }
  };

  const Spinner = () => (
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
  );

  const copyToClipboard = async () => {
    if (resultImage) {
      try {
        await navigator.clipboard.writeText(resultImage);
        toast.success('Link kopiran!');
      } catch {
        toast.error('Greška pri kopiranju');
      }
    }
  };

  const handleRedo = () => {
    setResultImage(null);
    setJobId(null);
    setShowComparison(false);
  };

  const downloadImage = () => {
    if (resultImage) {
      const a = document.createElement('a');
      a.href = resultImage;
      a.download = 'generated-interior.jpg';
      a.click();
    }
  };

  const handleReturnToSlot = async () => {
    if (!resultImage || !slotContext) return;

    try {
      // Convert result image URL to File
      const response = await fetch(resultImage);
      const blob = await response.blob();
      const file = new File([blob], 'edited-image.jpg', { type: blob.type });

      // Update the specific slot with the edited image
      const newSlots = [...wizardData.slots];
      const slot = newSlots[slotContext.slotIndex];

      if (slot) {
        // Replace the image at the specific index
        const newImages = [...slot.images];
        newImages[slotContext.imageIndex] = file;
        newSlots[slotContext.slotIndex] = { ...slot, images: newImages };
        updateSlots(newSlots);

        toast.success('Slika je vraćena u slot');
        navigate('/app/reel');
      }
    } catch (error) {
      console.error('Failed to return image to slot:', error);
      toast.error('Greška pri vraćanju slike');
    }
  };

  const handleReEdit = async () => {
    if (!resultImage) return;

    try {
      // Convert result image to File and use it as new input
      const response = await fetch(resultImage);
      const blob = await response.blob();
      const file = new File([blob], 'result-to-edit.jpg', { type: blob.type });

      setImages([file]);
      setResultImage(null);
      setShowComparison(false);
      toast.success('Slika je učitana za ponovnu obradu');
    } catch (error) {
      console.error('Failed to re-edit image:', error);
      toast.error('Greška pri učitavanju slike');
    }
  };

  // Handle file input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      setImages(prev => [...prev, ...files].slice(0, 2));
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="showtime min-h-screen bg-background">
      <div className="grain-overlay"></div>

      <main className="container mx-auto px-4 pt-20 pb-6 max-w-7xl">
        {/* Header */}
        <h1 className="aurora text-text-primary text-2xl mb-6">Stage Studio</h1>

        {/* Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* Left Panel - Compact Controls */}
          <div className="space-y-4">
            {/* Compact Image Selector */}
            <Card className="card-premium">
              <CardContent className="p-4 space-y-3">
                <Label className="text-sm font-medium">Slike prostora *</Label>

                {/* Image Thumbnails */}
                {images.length > 0 && (
                  <div className="flex gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-border">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                {images.length < 2 && (
                  <div>
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Button
                      onClick={() => document.getElementById('file-upload')?.click()}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {images.length === 0 ? 'Dodaj slike (1-2)' : 'Dodaj još jednu'}
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Najbolji rezultati sa prirodnim osvetljenjem
                </p>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="card-premium">
              <CardContent className="p-4 space-y-3">
                <Label htmlFor="instructions" className="text-sm font-medium">
                  Instrukcije za AI
                </Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="npr. 'Namesti ovaj prazan dnevni boravak u skandinavskom stilu'"
                  rows={4}
                  disabled={isProcessing}
                  className="focus-ring rounded-xl resize-none text-sm"
                />
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleSubmit}
              className="w-full gradient-primary text-white hover-sheen h-12"
              disabled={images.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse [animation-delay:0.4s]"></div>
                  </div>
                  Generisanje…
                </div>
              ) : (
                'Generiši sliku'
              )}
            </Button>
          </div>

          {/* Right Panel - Result Preview */}
          <Card className="card-premium relative lg:min-h-[600px]">
            <CardContent className="p-0">
              <div className="aspect-square lg:aspect-auto lg:h-full relative overflow-hidden rounded-2xl canvas-spotlight shadow-deep border border-border/20">
                {!resultImage && !isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-muted-dark/50 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-lg bg-text-muted/20"></div>
                      </div>
                      <p className="text-helper text-text-muted">Vaš rezultat će biti prikazan ovde</p>
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      {/* Skeleton shimmer */}
                      <div className="w-16 h-16 rounded-2xl skeleton-shimmer"></div>
                      <div className="w-32 h-3 rounded-lg skeleton-shimmer"></div>
                      <div className="w-24 h-2 rounded skeleton-shimmer"></div>
                      <p className="text-helper text-white/60 mt-4">Generisanje u toku...</p>
                    </div>
                  </div>
                )}

                {resultImage && (
                  <>
                    {/* Main result image */}
                    <img
                      src={resultImage}
                      alt="Generated result"
                      className="w-full h-full object-cover reveal-animation"
                    />

                    {/* Before/After comparison overlay */}
                    {showComparison && images[0] && (
                      <div className="absolute inset-0">
                        <div className="absolute inset-0 overflow-hidden">
                          <img
                            src={URL.createObjectURL(images[0])}
                            alt="Original"
                            className="w-full h-full object-cover"
                            style={{ clipPath: 'inset(0 50% 0 0)' }}
                          />
                        </div>
                        {/* Slider handle */}
                        <div className="absolute inset-y-0 left-1/2 w-0.5 aurora-slider-line shadow-lg">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass-slider-handle flex items-center justify-center">
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Toolbar */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      {/* Return to Slot button - only show if we have slot context */}
                      {slotContext && (
                        <button
                          onClick={handleReturnToSlot}
                          className="h-10 px-4 rounded-full toolbar-glass flex items-center gap-2 text-white hover:bg-white/20 transition-all shadow-lg"
                          title="Vrati sliku u Reel Studio"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          <span className="text-sm font-medium">Vrati u slot</span>
                        </button>
                      )}

                      {/* Action buttons row */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleReEdit}
                          className="w-10 h-10 rounded-full toolbar-glass flex items-center justify-center text-white/90 hover:text-white hover:bg-white/20 transition-all"
                          title="Uredi ponovo ovaj rezultat"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={handleRedo}
                          className="w-10 h-10 rounded-full toolbar-glass flex items-center justify-center text-white/90 hover:text-white hover:bg-white/20 transition-all"
                          title="Nova generacija"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button
                          onClick={downloadImage}
                          className="w-10 h-10 rounded-full toolbar-glass flex items-center justify-center text-white/90 hover:text-white hover:bg-white/20 transition-all"
                          title="Preuzmi sliku"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button
                          onClick={copyToClipboard}
                          className="w-10 h-10 rounded-full toolbar-glass flex items-center justify-center text-white/90 hover:text-white hover:bg-white/20 transition-all"
                          title="Kopiraj link"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
