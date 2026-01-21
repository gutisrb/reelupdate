import React, { useState, useEffect } from "react";
import { SlotCard } from "./SlotCard";
import { SlotData } from "./ImageSlots";
import { DragProvider } from "./DragContext";
import useEmblaCarousel from "embla-carousel-react";
import { SmartSlot } from "./SmartSlot";

interface SlotsGridProps {
  slots: SlotData[];
  onSlotsChange: (slots: SlotData[]) => void;
  clipCount: 5 | 6;
  visualHook: string;
  onVisualHookChange: (hook: string) => void;
}

export function SlotsGrid({ slots, onSlotsChange, clipCount, visualHook, onVisualHookChange }: SlotsGridProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    skipSnaps: false,
    dragFree: false
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
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
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const moveImage = (fromSlot: number, imageIndex: number, toSlot: number, toIndex?: number) => {
    const next = slots.map(s => ({ ...s, images: [...s.images] }));

    if (fromSlot < 0 || fromSlot >= next.length || toSlot < 0 || toSlot >= next.length) return;

    const src = next[fromSlot];
    const dst = next[toSlot];

    if (!src || !src.images || typeof src.images[imageIndex] === 'undefined') return;

    const img = src.images[imageIndex];

    // INTERNAL SLOT MOVE (Swap/Reorder)
    if (fromSlot === toSlot) {
      if (typeof toIndex === 'number' && toIndex !== imageIndex && toIndex < src.images.length) {
        const newImages = [...src.images];
        [newImages[imageIndex], newImages[toIndex]] = [newImages[toIndex], newImages[imageIndex]];
        src.images = newImages.filter(Boolean);
        onSlotsChange(next);
      }
      return;
    }

    // CROSS-SLOT MOVE
    // Remove from source
    src.images.splice(imageIndex, 1);

    if (typeof toIndex === "number" && toIndex < dst.images.length) {
      // Drop specifically on a tile -> swap with that tile
      const displacedImage = dst.images[toIndex];
      dst.images[toIndex] = img;
      if (displacedImage) {
        src.images.push(displacedImage);
      }
    } else {
      // Drop on general card area
      if (dst.images.length < 2) {
        dst.images.push(img);
      } else {
        // Slot is full, swap with the last image
        const displacedImage = dst.images.pop()!;
        dst.images.push(img);
        if (displacedImage) {
          src.images.push(displacedImage);
        }
      }
    }

    // Final safety filter
    src.images = src.images.filter((i): i is File => i instanceof File);
    dst.images = dst.images.filter((i): i is File => i instanceof File);

    onSlotsChange(next);
  };

  const handleDuplicateToNext = (slotIndex: number) => (imageFile: File) => {
    const nextSlotIndex = slotIndex + 1;
    if (nextSlotIndex >= clipCount) return;

    const next = slots.map(s => ({ ...s, images: [...s.images] }));
    const nextSlot = next[nextSlotIndex];

    if (nextSlot.images.length < 2) {
      nextSlot.images.unshift(imageFile); // Add as first image (start frame)
      onSlotsChange(next);
    }
  };

  const handleReorderSlot = (fromSlot: number, toSlot: number) => {
    if (fromSlot === toSlot) return;

    const next = [...slots];
    const [movedSlot] = next.splice(fromSlot, 1);
    next.splice(toSlot, 0, movedSlot);

    onSlotsChange(next);
  };

  const handleBulkFilesFromSlot = (files: File[], startingSlotIndex: number) => {
    const next = slots.map(s => ({ ...s, images: [...s.images] }));
    let fileIndex = 0;

    // Start filling from the starting slot
    for (let slotIndex = startingSlotIndex; slotIndex < clipCount && fileIndex < files.length; slotIndex++) {
      while (next[slotIndex].images.length < 2 && fileIndex < files.length) {
        next[slotIndex].images.push(files[fileIndex++]);
      }
    }

    onSlotsChange(next);
  };



  return (
    <DragProvider>
      {isMobile ? (
        // Mobile: Swipeable Carousel
        <div className="slots-carousel-container">
          <div className="slots-carousel-viewport" ref={emblaRef}>
            <div className="slots-carousel-track">
              {slots.slice(0, clipCount).map((slot, index) => {
                const commonProps = {
                  key: slot.id,
                  slotIndex: index,
                  images: slot.images,
                  isHero: false,
                  totalSlots: clipCount,
                  onImagesChange: (images: File[]) => {
                    const newSlots = [...slots];
                    newSlots[index] = { ...slot, images };
                    onSlotsChange(newSlots);
                  },
                  onReceiveInternalImage: ({ fromSlot, imageIndex, toIndex }: any) =>
                    moveImage(fromSlot, imageIndex, index, toIndex),
                  onDuplicateToNext: handleDuplicateToNext(index),
                  onReorderSlot: handleReorderSlot,
                  onBulkFilesAdded: handleBulkFilesFromSlot,
                };

                const { key, ...restProps } = commonProps;

                return (
                  <div key={index} className="slots-carousel-slide">
                    {index === 0 ? (
                      <SmartSlot key={key} {...restProps} visualHook={visualHook} onVisualHookChange={onVisualHookChange} />
                    ) : (
                      <SlotCard key={key} {...restProps} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Carousel Dots */}
          <div className="slots-carousel-dots">
            {Array.from({ length: clipCount }).map((_, idx) => (
              <button
                key={idx}
                className={`slots-carousel-dot ${idx === selectedIndex ? 'active' : ''}`}
                onClick={() => emblaApi?.scrollTo(idx)}
                aria-label={`Go to slot ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      ) : (
        // Desktop: Grid Layout
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 pb-24 w-full px-4 lg:px-6">
          {slots.slice(0, clipCount).map((slot, index) => {
            const commonProps = {
              key: slot.id,
              slotIndex: index,
              images: slot.images,
              isHero: false,
              totalSlots: clipCount,
              onImagesChange: (images: File[]) => {
                const newSlots = [...slots];
                newSlots[index] = { ...slot, images };
                onSlotsChange(newSlots);
              },
              onReceiveInternalImage: ({ fromSlot, imageIndex, toIndex }: any) =>
                moveImage(fromSlot, imageIndex, index, toIndex),
              onDuplicateToNext: handleDuplicateToNext(index),
              onReorderSlot: handleReorderSlot,
              onBulkFilesAdded: handleBulkFilesFromSlot,
            };

            const { key, ...restProps } = commonProps;

            if (index === 0) {
              return (
                <SmartSlot
                  key={key}
                  {...restProps}
                  visualHook={visualHook}
                  onVisualHookChange={onVisualHookChange}
                  className="col-span-1 shadow-md hover:shadow-lg transition-shadow"
                />
              );
            }

            return (
              <SlotCard
                key={key}
                {...restProps}
              />
            );
          })}
        </div>
      )}
    </DragProvider>
  );
}
