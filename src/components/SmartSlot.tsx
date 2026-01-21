import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Wand2, Sparkles, BookMarked, PenTool, Image as ImageIcon, Plus, X, ArrowRight, Edit3, Move } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useDrag } from "./DragContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { VisualHookSelector } from "./wizard/VisualHookSelector";

// --- Types ---
interface SmartSlotProps {
    slotIndex: number;
    images: File[];
    isHero: boolean;
    totalSlots: number;
    onImagesChange: (images: File[]) => void;
    onReceiveInternalImage: (data: { fromSlot: number; imageIndex: number; toIndex?: number }) => void;
    onDuplicateToNext: (imageFile: File) => void;
    onReorderSlot: (fromSlot: number, toSlot: number) => void;
    onBulkFilesAdded?: (files: File[], startingSlotIndex: number) => void;
    visualHook?: string;
    onVisualHookChange?: (hook: string) => void;
    className?: string;
}

// Reuse logic from SlotCard for Image Preview/Drag
// In a real app we'd extract "SlotMediaRail", but duplication for speed/stability here:
function ImagePreview({ image, children }: { image: File; children: (url: string) => React.ReactNode }) {
    const [url, setUrl] = React.useState<string>('');
    React.useEffect(() => {
        const objectUrl = URL.createObjectURL(image);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [image]);
    if (!url) return null;
    return <>{children(url)}</>;
}

export function SmartSlot({
    slotIndex, images, totalSlots, onImagesChange, onReceiveInternalImage,
    onDuplicateToNext, onReorderSlot, onBulkFilesAdded, visualHook, onVisualHookChange,
    className
}: SmartSlotProps) {
    const isHookActive = !!visualHook;
    const { setDragState } = useDrag();
    const { toast } = useToast();
    const navigate = useNavigate();

    // Drag/Drop/Upload Logic (Copied/Adapted from SlotCard)
    const [isDragOver, setIsDragOver] = useState(false);
    const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [movePopoverOpen, setMovePopoverOpen] = useState(false);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const dragData = e.dataTransfer.getData("application/json");
        if (dragData) {
            try {
                const data = JSON.parse(dragData);
                if (data.fromSlot !== undefined) {
                    onReceiveInternalImage({ fromSlot: data.fromSlot, imageIndex: data.imageIndex });
                    return;
                }
            } catch (e) { }
        }
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
        if (files.length && onBulkFilesAdded) onBulkFilesAdded(files, slotIndex);
        else if (files.length) onImagesChange([...images, ...files].slice(0, 2));
    };

    const handleDragStart = (e: React.DragEvent, imageIndex: number) => {
        setDraggedImageIndex(imageIndex);
        setDragState(true, { fromSlot: slotIndex, imageIndex });
        e.dataTransfer.setData("application/json", JSON.stringify({ fromSlot: slotIndex, imageIndex }));
    };

    const handleToggle = (checked: boolean) => {
        if (checked) {
            onVisualHookChange?.('auto');
            setIsDrawerOpen(true);
        } else {
            onVisualHookChange?.('');
            setIsDrawerOpen(false);
        }
    };

    const handleSelectHook = (hookKey: string) => {
        onVisualHookChange?.(hookKey);
        setIsDrawerOpen(false);
    };

    const handleSwapPhotos = () => {
        if (images.length === 2) {
            onImagesChange([images[1], images[0]]);
        }
    };

    const handleMoveSlot = (targetSlot: number) => {
        onReorderSlot(slotIndex, targetSlot);
        setMovePopoverOpen(false);
    };

    const handleImageDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        e.stopPropagation();

        // 1. Internal Swap (Dragging within same slot)
        if (draggedImageIndex !== null && draggedImageIndex !== targetIndex) {
            const newImages = [...images];
            [newImages[draggedImageIndex], newImages[targetIndex]] = [newImages[targetIndex], newImages[draggedImageIndex]];
            onImagesChange(newImages);
            return;
        }

        // 2. Cross-Slot Drop (Dropped on a tile from another slot)
        const dragData = e.dataTransfer.getData("application/json");
        if (dragData) {
            try {
                const data = JSON.parse(dragData);
                if (data.fromSlot !== undefined && data.fromSlot !== slotIndex) {
                    onReceiveInternalImage({
                        fromSlot: data.fromSlot,
                        imageIndex: data.imageIndex,
                        toIndex: targetIndex
                    });
                }
            } catch (e) {
                console.error("Failed to parse drag data:", e);
            }
        }
    };

    const handleUrediClick = (image: File, imageIndex: number) => {
        const imageUrl = URL.createObjectURL(image);
        localStorage.setItem('stagingInputImage', imageUrl);
        localStorage.setItem('stagingSlotIndex', String(slotIndex));
        localStorage.setItem('stagingImageIndex', String(imageIndex));
        navigate('/app/stage');
    };

    // Data Fetching
    const { data: suggestions = [] } = useQuery({
        queryKey: ['hook_suggestions'],
        queryFn: async () => {
            const { data } = await supabase.from('viral_trends').select('*').in('hook_type', ['motion', 'overlay']).limit(8);
            if (data && data.length > 0) return data;

            // Fallback if no backend data
            return [
                { id: 'h1', concept_name: 'Start with Blur' },
                { id: 'h2', concept_name: 'Agent Fail' },
                { id: 'h3', concept_name: 'Empty to Furnished' },
                { id: 'h4', concept_name: 'Furnished to Empty' },
                { id: 'h5', concept_name: 'Labubu' },
                { id: 'h6', concept_name: 'Sketch' },
                { id: 'h7', concept_name: 'Low Battery' },
            ];
        }
    });

    const { data: bookmarks = [] } = useQuery({
        queryKey: ['presets', 'visual_hook'],
        queryFn: async () => {
            const { data } = await supabase.from('presets' as any).select('*').eq('type', 'visual_hook');
            return data || [];
        }
    });

    return (
        <div
            className={cn(
                "relative bg-white dark:bg-card rounded-xl border border-border shadow-sm transition-all duration-300 ease-in-out overflow-hidden flex flex-col",
                // Remove fixed heights and row-spans. Let content drive height.
                "h-full", // Ensure it fills the grid cell height
                isHookActive ? "ring-2 ring-primary/5" : "hover:shadow-md",
                isDragOver && "ring-2 ring-primary",
                className
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
        >
            {/* HEADER */}
            <div className="px-4 py-3 flex justify-between items-center border-b border-border/10 bg-white/50 dark:bg-black/10 z-10 relative">
                <div className="flex flex-col">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Slot 1</h4>
                    {isHookActive && <span className="text-[10px] text-indigo-600 font-medium">Visual Hook Mode</span>}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-medium mr-1">
                        {isHookActive ? 'On' : 'Enable Hook'}
                    </span>
                    <Switch
                        checked={isHookActive}
                        onCheckedChange={handleToggle}
                        className="scale-75 origin-right"
                    />
                    {isHookActive && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1"
                            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                        >
                            <Edit3 className={cn("w-3 h-3 transition-transform", isDrawerOpen && "rotate-180")} />
                        </Button>
                    )}
                </div>
            </div>

            {/* DRAWER (Expanded Content) - REPLACED WITH PRESET GALLERY */}
            <div className={cn(
                "bg-indigo-50/30 dark:bg-indigo-950/10 border-b border-indigo-100 dark:border-indigo-900/20 overflow-hidden transition-all duration-500 ease-in-out",
                (isHookActive && isDrawerOpen) ? "max-h-[600px] opacity-100 p-4" : "max-h-0 opacity-0 p-0"
            )}>
                <VisualHookSelector
                    value={visualHook || ""}
                    onChange={(val) => onVisualHookChange?.(val)}
                />
            </div>

            {/* BODY (Media Rail - Standard) */}
            <div className="px-4 py-2 relative group/rail flex-1 flex flex-col justify-center min-h-0">
                {images.length === 0 ? (
                    <div className="media-rail">
                        <div className="w-full h-full border border-dashed border-indigo-200/50 dark:border-indigo-800/50 rounded-xl bg-indigo-50/10 hover:bg-indigo-50/30 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group text-center"
                            onClick={() => document.getElementById(`slot-${slotIndex}-file-input`)?.click()}
                        >
                            <div className="w-10 h-10 rounded-full bg-indigo-100/50 dark:bg-indigo-900/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Plus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <p className="text-[10px] font-medium text-indigo-900/70">
                                {isHookActive ? 'Upload Start & End' : 'Add Photos'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className={cn("media-rail", images.length === 1 && "single-photo")}>
                        {images.map((img, idx) => (
                            <ImagePreview key={idx} image={img}>
                                {(url) => (
                                    <div
                                        className={cn("photo-tile group cursor-grab active:cursor-grabbing", draggedImageIndex === idx && "opacity-50")}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, idx)}
                                        onDragEnd={() => { setDraggedImageIndex(null); setDragState(false, null); }}
                                        onDrop={(e) => handleImageDrop(e, idx)}
                                        onDragOver={(e) => e.preventDefault()}
                                    >
                                        <img src={url} className="w-full h-full object-cover" />

                                        {/* Frame Removal Pill */}
                                        <div className="action-pill remove-image"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const next = images.filter((_, i) => i !== idx);
                                                onImagesChange(next);
                                            }}
                                            title="Ukloni ovu sliku"
                                        >
                                            <X className="w-3 h-3" />
                                        </div>

                                        {/* Uredi Action Pill */}
                                        <div
                                            className="action-pill uredi"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUrediClick(img, idx);
                                            }}
                                            title="Uredi u Stage Studio"
                                        >
                                            <Edit3 className="w-3 h-3" />
                                            Uredi
                                        </div>
                                        {/* Badge for Start/End if Hook Active */}
                                        {isHookActive && (
                                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] py-0.5 text-center">
                                                {idx === 0 ? 'Start Frame' : 'End Frame'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </ImagePreview>
                        ))}
                    </div>
                )}
            </div>

            {/* FOOTER ACTIONS (Sync with SlotCard) */}
            {(images.length > 0 || isHookActive) && (
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
                        {(images.length > 0 || isHookActive) && (
                            <span
                                className="slot-action"
                                onClick={() => {
                                    onImagesChange([]);
                                    onVisualHookChange?.('');
                                }}
                                title="Ukloni sve fotografije i hook"
                            >
                                Ukloni
                            </span>
                        )}
                        <div className="drag-handle" tabIndex={0} title="Prevuci za premeštanje">
                            ≡
                        </div>
                    </div>
                </div>
            )}

            <input
                id={`slot-${slotIndex}-file-input`}
                type="file" multiple accept="image/*" className="hidden"
                onChange={(e) => {
                    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
                    if (files.length) {
                        if (onBulkFilesAdded) onBulkFilesAdded(files, slotIndex);
                        else onImagesChange([...images, ...files].slice(0, 2));
                    }
                    (e.target as HTMLInputElement).value = "";
                }}
            />
        </div>
    );
}
