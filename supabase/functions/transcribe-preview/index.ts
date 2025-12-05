import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { OpenAIClient } from '../_shared/clients/openai.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { videoUrl } = await req.json();

        if (!videoUrl) {
            throw new Error('Missing videoUrl');
        }

        const openai = new OpenAIClient();
        console.log(`Transcribing preview: ${videoUrl}`);

        // 1. Get SRT from OpenAI
        const srtContent = await openai.createTranscription(videoUrl);

        // 2. Parse SRT to JSON for frontend
        const segments = parseSrt(srtContent);

        return new Response(
            JSON.stringify({ segments }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Transcription error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

// Helper to parse SRT to JSON
function parseSrt(srt: string) {
    const segments = [];
    const blocks = srt.trim().split('\n\n');

    for (const block of blocks) {
        const lines = block.split('\n');
        if (lines.length < 3) continue;

        // Line 1: Index (skip)
        // Line 2: Time range (00:00:00,000 --> 00:00:01,500)
        const timeLine = lines[1];
        const [startStr, endStr] = timeLine.split(' --> ');

        // Line 3+: Text
        const text = lines.slice(2).join(' ');

        segments.push({
            start: parseTime(startStr),
            end: parseTime(endStr),
            text: text.trim()
        });
    }

    return segments;
}

function parseTime(timeStr: string): number {
    // Format: HH:mm:ss,ms
    const [h, m, sMs] = timeStr.split(':');
    const [s, ms] = sMs.split(',');

    return (
        parseInt(h) * 3600 +
        parseInt(m) * 60 +
        parseInt(s) +
        parseInt(ms) / 1000
    );
}
