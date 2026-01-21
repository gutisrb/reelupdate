import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check, Sparkles, Bookmark, Wand2, XCircle, RotateCcw } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface VisualHookSelectorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

const PRESET_HOOKS = [
    {
        id: "auto",
        name: "Auto (AI Director)",
        value: "auto",
        description: "AI bira najbolji hook za vas",
        gradient: "from-indigo-500 via-purple-500 to-pink-500",
        icon: Sparkles
    },
    {
        id: "blur",
        name: "Start with Blur",
        value: "Start with Blur",
        description: "Zamućen početak koji se izoštrava",
        gradient: "from-blue-400 to-cyan-300",
    },
    {
        id: "agent-fail",
        name: "Agent Fail",
        value: "Agent Fail",
        description: "Agent pada na zabavan način",
        gradient: "from-orange-400 to-red-400",
    },
    {
        id: "empty-to-furnished",
        name: "Empty to Furnished",
        value: "Empty to Furnished",
        description: "Virtuelno opremanje prostora",
        gradient: "from-emerald-400 to-teal-500",
    },
    {
        id: "low-battery",
        name: "Low Battery",
        value: "Low Battery",
        description: "iPhone 20% popup upozorenje",
        gradient: "from-slate-700 to-slate-900",
    },
    {
        id: "labubu",
        name: "Labubu",
        value: "Labubu",
        description: "Džinovska Labubu maskota",
        gradient: "from-pink-400 to-rose-400",
    },
];

export function VisualHookSelector({ value, onChange, className }: VisualHookSelectorProps) {
    const [tab, setTab] = useState<'presets' | 'saved'>('presets');

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
                name: p.name,
                value: p.data?.text || "",
                description: p.data?.description || "Sačuvani hook",
                previewUrl: p.data?.preview_url || "",
                gradient: "from-amber-200 to-orange-400"
            }));
        }
    });

    const activeList = tab === 'presets' ? PRESET_HOOKS : savedPresets;

    return (
        <div className={cn("space-y-6 pb-2", className)}>
            {/* Tabs & Header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setTab('presets')}
                        className={cn(
                            "text-[12px] font-black uppercase tracking-widest transition-all relative pb-2",
                            tab === 'presets' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Preporučeno
                        {tab === 'presets' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in slide-in-from-left duration-300" />}
                    </button>
                    <button
                        onClick={() => setTab('saved')}
                        className={cn(
                            "text-[12px] font-black uppercase tracking-widest transition-all relative pb-2",
                            tab === 'saved' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Sačuvano ({savedPresets.length})
                        {tab === 'saved' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in slide-in-from-left duration-300" />}
                    </button>
                </div>
            </div>

            <ScrollArea className="w-full whitespace-nowrap overflow-visible">
                <div className="flex w-max space-x-5 px-1 py-2">
                    {/* None Option */}
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className={cn(
                            "group relative flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-500",
                            "w-[160px] h-[220px] hover:scale-[1.05] active:scale-[0.95]",
                            value === ""
                                ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10"
                                : "border-border/40 bg-muted/10 hover:border-border/80 hover:bg-muted/20"
                        )}
                    >
                        <div className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors",
                            value === "" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/40"
                        )}>
                            <XCircle className="w-7 h-7" />
                        </div>
                        <span className="text-[12px] font-black uppercase tracking-tight">Bez hook-a</span>
                        <span className="text-[10px] text-muted-foreground mt-2 text-center px-4 leading-tight whitespace-normal">
                            Čist početak bez specijalnih efekata
                        </span>

                        {value === "" && (
                            <div className="absolute top-3 right-3 bg-primary rounded-full p-1.5 shadow-xl animate-in zoom-in duration-300">
                                <Check className="w-3 h-3 text-white stroke-[4]" />
                            </div>
                        )}
                    </button>

                    {activeList.map((preset: any) => {
                        const isSelected = value === preset.value;
                        const Icon = preset.icon || Wand2;

                        return (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => onChange(preset.value)}
                                className={cn(
                                    "group relative flex flex-col items-start rounded-2xl border-2 transition-all duration-500 overflow-hidden",
                                    "w-[160px] h-[220px] hover:scale-[1.05] hover:shadow-2xl active:scale-[0.95]",
                                    isSelected
                                        ? "border-primary shadow-2xl shadow-primary/20 ring-1 ring-primary/30"
                                        : "border-border/40 bg-background hover:border-primary/40"
                                )}
                            >
                                {/* Preview / Gradient */}
                                <div className={cn(
                                    "w-full h-[55%] bg-gradient-to-br relative transition-transform duration-700 group-hover:scale-110",
                                    preset.gradient || "from-indigo-500 to-primary"
                                )}>
                                    {preset.previewUrl ? (
                                        <img
                                            src={preset.previewUrl}
                                            alt={preset.name}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                            <Icon className="w-12 h-12 text-white/50 drop-shadow-2xl animate-pulse" />
                                        </div>
                                    )}

                                    {/* Intensity Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                </div>

                                {/* Content */}
                                <div className="p-4 w-full flex flex-col flex-1 bg-white dark:bg-card relative z-10">
                                    <span className={cn(
                                        "text-[11px] font-black uppercase tracking-tighter truncate w-full transition-colors",
                                        isSelected ? "text-primary" : "text-foreground"
                                    )}>
                                        {preset.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground leading-snug mt-1.5 line-clamp-3 text-left whitespace-normal">
                                        {preset.description}
                                    </span>

                                    {isSelected && (
                                        <div className="mt-auto flex items-center gap-1 text-[9px] font-bold text-primary uppercase animate-in slide-in-from-bottom-2 duration-300">
                                            <Sparkles className="w-2.5 h-2.5" />
                                            Aktivno
                                        </div>
                                    )}
                                </div>

                                {/* Selection Indicator */}
                                {isSelected && (
                                    <div className="absolute top-3 right-3 bg-primary rounded-full p-1.5 border-2 border-white shadow-xl z-20 scale-125 animate-in zoom-in-50 duration-500">
                                        <Check className="w-3 h-3 text-white stroke-[4]" />
                                    </div>
                                )}

                                {/* Hover Glow */}
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </button>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
