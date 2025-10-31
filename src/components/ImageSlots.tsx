import React, { useState } from "react";
import { BulkDropZone } from "./BulkDropZone";
import { SlotsGrid } from "./SlotsGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Upload, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface SlotData {
  id: string;
  mode: "image-to-video" | "frame-to-frame";
  images: File[];
}

interface Props {
  slots: SlotData[];
  onSlotsChange: (slots: SlotData[]) => void;
  totalImages: number;
  clipCount: 5 | 6;
  onNext: () => void;
  onPrev: () => void;
  canProceed: boolean;
}

export function ImageSlots({
  slots,
  onSlotsChange,
  totalImages,
  clipCount,
  onNext,
  onPrev,
  canProceed,
}: Props) {
  const maxImages = clipCount * 2;
  const { toast } = useToast();
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const handleBulkAdd = (files: File[], showToast: boolean = true) => {
    const next = slots.map(s => ({...s, images: [...s.images]}));
    let fileIndex = 0;
    let totalCapacity = clipCount * 2;
    let currentTotal = next.reduce((sum, slot) => sum + slot.images.length, 0);

    // Check if we have capacity
    if (currentTotal >= totalCapacity) {
      if (showToast) {
        toast({
          title: "Nema slobodnih slotova",
          description: "Svi slotovi su popunjeni.",
          variant: "destructive"
        });
      }
      return 0; // Return number of files added
    }

    // Fill all available slots sequentially, max 2 per slot
    for (let slotIndex = 0; slotIndex < clipCount && fileIndex < files.length; slotIndex++) {
      while (next[slotIndex].images.length < 2 && fileIndex < files.length) {
        next[slotIndex].images.push(files[fileIndex++]);
      }
    }

    const filesAdded = fileIndex;
    const filesRejected = files.length - fileIndex;

    // If we couldn't fit all files, show toast
    if (filesRejected > 0 && showToast) {
      toast({
        title: "Nema slobodnih slotova za sve fajlove",
        description: `Prihvaćeno ${filesAdded} od ${files.length} slika.`,
        variant: "destructive"
      });
    }

    onSlotsChange(next);
    return filesAdded; // Return number of files successfully added
  };

  const handleMobileFileSelect = (files: File[]) => {
    setPendingFiles(files);
  };

  const handleConfirmMobileUpload = () => {
    if (pendingFiles.length > 0) {
      const added = handleBulkAdd(pendingFiles, true);
      if (added > 0) {
        toast({
          title: "Slike dodane",
          description: `Uspešno dodato ${added} ${added === 1 ? 'slika' : 'slika'}.`
        });
      }
    }
    setIsBottomSheetOpen(false);
    setPendingFiles([]);
  };

  const handleCancelMobileUpload = () => {
    setIsBottomSheetOpen(false);
    setPendingFiles([]);
  };

  const handleAddPhotos = () => {
    // On mobile, open bottom sheet; on desktop, use file picker
    if (window.innerWidth <= 900) {
      setIsBottomSheetOpen(true);
    } else {
      document.getElementById("bulk-file-input")?.click();
    }
  };

  const handleRefreshAll = () => {
    onSlotsChange(slots.map(s => ({ ...s, images: [] })));
  };

  const availableSlots = clipCount - slots.filter(s => s.images.length >= 1).length;
  const canAddFiles = totalImages < maxImages;

  return (
    <div className="space-y-6 relative">
      {/* Compact toolbar header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-foreground">Fotografije</h3>
          <span className="text-sm text-muted-foreground">Dodato {totalImages}/12</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAddPhotos}
            variant="default"
            size="sm"
            className="h-8 px-3 text-sm min-h-[44px] md:min-h-0"
            disabled={!canAddFiles}
          >
            Dodaj
          </Button>
          {totalImages > 0 && (
            <Button 
              onClick={handleRefreshAll} 
              variant="secondary" 
              size="sm"
              className="h-8 px-3 text-sm"
            >
              Osvježi
            </Button>
          )}
          <span className="text-xs text-muted-foreground ml-2">JPG, PNG</span>
        </div>
      </div>

      {/* Hidden bulk input */}
      <input
        id="bulk-file-input"
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
          if (files.length) handleBulkAdd(files);
          (e.target as HTMLInputElement).value = "";
        }}
      />

      {/* Drop-anywhere grid */}
      <div 
        className="grid-drop-zone transition-all duration-200"
        onDragOver={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).classList.add('drag-over');
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            (e.currentTarget as HTMLElement).classList.remove('drag-over');
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).classList.remove('drag-over');
          const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
          if (files.length) handleBulkAdd(files);
        }}
      >
        <SlotsGrid
          slots={slots}
          onSlotsChange={onSlotsChange}
          clipCount={clipCount}
        />
      </div>

      {/* Desktop: Sticky action bar */}
      <div className="hidden md:block fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-4">
        <div className="glass-bar h-14 px-6 flex items-center justify-between rounded-full border border-white/20">
          <Button
            onClick={onPrev}
            variant="ghost"
            size="sm"
            className="text-sm font-medium hover:bg-white/10"
          >
            Nazad
          </Button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Popunjeno:</span>
            <div className="progress-rail">
              <div
                className="progress-fill"
                style={{
                  width: `${(slots.filter(s => s.images.length >= 1).length / clipCount) * 100}%`
                }}
              />
            </div>
            <span>{slots.filter(s => s.images.length >= 1).length}/{clipCount}</span>
          </div>

          <Button
            onClick={onNext}
            disabled={!canProceed}
            variant="default"
            size="sm"
            className="text-sm px-4 py-2 h-8 rounded-full gradient-primary disabled:opacity-50"
          >
            Sledeći korak
          </Button>
        </div>
      </div>

      {/* Mobile: Floating FAB with progress */}
      <div className="md:hidden fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Progress indicator */}
        <div className="glass-pill px-4 py-2 text-xs font-medium text-foreground shadow-lg">
          Popunjeno: {slots.filter(s => s.images.length >= 1).length}/{clipCount}
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-border/30 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full gradient-primary transition-all duration-300"
            style={{
              width: `${(slots.filter(s => s.images.length >= 1).length / clipCount) * 100}%`
            }}
          />
        </div>

        {/* FAB Button */}
        <Button
          onClick={onNext}
          disabled={!canProceed}
          size="lg"
          className="h-14 w-14 rounded-full gradient-primary shadow-2xl disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95"
          aria-label="Sledeći korak"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>

      {/* Mobile Bottom Sheet for File Upload */}
      <BottomSheet
        open={isBottomSheetOpen}
        onOpenChange={setIsBottomSheetOpen}
        title="Dodaj fotografije"
        description={`Izaberite do ${maxImages - totalImages} slika za preostale slotove`}
      >
        <div className="space-y-4">
          {/* File Preview */}
          {pendingFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Izabrano: {pendingFiles.length} {pendingFiles.length === 1 ? 'slika' : 'slika'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingFiles([])}
                  className="h-8 text-xs"
                >
                  Očisti
                </Button>
              </div>

              {/* Preview Grid */}
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {pendingFiles.map((file, idx) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Auto-fill Preview */}
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-xs text-primary font-medium">
                  Auto-raspored: {Math.min(pendingFiles.length, maxImages - totalImages)} slika će biti raspoređeno po slotovima
                </p>
              </div>
            </div>
          )}

          {/* Drag-Drop Zone */}
          <div
            className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-primary', 'bg-primary/10');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
              const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
              if (files.length) handleMobileFileSelect(files);
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Prevuci i otpusti slike
                </p>
                <p className="text-xs text-muted-foreground">
                  ili klikni za izbor
                </p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                id="mobile-bottom-sheet-input"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
                  if (files.length) handleMobileFileSelect(files);
                  e.target.value = '';
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('mobile-bottom-sheet-input')?.click()}
                className="mt-2"
              >
                Izaberi fajlove
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleCancelMobileUpload}
              className="flex-1"
            >
              Otkaži
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={handleConfirmMobileUpload}
              disabled={pendingFiles.length === 0}
              className="flex-1 gradient-primary"
            >
              <Check className="w-4 h-4 mr-2" />
              Potvrdi ({pendingFiles.length})
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
