import React from "react";
import { cn } from "@/lib/utils";
import { Check, Camera, Move, ZoomIn, Eye, Film } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface VisualHookPreset {
    id: string;
    label: string;
    value: string; // The instruction text
    icon: React.ElementType;
    color: string;
}

const VISUAL_HOOK_PRESETS: VisualHookPreset[] = [
    {
        id: "push_in",
        label: "Cinematic Push-In",
        value: "Slow cinematic push-in to establish the scene.",
        icon: ZoomIn,
        color: "bg-blue-500"
    },
    {
        id: "drone_reveal",
        label: "Drone Reveal",
        value: "Aerial drone shot pulling back to reveal the property.",
        icon: Camera,
        color: "bg-sky-500"
    },
    {
        id: "pan_slow",
        label: "Slow Pan",
        value: "Smooth slow pan across the room highlighting space.",
        icon: Move,
        color: "bg-purple-500"
    },
    {
        id: "detail_macro",
        label: "Luxury Detail",
        value: "Close-up macro shot of a texture or luxury detail, pulling focus.",
        icon: Eye,
        color: "bg-amber-500"
    },
    {
        id: "parallax",
        label: "Parallax Slide",
        value: "Sliding camera movement creating depth and parallax.",
        icon: Film,
        color: "bg-pink-500"
    }
];

interface VisualHookSelectorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function VisualHookSelector({ value, onChange, className }: VisualHookSelectorProps) {
    return (
        <div className={cn("space-y-3", className)}>
            <ScrollArea className="w-full whitespace-nowrap rounded-lg pb-2">
                <div className="flex w-max space-x-3 p-1">
                    {VISUAL_HOOK_PRESETS.map((preset) => {
                        const isSelected = value === preset.value;
                        const Icon = preset.icon;
                        return (
                            <button
                                key={preset.id}
                                type="button" // Prevent form submission
                                onClick={() => onChange(preset.value)}
                                className={cn(
                                    "group relative flex flex-col items-start gap-2 rounded-xl border p-3 w-[140px] transition-all hover:scale-105 hover:shadow-md",
                                    isSelected
                                        ? "border-primary bg-primary/5 shadow-primary/20 ring-1 ring-primary"
                                        : "border-border bg-card hover:border-primary/50"
                                )}
                            >
                                <div className={cn("p-2 rounded-lg text-white", preset.color)}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="space-y-1 text-left whitespace-normal">
                                    <span className={cn("text-xs font-semibold block", isSelected ? "text-primary" : "text-foreground")}>
                                        {preset.label}
                                    </span>
                                    <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                                        {preset.value}
                                    </p>
                                </div>
                                {isSelected && (
                                    <div className="absolute top-2 right-2 bg-primary rounded-full p-0.5">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Custom Input Fallback */}
            <div className="relative">
                <input
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Ili opišite custom kadar..."
                />
            </div>
        </div>
    );
}
