import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check, Sparkles, ChevronDown, ChevronUp, Bookmark, Wand2, ArrowRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { HookInputWithPresets } from "./HookPresetCombobox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface VisualHookSelectorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function VisualHookSelector({ value, onChange, className }: VisualHookSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const isAuto = value === "";

    // Fetch Saved Presets... (Keep existing logic)
    const { data: savedPresets = [] } = useQuery({
        queryKey: ['presets', 'visual_hook'],
        queryFn: async () => {
            const { data } = await supabase
                .from('presets' as any)
                .select('*')
                .eq('type', 'visual_hook')
                .order('created_at', { ascending: false });
            return (data || []).map((p: any) => ({
                id: p.id,
                label: p.name,
                value: p.data?.text || "",
                description: p.data?.description || "",
                icon: Bookmark
            }));
        }
    });

    return (
        <div className={cn("space-y-4", className)}>
            {/* Input Field with Auto Indicator */}
            <div className="relative group transition-all duration-300">
                <HookInputWithPresets
                    type="visual_hook"
                    value={value}
                    onChange={onChange}
                    placeholder={isAuto ? "✨ AI će generisati vizuelni uvod (ili opišite kadar...)" : "Opišite prvi kadar..."}
                />

                {/* Visual indicator for Auto Mode (Non-intrusive icon) */}
                {isAuto && (
                    <div className="absolute top-3 right-3 p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 pointer-events-none animate-pulse">
                        <Sparkles className="w-3.5 h-3.5" />
                    </div>
                )}
            </div>

            {/* Expandable Bookmarks */}
            {savedPresets.length > 0 && (
                <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-primary transition-colors py-0 h-6"
                        >
                            <span className="flex items-center gap-2">
                                <Bookmark className="w-3 h-3" />
                                Sačuvani vizuelni hook-ovi
                            </span>
                            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="pt-2">
                        <ScrollArea className="w-full whitespace-nowrap rounded-lg border border-border/40 bg-muted/20 pb-2">
                            <div className="flex w-max space-x-3 p-3">
                                {savedPresets.map((preset: any) => {
                                    const isSelected = value === preset.value;
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
                                                    <Bookmark className="w-4 h-4" />
                                                </div>
                                                <span className="text-[11px] font-bold truncate">
                                                    {preset.label}
                                                </span>
                                            </div>
                                            <div className="mt-1 w-full bg-muted/40 p-1.5 rounded text-[9px] text-foreground/70 whitespace-normal text-left line-clamp-3">
                                                "{preset.value.slice(0, 60)}..."
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
            )}
        </div>
    );
}
