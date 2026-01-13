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

    // Auto mode is enabled if value is empty
    const isAuto = value === "";

    // Toggle Auto Mode
    const handleAutoToggle = (checked: boolean) => {
        if (checked) {
            onChange(""); // Clear value to indicate "Auto"
        } else {
            // If switching to manual and value is empty, maybe set a placeholder or keep it empty but focus?
            // User will just type.
        }
    };

    // Fetch Saved Presets (Bookmarks) for Visual Hook
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
                icon: Bookmark // Use bookmark icon for saved items
            }));
        }
    });

    return (
        <div className={cn("space-y-4", className)}>

            {/* Control Bar: Auto Switch & Stage Link */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="visual-auto-mode"
                        checked={isAuto}
                        onCheckedChange={handleAutoToggle}
                        className="data-[state=checked]:bg-indigo-500"
                    />
                    <Label htmlFor="visual-auto-mode" className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
                        AI Automatski
                    </Label>
                </div>

                <Button
                    variant="link"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-primary p-0 h-auto gap-1"
                    onClick={() => navigate('/app/stage')}
                >
                    Kreiraj u Stage Studio
                    <ArrowRight className="w-3 h-3" />
                </Button>
            </div>

            {/* Input Overlay (Disabled state appearance) or Input Field */}
            <div className="relative transition-all duration-300">
                {isAuto ? (
                    <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-md border border-dashed border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-full">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            AI će generisati vizuelni uvod
                        </div>
                    </div>
                ) : null}

                <HookInputWithPresets
                    type="visual_hook"
                    value={value}
                    onChange={onChange}
                    placeholder="Opišite prvi kadar..."
                />
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
