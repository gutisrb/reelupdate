import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Define Preset Type locally until generated
export type Preset = {
    id: string;
    name: string;
    type: 'wizard' | 'script_hook' | 'visual_hook';
    data: any;
    created_at: string;
};

interface PresetScrollProps {
    onSelect: (data: any) => void;
    currentData: any; // Data to save
    type: 'wizard' | 'script_hook' | 'visual_hook';
    title?: string;
    className?: string;
}

export function PresetScroll({ onSelect, currentData, type, title = "Sačuvani Preseti", className }: PresetScrollProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newPresetName, setNewPresetName] = useState("");

    // Fetch Presets
    const { data: presets = [], isLoading } = useQuery({
        queryKey: ['presets', type],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('presets')
                .select('*')
                .eq('type', type)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Preset[];
        }
    });

    // Save Preset Mutation
    const saveMutation = useMutation({
        mutationFn: async (name: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Must be logged in");

            const { error } = await supabase.from('presets').insert({
                user_id: user.id,
                name,
                type,
                data: currentData
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['presets', type] });
            toast({ title: "Uspešno sačuvano", description: "Vaš preset je sačuvan." });
            setIsDialogOpen(false);
            setNewPresetName("");
        },
        onError: (e) => {
            toast({ title: "Greška", description: e.message, variant: "destructive" });
        }
    });

    // Delete Preset Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('presets').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['presets', type] });
            toast({ title: "Obrisano", description: "Preset je obrisan." });
        }
    });

    const handleSave = () => {
        if (!newPresetName.trim()) return;
        saveMutation.mutate(newPresetName);
    };

    return (
        <div className={cn("w-full space-y-2", className)}>
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 hover:text-primary">
                            <Plus className="w-3 h-3" /> Sačuvaj trenutno
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Sačuvaj novi preset</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="preset-name" className="mb-2 block">Naziv</Label>
                            <Input
                                id="preset-name"
                                value={newPresetName}
                                onChange={(e) => setNewPresetName(e.target.value)}
                                placeholder="npr. Vračar Luksuzni"
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Otkaži</Button>
                            <Button onClick={handleSave} disabled={saveMutation.isPending}>
                                {saveMutation.isPending ? "Čuvanje..." : "Sačuvaj"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <ScrollArea className="w-full whitespace-nowrap rounded-xl border border-border/50 bg-background/50">
                <div className="flex w-max space-x-2.5 p-2.5">
                    {isLoading && (
                        <div className="flex gap-2">
                            {[1, 2, 3].map(i => <div key={i} className="w-32 h-10 rounded-lg bg-muted animate-pulse" />)}
                        </div>
                    )}

                    {!isLoading && presets.length === 0 && (
                        <div className="text-xs text-muted-foreground px-2 py-2 italic">Nema sačuvanih preseta.</div>
                    )}

                    {presets.map((preset) => (
                        <div key={preset.id} className="group relative">
                            <Button
                                variant="outline"
                                className="h-10 pl-3 pr-8 text-sm font-normal bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-left justify-start min-w-[140px]"
                                onClick={() => onSelect(preset.data)}
                            >
                                <span className="truncate max-w-[120px] block">{preset.name}</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-10 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteMutation.mutate(preset.id);
                                }}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
