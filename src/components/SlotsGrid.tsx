import React, { useState, useEffect } from "react";
import { SlotCard } from "./SlotCard";
import { SlotData } from "./ImageSlots";
import { DragProvider } from "./DragContext";
import useEmblaCarousel from "embla-carousel-react";

interface SlotsGridProps {
  slots: SlotData[];
  onSlotsChange: (slots: SlotData[]) => void;
  clipCount: 5 | 6;
}

export function SlotsGrid({ slots, onSlotsChange, clipCount }: SlotsGridProps) {
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
    const next = slots.map(s => ({...s, images: [...s.images]}));
    const src = next[fromSlot];
    const dst = next[toSlot];

    // Safety check: ensure source image exists
    if (!src || !src.images[imageIndex]) {
      console.warn('Source image not found, skipping move');
      return;
    }

    const [img] = src.images.splice(imageIndex, 1);

    // if target index provided, place there or swap if occupied
    if (typeof toIndex === "number" && toIndex < dst.images.length) {
      // Target position exists, swap
      const displacedImage = dst.images[toIndex];
      dst.images[toIndex] = img;
      if (displacedImage) {
        src.images.push(displacedImage);
      }
    } else {
      // Dropping into general slot area or beyond current length
      if (dst.images.length < 2) {
        dst.images.push(img);
      } else {
        // Slot is full (has 2 images), swap with the last image
        const displacedImage = dst.images.pop()!;
        dst.images.push(img);
        if (displacedImage) {
          src.images.push(displacedImage);
        }
      }
    }

    // Compact arrays to remove any undefined/null values
    src.images = src.images.filter(Boolean);
    dst.images = dst.images.filter(Boolean);

    onSlotsChange(next);
  };

  const handleDuplicateToNext = (slotIndex: number) => (imageFile: File) => {
    const nextSlotIndex = slotIndex + 1;
    if (nextSlotIndex >= clipCount) return;

    const next = slots.map(s => ({...s, images: [...s.images]}));
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
    const next = slots.map(s => ({...s, images: [...s.images]}));
    let fileIndex = 0;

    // Start filling from the starting slot
    for (let slotIndex = startingSlotIndex; slotIndex < clipCount && fileIndex < files.length; slotIndex++) {
      while (next[slotIndex].images.length < 2 && fileIndex < files.length) {
        next[slotIndex].images.push(files[fileIndex++]);
      }
    }

    onSlotsChange(next);
  };

    const slotCards = slots.slice(0, clipCount).map((slot, index) => (
      <SlotCard
        key={slot.id}
        slotIndex={index}
        images={slot.images}
        isHero={false}
        totalSlots={clipCount}
        onImagesChange={(images: File[]) => {
          const newSlots = [...slots];
          newSlots[index] = { ...slot, images };
          onSlotsChange(newSlots);
        }}
        onReceiveInternalImage={({ fromSlot, imageIndex, toIndex }) =>
          moveImage(fromSlot, imageIndex, index, toIndex)
        }
        onDuplicateToNext={handleDuplicateToNext(index)}
        onReorderSlot={handleReorderSlot}
        onBulkFilesAdded={handleBulkFilesFromSlot}
      />
    ));

    return (
      <DragProvider>
        {isMobile ? (
          // Mobile: Swipeable Carousel
          <div className="slots-carousel-container">
            <div className="slots-carousel-viewport" ref={emblaRef}>
              <div className="slots-carousel-track">
                {slotCards.map((card, idx) => (
                  <div key={idx} className="slots-carousel-slide">
                    {card}
                  </div>
                ))}
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
          <div className="uniform-slots-grid">
            {slotCards}
          </div>
        )}
      </DragProvider>
    );
}
