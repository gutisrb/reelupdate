import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDrag } from "./DragContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, ArrowRight, Move, MoreHorizontal, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Helper component to manage object URLs for File previews
function ImagePreview({ 
  image, 
  index, 
  children 
}: { 
  image: File; 
  index: number; 
  children: (url: string) => React.ReactNode;
}) {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(image);
    setUrl(objectUrl);
    
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [image]);

  if (!url) return null;
  
  return <>{children(url)}</>;
}

interface SlotCardProps {
  slotIndex: number;
  images: File[];
  isHero: boolean;
  totalSlots: number;
  onImagesChange: (images: File[]) => void;
  onReceiveInternalImage: (data: { fromSlot: number; imageIndex: number; toIndex?: number }) => void;
  onDuplicateToNext: (imageFile: File) => void;
  onReorderSlot: (fromSlot: number, toSlot: number) => void;
  onBulkFilesAdded?: (files: File[], startingSlotIndex: number) => void;
}

export function SlotCard({
  slotIndex,
  images,
  isHero,
  totalSlots,
  onImagesChange,
  onReceiveInternalImage,
  onDuplicateToNext,
  onReorderSlot,
  onBulkFilesAdded,
}: SlotCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [movePopoverOpen, setMovePopoverOpen] = useState(false);
  const { setDragState } = useDrag();
  const { toast } = useToast();
  const navigate = useNavigate();

  const addFiles = (files: File[]) => {
    // If we have a bulk handler and more files than current slot can hold
    if (onBulkFilesAdded && files.length > 0) {
      // Use bulk handler to distribute across all slots starting from current
      onBulkFilesAdded(files, slotIndex);
    } else {
      // Fallback to old behavior (just fill current slot)
      const next = [...images, ...files].slice(0, 2);
      onImagesChange(next);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    // Handle internal image movement
    const dragData = e.dataTransfer.getData("application/json");
    if (dragData) {
      try {
        const data = JSON.parse(dragData);
        if (data.fromSlot !== undefined && data.imageIndex !== undefined) {
          onReceiveInternalImage({
            fromSlot: data.fromSlot,
            imageIndex: data.imageIndex,
            toIndex: undefined
          });
          return;
        }
      } catch (e) {
        console.error("Failed to parse drag data:", e);
      }
    }

    // Handle file drop
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) {
      addFiles(files);
    }
  };

  const onDropIntoIndex = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setIsDragOver(false);

    // Handle internal image movement to specific position
    const dragData = e.dataTransfer.getData("application/json");
    if (dragData) {
      try {
        const data = JSON.parse(dragData);
        if (data.fromSlot !== undefined && data.imageIndex !== undefined) {
          onReceiveInternalImage({
            fromSlot: data.fromSlot,
            imageIndex: data.imageIndex,
            toIndex: targetIndex
          });
          return;
        }
      } catch (e) {
        console.error("Failed to parse drag data:", e);
      }
    }

    // Handle file drop into specific position
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) {
      const next = [...images];
      if (targetIndex < next.length) {
        next[targetIndex] = files[0]; // Replace existing
      } else {
        next.push(files[0]); // Add new
      }
      onImagesChange(next.slice(0, 2));
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, imageIndex: number) => {
    setDraggedImageIndex(imageIndex);
    setDragState(true, { fromSlot: slotIndex, imageIndex });
    
    e.dataTransfer.setData("application/json", JSON.stringify({
      fromSlot: slotIndex,
      imageIndex: imageIndex
    }));
  };

  const handleDragEnd = () => {
    setDraggedImageIndex(null);
    setDragState(false);
  };

  const handleImageDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedImageIndex !== null && draggedImageIndex !== targetIndex) {
      // Swap images within the same slot
      const newImages = [...images];
      [newImages[draggedImageIndex], newImages[targetIndex]] = [newImages[targetIndex], newImages[draggedImageIndex]];
      onImagesChange(newImages);
    }
  };

  const removeAt = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    onImagesChange(next);
  };

  const swap = (i: number, j: number) => {
    if (i !== j && images[i] && images[j]) {
      const next = [...images];
      [next[i], next[j]] = [next[j], next[i]];
      onImagesChange(next);
    }
  };

  const handleAddSecond = () => {
    document.getElementById(`slot-${slotIndex}-file-input`)?.click();
  };

  const handleSwapPhotos = () => {
    if (images.length === 2) {
      const newImages = [images[1], images[0]];
      onImagesChange(newImages);
    }
  };

  const handleMoveSlot = (targetSlot: number) => {
    onReorderSlot(slotIndex, targetSlot);
    setMovePopoverOpen(false);
  };

  const handleUrediClick = (image: File, imageIndex: number) => {
    // Navigate to Stage Studio with image and slot context
    const imageUrl = URL.createObjectURL(image);
    localStorage.setItem('stagingInputImage', imageUrl);
    localStorage.setItem('stagingSlotIndex', String(slotIndex));
    localStorage.setItem('stagingImageIndex', String(imageIndex));
    navigate('/app/stage');
  };

  const handleNoviClick = (image: File) => {
    // Find next available slot
    const nextSlot = slotIndex + 1;
    if (nextSlot >= totalSlots) {
      toast({
        title: "Nema slobodnog slota",
        description: "Ovo je poslednji slot.",
        variant: "destructive"
      });
      return;
    }
    
    onDuplicateToNext(image);
  };

  return (
    <div
      className={`slot-card ${isDragOver ? "drag-over" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Card Header */}
      <div className="p-4 pb-3">
        <h4 className="text-[13px] font-medium text-muted-foreground">
          Slot {slotIndex + 1}
        </h4>
      </div>

      {/* Media Rail */}
      <div className="px-4">
        {images.length === 0 ? (
          <div className="media-rail">
            <div className="w-full h-full border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/30 flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors"
              onClick={() => document.getElementById(`slot-${slotIndex}-file-input`)?.click()}
            >
              <div className="text-center">
                <Plus className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                <p className="text-sm text-muted-foreground/70">Dodaj fotografije</p>
              </div>
            </div>
          </div>
        ) : (
          <div className={`media-rail ${images.length === 1 ? 'single-photo' : ''}`}>
            {images.map((image, index) => {
              const isBeingDragged = draggedImageIndex === index;
              
              return (
                <ImagePreview key={index} image={image} index={index}>
                  {(url) => (
                    <Dialog>
                      <DialogTrigger asChild>
                        <div 
                          className={`photo-tile ${isBeingDragged ? 'dragging' : ''}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => handleImageDrop(e, index)}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          <img 
                            src={url} 
                            alt={`Image ${index + 1}`}
                          />
                      
                      {/* Frame Pills */}
                      {images.length === 2 ? (
                        <div className={`frame-pill ${index === 0 ? 'start' : 'end'}`}>
                          {index === 0 ? "Početak" : "Kraj"}
                        </div>
                      ) : (
                        <div className="frame-pill center">
                          Početak/Kraj
                        </div>
                      )}
                      
                      {/* Per-Photo Actions */}
                      <div
                        className="action-pill uredi"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUrediClick(image, index);
                        }}
                        title="Uredi u Stage Studio"
                      >
                        <Edit3 className="w-3 h-3" />
                        Uredi
                      </div>
                      
                      {/* Novi Action - only on end frame */}
                      {images.length === 2 && index === 1 && (
                        <div
                          className="action-pill novi"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNoviClick(image);
                          }}
                          title="Dupliraj u sledeći slot"
                        >
                          Novi
                        </div>
                      )}
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <img 
                          src={url} 
                          alt={`Preview ${index + 1}`}
                          className="w-full h-auto rounded-lg"
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </ImagePreview>
              );
            })}
          </div>
        )}
        
        {/* Add Second Photo Link */}
        {images.length === 1 && (
          <a
            href="#"
            className="add-second-link"
            onClick={(e) => {
              e.preventDefault();
              handleAddSecond();
            }}
          >
            <Plus className="w-3 h-3" />
            Dodaj drugu (opciono)
          </a>
        )}
      </div>

      {/* Slot Actions */}
      <div className="slot-actions">
        <div className="slot-actions-left">
          {images.length === 2 && (
            <span 
              className="slot-action"
              onClick={handleSwapPhotos}
              title="Zameni redosled fotografija"
            >
              Zameni
            </span>
          )}
          <Popover open={movePopoverOpen} onOpenChange={setMovePopoverOpen}>
            <PopoverTrigger asChild>
              <span className="slot-action" title="Premesti slot">
                Premesti
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3">
              <p className="text-sm font-medium mb-3">Izaberi slot 1–{totalSlots}</p>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: totalSlots }, (_, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => handleMoveSlot(i)}
                    disabled={i === slotIndex}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="slot-actions-right">
          {images.length > 0 && (
            <span
              className="slot-action"
              onClick={() => onImagesChange([])}
              title="Ukloni sve fotografije"
            >
              Ukloni
            </span>
          )}
          <div
            className="drag-handle"
            tabIndex={0}
            title="Prevuci za premeštanje"
          >
            ≡
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        id={`slot-${slotIndex}-file-input`}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
          if (files.length) {
            addFiles(files);
          }
          (e.target as HTMLInputElement).value = "";
        }}
      />
    </div>
  );
}