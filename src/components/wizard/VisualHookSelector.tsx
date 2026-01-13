import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Sparkles, MessageSquare, ChevronDown, ChevronUp, Bookmark } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { HookInputWithPresets } from "./HookPresetCombobox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface VisualHookPreset {
    id: string;
    label: string;
    value: string;
    description: string;
    icon: React.ElementType;
}

const VIRAL_HOOK_PRESETS: VisualHookPreset[] = [
    {
        id: "price_reveal",
        label: "Price Reveal",
        value: "Tekstualni overlay na sredini ekrana koji postepeno otkriva cenu.",
        description: "Najefikasniji način za zadržavanje pažnje.",
        icon: Sparkles
    },
    {
        id: "agent_entry",
        label: "Agent Presence",
        value: "Agent 'upada' ili 'uleće' u kadar pre nego što se prikaže prostor.",
        description: "Daje ljudski dodir i dinamičnost.",
        icon: MessageSquare
    },
    {
        id: "door_kick",
        label: "The Reveal",
        value: "Kadar otvaranja vrata (first-person) koji vodi direktno u glavnu sobu.",
        description: "Stvara osećaj ulaska u novi dom.",
        icon: Sparkles
    },
    {
        id: "luxury_zoom",
        label: "Luxury Detail",
        value: "Krupni kadar najluksuznijeg dela (kamin, bazen) sa brzim odzumiranjem.",
        description: "Fokusira se na 'wow' faktor.",
        icon: Sparkles
    },
    {
        id: "question_hook",
        label: "Question Overlay",
        value: "Pitanje tipa 'Šta mislite koliko košta?' preko prvih 2s videa.",
        description: "Podstiče komentare i engagement.",
        icon: MessageSquare
    }
];

interface VisualHookSelectorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function VisualHookSelector({ value, onChange, className }: VisualHookSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={cn("space-y-4", className)}>
            {/* Input with Bookmarks */}
            <HookInputWithPresets
                type="visual_hook"
                value={value}
                onChange={onChange}
                placeholder="Opišite prvi kadar (vizuelni hook)..."
            />

            {/* Expandable Suggestions */}
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
                <CollapsibleTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-primary transition-colors py-0 h-6"
                    >
                        <span className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3" />
                            Predlozi viralnih hook-ova
                        </span>
                        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="pt-2">
                    <ScrollArea className="w-full whitespace-nowrap rounded-lg border border-border/40 bg-muted/20 pb-2">
                        <div className="flex w-max space-x-3 p-3">
                            {VIRAL_HOOK_PRESETS.map((preset) => {
                                const isSelected = value === preset.value;
                                const Icon = preset.icon;
                                return (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => onChange(preset.value)}
                                        className={cn(
                                            "group relative flex flex-col items-start gap-2 rounded-xl border p-3 w-[160px] transition-all hover:bg-background shadow-sm hover:shadow-md",
                                            isSelected
                                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                : "border-border/60 bg-background/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 w-full">
                                            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600">
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className="text-[11px] font-bold truncate">
                                                {preset.label}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground leading-snug whitespace-normal line-clamp-2 text-left">
                                            {preset.description}
                                        </p>
                                        <div className="mt-1 w-full bg-muted/40 p-1.5 rounded text-[9px] text-foreground/70 whitespace-normal text-left line-clamp-2">
                                            "{preset.value.slice(0, 40)}..."
                                        </div>
                                        {isSelected && (
                                            <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 border-2 border-background">
                                                <Check className="w-2.5 h-2.5 text-white" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
