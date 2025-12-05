import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline, Type, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CaptionCustomizerProps {
    settings: {
        fontFamily: string;
        fontSize: number;
        fontColor: string;
        bgColor: string;
        bgOpacity: number;
        fontWeight?: string;
        uppercase?: boolean;
        strokeColor?: string;
        strokeWidth?: number;
        shadowColor?: string;
        shadowBlur?: number;
        shadowX?: number;
        shadowY?: number;
        position?: string;
        animation?: string;
        maxLines?: number;
        emojis?: boolean;
        singleWord?: boolean;
    };
    onChange: (settings: any) => void;
}

const FONT_OPTIONS = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Palatino', label: 'Palatino' },
    { value: 'Garamond', label: 'Garamond' },
    { value: 'Bookman', label: 'Bookman' },
    { value: 'Comic Sans MS', label: 'Comic Sans MS' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS' },
    { value: 'Arial Black', label: 'Arial Black' },
    { value: 'Impact', label: 'Impact' },
];

const PRESETS = [
    {
        name: 'Luxury Gold',
        settings: {
            fontFamily: 'Georgia',
            fontSize: 38,
            fontColor: 'D4AF37',
            bgColor: '000000',
            bgOpacity: 0,
            fontWeight: 'normal',
            uppercase: false,
            strokeColor: '000000',
            strokeWidth: 1,
            shadowColor: '000000',
            shadowBlur: 2,
            shadowX: 1,
            shadowY: 1,
            position: 'bottom',
            animation: 'fade',
            maxLines: 2
        }
    },
    {
        name: 'Modern Box',
        settings: {
            fontFamily: 'Roboto',
            fontSize: 32,
            fontColor: 'FFFFFF',
            bgColor: '000000',
            bgOpacity: 75,
            fontWeight: 'normal',
            uppercase: true,
            strokeWidth: 0,
            shadowBlur: 0,
            position: 'bottom',
            animation: 'none',
            maxLines: 2
        }
    },
    {
        name: 'Corporate',
        settings: {
            fontFamily: 'Arial',
            fontSize: 34,
            fontColor: 'FFFFFF',
            bgColor: '002244', // Navy Blue
            bgOpacity: 90,
            fontWeight: 'bold',
            uppercase: false,
            strokeWidth: 0,
            shadowBlur: 0,
            position: 'bottom',
            animation: 'fade',
            maxLines: 2
        }
    },
    {
        name: 'Clean White',
        settings: {
            fontFamily: 'Helvetica',
            fontSize: 36,
            fontColor: 'FFFFFF',
            bgColor: '000000',
            bgOpacity: 0,
            fontWeight: 'bold',
            uppercase: false,
            strokeColor: '000000',
            strokeWidth: 0,
            shadowColor: '000000',
            shadowBlur: 4,
            shadowX: 0,
            shadowY: 2,
            position: 'bottom',
            animation: 'fade',
            maxLines: 2
        }
    },
    {
        name: 'High Contrast',
        settings: {
            fontFamily: 'Arial Black',
            fontSize: 40,
            fontColor: 'FFFFFF',
            bgColor: '000000',
            bgOpacity: 0,
            fontWeight: 'bold',
            uppercase: true,
            strokeColor: '000000',
            strokeWidth: 3,
            shadowColor: '000000',
            shadowBlur: 0,
            shadowX: 2,
            shadowY: 2,
            position: 'bottom',
            animation: 'pop',
            maxLines: 2
        }
    },
    {
        name: 'Soft Elegant',
        settings: {
            fontFamily: 'Verdana',
            fontSize: 30,
            fontColor: 'F0F0F0',
            bgColor: '000000',
            bgOpacity: 40,
            fontWeight: 'normal',
            uppercase: false,
            strokeWidth: 0,
            shadowBlur: 0,
            position: 'bottom',
            animation: 'fade',
            maxLines: 2,
            singleWord: false,
        }
    }
];

export function CaptionCustomizer({ settings, onChange }: CaptionCustomizerProps) {
    const [currentTime, setCurrentTime] = useState(0);
    const [transcript, setTranscript] = useState<any[]>([]);
    const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Auto-load transcript on mount
    useEffect(() => {
        handleGenerateTranscript();
    }, []);

    const handleGenerateTranscript = async () => {
        setIsLoadingTranscript(true);

        // Simulate network request to OpenAI
        setTimeout(() => {
            // Real transcript data generated via OpenAI Whisper (manually run)
            const realTranscript = [
                { start: 0.0, end: 1.0, text: "Ako tražiš prestiž" },
                { start: 1.0, end: 2.2, text: "i udobnost, ovo je" },
                { start: 2.2, end: 3.4, text: "za tebe." },
                { start: 3.9, end: 5.0, text: "Luksuzni petosoban dupleks" },
                { start: 5.0, end: 6.2, text: "u Skojevskom naselju" },
                { start: 6.2, end: 7.3, text: "nudi stil života" },
                { start: 7.3, end: 8.8, text: "u prirodi blizu Košutnjaka." },
                { start: 10.6, end: 12.1, text: "Svaka soba ima televizor," },
                { start: 12.2, end: 13.4, text: "dok grejanje na gas" },
                { start: 13.4, end: 14.5, text: "dodaje toplinu." },
                { start: 15.0, end: 16.5, text: "Prostire se na šestom spratu" },
                { start: 16.5, end: 17.5, text: "na površini od" },
                { start: 17.5, end: 19.0, text: "120 kvadrata." },
                { start: 19.7, end: 21.0, text: "Cena je u opisu." },
                { start: 21.4, end: 22.4, text: "Pošaljite nam poruku," },
                { start: 22.8, end: 24.0, text: "imamo sve detalje." }
            ];

            setTranscript(realTranscript);
            setIsLoadingTranscript(false);
        }, 800); // Faster load for better UX
    };

    // Helper to get current caption based on time and settings
    const getCurrentCaption = () => {
        const currentSegment = transcript.find(s => currentTime >= s.start && currentTime < s.end);

        if (!currentSegment) return "";

        let text = currentSegment.text;

        // Add emojis if enabled
        if (settings.emojis) {
            if (text.toLowerCase().includes("home")) text += " 🏠";
            if (text.toLowerCase().includes("view")) text += " 👀";
            if (text.toLowerCase().includes("link")) text += " 🔗";
        }

        // Handle Single Word
        if (settings.singleWord) {
            const words = text.split(' ');
            const segmentDuration = currentSegment.end - currentSegment.start;
            const timeInSegment = currentTime - currentSegment.start;
            const wordIndex = Math.floor((timeInSegment / segmentDuration) * words.length);
            return words[Math.min(wordIndex, words.length - 1)] || "";
        }

        return text;
    };

    const currentCaption = getCurrentCaption();

    // Handle video time update
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }, []);

    const handleChange = (key: string, value: any) => {
        onChange({ ...settings, [key]: value });
    };

    const applyPreset = (preset: any) => {
        onChange({ ...settings, ...preset.settings });
    };

    // Animation Styles
    const getAnimationClass = () => {
        switch (settings.animation) {
            case 'pop': return 'animate-in zoom-in-50 duration-300';
            case 'fade': return 'animate-in fade-in duration-500';
            case 'typewriter': return ''; // Handled via CSS/JS if needed, but simple fade is safer for now
            default: return '';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* LEFT COLUMN - CONTROLS */}
            <div className="space-y-6 overflow-y-auto pb-20">
                <Tabs defaultValue="presets" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="presets">Presets</TabsTrigger>
                        <TabsTrigger value="font">Font</TabsTrigger>
                        <TabsTrigger value="effects">Effects</TabsTrigger>
                    </TabsList>

                    {/* PRESETS TAB */}
                    <TabsContent value="presets" className="mt-0">
                        <div className="grid grid-cols-2 gap-4">
                            {PRESETS.map((preset) => (
                                <div
                                    key={preset.name}
                                    className="cursor-pointer group relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all shadow-sm hover:shadow-md"
                                    onClick={() => applyPreset(preset)}
                                >
                                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center p-2 text-center">
                                        <span
                                            className="text-lg leading-tight"
                                            style={{
                                                fontFamily: preset.settings.fontFamily,
                                                color: preset.settings.fontColor.startsWith('#') ? preset.settings.fontColor : `#${preset.settings.fontColor}`,
                                                fontWeight: preset.settings.fontWeight,
                                                textTransform: preset.settings.uppercase ? 'uppercase' : 'none',
                                            }}
                                        >
                                            {preset.name}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* FONT TAB */}
                    <TabsContent value="font" className="mt-0 space-y-6">
                        <Card>
                            <CardContent className="pt-6 space-y-6">
                                {/* Font Family */}
                                <div className="space-y-2">
                                    <Label>Font Family</Label>
                                    <Select
                                        value={settings.fontFamily}
                                        onValueChange={(val) => handleChange('fontFamily', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select font" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FONT_OPTIONS.map((font) => (
                                                <SelectItem key={font.value} value={font.value}>
                                                    <span style={{ fontFamily: font.value }}>{font.label}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Size & Color */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Size ({settings.fontSize}px)</Label>
                                        <Slider
                                            value={[settings.fontSize]}
                                            min={12}
                                            max={100}
                                            step={1}
                                            onValueChange={(value) => handleChange('fontSize', value[0])}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={settings.fontColor.startsWith('#') ? settings.fontColor : `#${settings.fontColor}`}
                                                onChange={(e) => handleChange('fontColor', e.target.value.replace('#', ''))}
                                                className="w-full h-10 p-1 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Style Toggles */}
                                <div className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={settings.fontWeight === 'bold'}
                                            onCheckedChange={(checked) => handleChange('fontWeight', checked ? 'bold' : 'normal')}
                                        />
                                        <Label>Bold</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={settings.uppercase}
                                            onCheckedChange={(checked) => handleChange('uppercase', checked)}
                                        />
                                        <Label>Uppercase</Label>
                                    </div>
                                </div>

                                {/* Stroke */}
                                <div className="space-y-2">
                                    <Label>Stroke (Outline)</Label>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="color"
                                            value={settings.strokeColor?.startsWith('#') ? settings.strokeColor : `#${settings.strokeColor || '000000'}`}
                                            onChange={(e) => handleChange('strokeColor', e.target.value.replace('#', ''))}
                                            className="w-10 h-10 p-1 cursor-pointer"
                                        />
                                        <Slider
                                            value={[settings.strokeWidth || 0]}
                                            min={0}
                                            max={10}
                                            step={1}
                                            className="flex-1"
                                            onValueChange={(value) => handleChange('strokeWidth', value[0])}
                                        />
                                        <span className="w-8 text-right text-sm">{settings.strokeWidth || 0}px</span>
                                    </div>
                                </div>

                                {/* Shadow */}
                                <div className="space-y-2">
                                    <Label>Shadow</Label>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="color"
                                            value={settings.shadowColor?.startsWith('#') ? settings.shadowColor : `#${settings.shadowColor || '000000'}`}
                                            onChange={(e) => handleChange('shadowColor', e.target.value.replace('#', ''))}
                                            className="w-10 h-10 p-1 cursor-pointer"
                                        />
                                        <Slider
                                            value={[settings.shadowBlur || 0]}
                                            min={0}
                                            max={20}
                                            step={1}
                                            className="flex-1"
                                            onValueChange={(value) => handleChange('shadowBlur', value[0])}
                                        />
                                        <span className="w-8 text-right text-sm">{settings.shadowBlur || 0}px</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* EFFECTS TAB */}
                    <TabsContent value="effects" className="mt-0 space-y-6">
                        <Card>
                            <CardContent className="pt-6 space-y-6">
                                {/* Position */}
                                <div className="space-y-2">
                                    <Label>Position</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['top', 'middle', 'bottom'].map((pos) => (
                                            <Button
                                                key={pos}
                                                variant={settings.position === pos ? "default" : "outline"}
                                                onClick={() => handleChange('position', pos)}
                                                className="capitalize"
                                            >
                                                {pos}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Animation */}
                                <div className="space-y-2">
                                    <Label>Animation</Label>
                                    <Select
                                        value={settings.animation || 'none'}
                                        onValueChange={(val) => handleChange('animation', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select animation" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="pop">Pop (Scale)</SelectItem>
                                            <SelectItem value="fade">Fade In</SelectItem>
                                            <SelectItem value="karaoke">Karaoke (Highlight)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Max Lines & Single Word */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Max Lines</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant={settings.maxLines === 1 ? "default" : "outline"}
                                                onClick={() => handleChange('maxLines', 1)}
                                            >
                                                1 Line
                                            </Button>
                                            <Button
                                                variant={settings.maxLines === 2 ? "default" : "outline"}
                                                onClick={() => handleChange('maxLines', 2)}
                                            >
                                                2 Lines
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="space-y-0.5">
                                            <Label>Single Word (Karaoke)</Label>
                                            <p className="text-xs text-muted-foreground">Show one word at a time</p>
                                        </div>
                                        <Switch
                                            checked={settings.singleWord}
                                            onCheckedChange={(checked) => handleChange('singleWord', checked)}
                                        />
                                    </div>
                                </div>

                                {/* Emojis Toggle */}
                                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="space-y-0.5">
                                        <Label>AI Emojis</Label>
                                        <p className="text-xs text-muted-foreground">Auto-add emojis to captions</p>
                                    </div>
                                    <Switch
                                        checked={settings.emojis}
                                        onCheckedChange={(checked) => handleChange('emojis', checked)}
                                    />
                                </div>

                                {/* Background */}
                                <div className="space-y-2">
                                    <Label>Background</Label>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="color"
                                            value={settings.bgColor.startsWith('#') ? settings.bgColor : `#${settings.bgColor}`}
                                            onChange={(e) => handleChange('bgColor', e.target.value.replace('#', ''))}
                                            className="w-10 h-10 p-1 cursor-pointer"
                                        />
                                        <Slider
                                            value={[settings.bgOpacity]}
                                            min={0}
                                            max={100}
                                            step={1}
                                            className="flex-1"
                                            onValueChange={(value) => handleChange('bgOpacity', value[0])}
                                        />
                                        <span className="w-8 text-right text-sm">{settings.bgOpacity}%</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* RIGHT COLUMN - PREVIEW */}
            <div className="hidden lg:block relative">
                <div className="sticky top-0">
                    <Card className="overflow-hidden border-0 shadow-none bg-transparent">
                        <CardHeader className="px-0 pt-0">
                            <CardTitle>Live Preview</CardTitle>
                            <CardDescription>Real-time caption preview</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="relative w-full max-w-[320px] mx-auto aspect-[9/16] rounded-3xl overflow-hidden border-4 border-gray-900 shadow-2xl bg-black">
                                {/* Video Background */}
                                <video
                                    ref={videoRef}
                                    src="https://res.cloudinary.com/dyarnpqaq/video/upload/v1764418592/b954d382-6941-4b58-9c03-4eccceeb9dae_resultf68dc3e6237c62b1_u7jqyz_apivdl.mp4"
                                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                />

                                {/* Caption Preview */}
                                {currentCaption && (
                                    <div
                                        key={currentCaption} // Key change triggers animation
                                        className={`absolute w-full px-4 text-center transition-all duration-200 ${getAnimationClass()}`}
                                        style={{
                                            fontFamily: settings.fontFamily,
                                            fontSize: `${settings.fontSize}px`,
                                            color: settings.fontColor.startsWith('#') ? settings.fontColor : `#${settings.fontColor}`,
                                            backgroundColor: `rgba(${parseInt(settings.bgColor.slice(0, 2), 16)}, ${parseInt(settings.bgColor.slice(2, 4), 16)}, ${parseInt(settings.bgColor.slice(4, 6), 16)}, ${settings.bgOpacity / 100})`,
                                            fontWeight: settings.fontWeight || 'normal',
                                            textTransform: settings.uppercase ? 'uppercase' : 'none',
                                            WebkitTextStroke: `${settings.strokeWidth || 0}px ${settings.strokeColor?.startsWith('#') ? settings.strokeColor : `#${settings.strokeColor || '000000'}`}`,
                                            textShadow: `${settings.shadowX || 2}px ${settings.shadowY || 2}px ${settings.shadowBlur || 0}px ${settings.shadowColor?.startsWith('#') ? settings.shadowColor : `#${settings.shadowColor || '000000'}`}`,
                                            top: settings.position === 'top' ? '15%' : settings.position === 'bottom' ? '80%' : '50%',
                                            transform: 'translateY(-50%)',
                                            left: 0,
                                            right: 0,
                                        }}
                                    >
                                        {currentCaption}
                                    </div>
                                )}

                                {isLoadingTranscript && (
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                        <div className="bg-black/70 px-3 py-1 rounded-full text-xs text-white flex items-center gap-2">
                                            <Sparkles className="w-3 h-3 animate-spin" />
                                            AI Transcribing...
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
