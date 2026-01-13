import * as React from "react";
import { Check, ChevronsUpDown, Bookmark, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HookPresetComboboxProps {
    type: 'script_hook' | 'visual_hook';
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

type HookItem = {
    value: string;
    label: string;
    source: 'preset' | 'recent' | 'custom';
    id?: string; // for presets
};

export function HookPresetCombobox({ type, value, onChange, placeholder }: HookPresetComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch Saved Presets
    const { data: savedPresets = [] } = useQuery({
        queryKey: ['presets', type],
        queryFn: async () => {
            const { data } = await supabase
                .from('presets' as any)
                .select('*')
                .eq('type', type)
                .order('created_at', { ascending: false });
            return (data || []).map((p: any) => ({
                value: p.data?.text || "",
                label: p.name,
                source: 'preset' as const,
                id: p.id
            }));
        }
    });

    // Fetch Recently Used (from assets table)
    // This is a bit "heavy" so we limit it.
    const { data: recentItems = [] } = useQuery({
        queryKey: ['recent_hooks', type],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data } = await supabase
                .from('assets')
                .select('inputs')
                .eq('user_id', user.id)
                .eq('kind', 'video') // Assuming video assets
                .not('inputs', 'is', null)
                .order('created_at', { ascending: false })
                .limit(20);

            const params = data?.map(d => (d as any).inputs?.[type]).filter(Boolean) || [];
            const unique = Array.from(new Set(params)).slice(0, 5); // last 5 unique

            return unique.map(text => ({
                value: text as string,
                label: (text as string).slice(0, 40) + ((text as string).length > 40 ? "..." : ""),
                source: 'recent' as const
            }));
        }
    });

    // Save Preset Mutation
    const saveMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Must be logged in");
            if (!value) throw new Error("Empty value");

            // Auto-generate name from value if not provided, or use a simple timestamp/ID for now to avoid the popup
            // Ideally we show a Dialog, but to fix the "annoying popup" immediately:
            const name = value.slice(0, 30) + (value.length > 30 ? "..." : "");

            const { error } = await supabase.from('presets' as any).insert({
                user_id: user.id,
                name,
                type,
                data: { text: value }
            } as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['presets', type] });
            toast({ title: "Sačuvano", description: "Hook je sačuvan u presete." });
        },
        onError: (e) => toast({ title: "Greška", description: e.message, variant: "destructive" })
    });

    // Combine items
    const items: HookItem[] = [
        ...savedPresets,
        ...recentItems.filter((r: any) => !savedPresets.some((p: any) => p.value === r.value)) // dedup
    ];

    return (
        <div className="flex gap-2">
            <div className="flex-1 relative">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between h-10 font-normal bg-background/80 border-indigo-200 dark:border-indigo-800"
                        >
                            {value
                                ? (items.find((item) => item.value === value)?.label || value.slice(0, 30) + (value.length > 30 ? "..." : ""))
                                : <span className="text-muted-foreground">{placeholder || "Izaberi ili ukucaj..."}</span>}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                            <CommandInput
                                placeholder="Traži ili piši novo..."
                                onValueChange={onChange} // Update value as user types search? "Combobox" style
                            />
                            <CommandList>
                                <CommandEmpty className="py-2 px-2 text-sm">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start h-8"
                                        onClick={() => {
                                            // Usage of what they typed is handled by parent, here we just visual helper
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Koristi uneto
                                    </Button>
                                </CommandEmpty>

                                {savedPresets.length > 0 && (
                                    <CommandGroup heading="Sačuvano (Bookmarks)">
                                        {savedPresets.map((item: any) => (
                                            <CommandItem
                                                key={item.id}
                                                value={item.value} // Value used for filtering
                                                onSelect={(currentValue) => {
                                                    onChange(item.value); // We want the full text
                                                    setOpen(false);
                                                }}
                                            >
                                                <Bookmark className="mr-2 h-4 w-4 text-indigo-500" />
                                                {item.label}
                                                <Check
                                                    className={cn(
                                                        "ml-auto h-4 w-4",
                                                        value === item.value ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}

                                <CommandSeparator />

                                {recentItems.length > 0 && (
                                    <CommandGroup heading="Nedavno korišćeno">
                                        {recentItems.map((item: any) => (
                                            <CommandItem
                                                key={item.value}
                                                value={item.value}
                                                onSelect={() => {
                                                    onChange(item.value);
                                                    setOpen(false);
                                                }}
                                            >
                                                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                                {item.label}
                                                <Check
                                                    className={cn(
                                                        "ml-auto h-4 w-4",
                                                        value === item.value ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Bookmark Button */}
            <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-indigo-500"
                onClick={() => saveMutation.mutate()}
                disabled={!value}
                title="Sačuvaj u Bookmarks"
            >
                <Bookmark className={cn("w-4 h-4", saveMutation.isSuccess && "fill-current text-indigo-500")} />
            </Button>
        </div>
    );
}

// Improved version for "Free Text + Suggestions"
export function HookInputWithPresets({ type, value, onChange, placeholder, multiline = false }: HookPresetComboboxProps & { multiline?: boolean }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [open, setOpen] = React.useState(false);

    // Fetch Presets and Recents (Same logic)
    const { data: savedPresets = [] } = useQuery({
        queryKey: ['presets', type],
        queryFn: async () => {
            const { data } = await supabase
                .from('presets' as any)
                .select('*')
                .eq('type', type)
                .order('created_at', { ascending: false });
            return (data || []).map((p: any) => ({ value: p.data?.text || "", label: p.name, source: 'preset', id: p.id }));
        }
    });

    const { data: recentItems = [] } = useQuery({
        queryKey: ['recent_hooks', type],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            const { data } = await supabase.from('assets').select('inputs').eq('user_id', user.id).eq('kind', 'video').not('inputs', 'is', null).order('created_at', { ascending: false }).limit(20);
            const params = data?.map(d => (d as any).inputs?.[type]).filter(Boolean) || [];
            const unique = Array.from(new Set(params)).slice(0, 5);
            return unique.map(text => ({ value: text as string, label: (text as string).slice(0, 40) + "...", source: 'recent' }));
        }
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Login required");
            // For implicit save on the multiline version
            const name = value.slice(0, 30) + (value.length > 30 ? "..." : "");
            const { error } = await supabase.from('presets' as any).insert({ user_id: user.id, name, type, data: { text: value } } as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['presets', type] });
            toast({ title: "Sačuvano" });
        }
    });

    return (
        <div className="flex gap-2 items-start">
            <div className="relative flex-1">
                {multiline ? (
                    <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-indigo-200 dark:border-indigo-800 resize-none"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                    />
                ) : (
                    <input
                        className="flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-indigo-200 dark:border-indigo-800"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                    />
                )}

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-6 w-6 text-muted-foreground hover:bg-muted"
                            title="Izaberi iz istorije"
                        >
                            <ChevronsUpDown className="h-3 w-3" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="end">
                        <Command>
                            <CommandInput placeholder="Pretraži..." />
                            <CommandList>
                                <CommandEmpty>Nema rezultata.</CommandEmpty>
                                {savedPresets.length > 0 && <CommandGroup heading="Bookmarks">{savedPresets.map((i: any) => (
                                    <CommandItem key={i.id} value={i.value} onSelect={() => { onChange(i.value); setOpen(false); }}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{i.label}</span>
                                            <span className="text-xs text-muted-foreground line-clamp-1">{i.value}</span>
                                        </div>
                                    </CommandItem>
                                ))}</CommandGroup>}
                                <CommandSeparator />
                                {recentItems.length > 0 && <CommandGroup heading="Recent">{recentItems.map((i: any) => (
                                    <CommandItem key={i.value} value={i.value} onSelect={() => { onChange(i.value); setOpen(false); }}>
                                        <span className="text-sm line-clamp-2">{i.value}</span>
                                    </CommandItem>
                                ))}</CommandGroup>}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            <Button
                variant="outline"
                size="icon"
                className={cn("shrink-0 border-dashed text-muted-foreground hover:text-indigo-500 hover:border-indigo-500", multiline ? "mt-1" : "")}
                onClick={() => saveMutation.mutate()}
                disabled={!value}
                title="Sačuvaj u Bookmarks"
            >
                <Bookmark className="w-4 h-4" />
            </Button>
        </div>
    );
}
