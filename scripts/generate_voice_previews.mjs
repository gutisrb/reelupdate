/**
 * Voice Preview Generator
 * 
 * This script generates preview audio files for all 60 Gemini voices
 * and uploads them to Cloudinary.
 * 
 * Prerequisites:
 * - GOOGLE_AI_API_KEY environment variable
 * - CLOUDINARY_API_KEY environment variable
 * - CLOUDINARY_API_SECRET environment variable
 * - CLOUDINARY_CLOUD_NAME environment variable
 * 
 * Usage:
 *   npm install node-fetch form-data
 *   node scripts/generate_voice_previews.mjs
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const PREVIEW_TEXT = "Dobar dan, ovo je primer mog glasa za video prezentacije.";

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dyarnpqaq';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!GOOGLE_AI_API_KEY) {
    console.error('❌ GOOGLE_AI_API_KEY environment variable is required');
    process.exit(1);
}

if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('❌ CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET environment variables are required');
    process.exit(1);
}

const voices = [
    // Male voices
    { id: 'Zephyr', name: 'Marko' },
    { id: 'Puck', name: 'Stefan' },
    { id: 'Charon', name: 'Nikola' },
    { id: 'Fenrir', name: 'Aleksandar' },
    { id: 'Orus', name: 'Luka' },
    { id: 'Enceladus', name: 'Dimitrije' },
    { id: 'Iapetus', name: 'Miloš' },
    { id: 'Umbriel', name: 'Nemanja' },
    { id: 'Algieba', name: 'Petar' },
    { id: 'Algenib', name: 'Đorđe' },
    { id: 'Rasalgethi', name: 'Vladimir' },
    { id: 'Achernar', name: 'Dušan' },
    { id: 'Alnilam', name: 'Jovan' },
    { id: 'Schedar', name: 'Milan' },
    { id: 'Gacrux', name: 'Branko' },
    { id: 'Zubenelgenubi', name: 'Srđan' },
    { id: 'Sadaltager', name: 'Dejan' },
    // Female voices
    { id: 'Kore', name: 'Ana' },
    { id: 'Leda', name: 'Jelena' },
    { id: 'Aoede', name: 'Milica' },
    { id: 'Callirrhoe', name: 'Jovana' },
    { id: 'Autonoe', name: 'Marija' },
    { id: 'Despina', name: 'Katarina' },
    { id: 'Erinome', name: 'Teodora' },
    { id: 'Laomedeia', name: 'Sofija' },
    { id: 'Pulcherrima', name: 'Ivana' },
    { id: 'Achird', name: 'Aleksandra' },
    { id: 'Vindemiatrix', name: 'Tijana' },
    { id: 'Sadachbia', name: 'Maja' },
    { id: 'Sulafat', name: 'Nina' }
];

const models = [
    { id: 'flash', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent' },
    // Pro previews will be added later - focusing on Flash first to stay within API limits
    { id: 'pro', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-tts:generateContent' }
];

async function generateTTS(voiceName, endpoint) {
    const body = {
        contents: [{
            parts: [{ text: PREVIEW_TEXT }]
        }],
        generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: voiceName
                    }
                }
            }
        }
    };

    const makeRequest = async (retries = 3, delay = 10000) => {
        try {
            const response = await fetch(`${endpoint}?key=${GOOGLE_AI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.status === 429) {
                if (retries > 0) {
                    console.log(`⏳ Rate limited. Waiting ${delay / 1000}s before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return makeRequest(retries - 1, delay * 2);
                }
            }

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Gemini TTS failed: ${error}`);
            }

            return response;
        } catch (error) {
            if (retries > 0 && error.message.includes('fetch failed')) {
                console.log(`⚠️ Network error. Retrying...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return makeRequest(retries - 1, delay);
            }
            throw error;
        }
    };

    const response = await makeRequest();
    const data = await response.json();
    const base64Audio = data.candidates[0]?.content?.parts[0]?.inlineData?.data;

    if (!base64Audio) {
        throw new Error('No audio data returned from Gemini TTS');
    }

    // Decode base64 to Buffer
    return Buffer.from(base64Audio, 'base64');
}

async function uploadToCloudinary(audioBuffer, filename) {
    console.log(`   📊 Audio buffer size: ${audioBuffer.length} bytes`);

    // Create a proper WAV file with headers
    const sampleRate = 24000; // Gemini TTS sample rate
    const numChannels = 1; // Mono
    const bitsPerSample = 16;

    // Calculate sizes
    const dataSize = audioBuffer.length;
    const fileSize = 36 + dataSize;

    // Create WAV header
    const header = new ArrayBuffer(44);
    const view = new DataView(header);

    // "RIFF" chunk descriptor
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, fileSize, true); // File size - 8
    view.setUint32(8, 0x57415645, false); // "WAVE"

    // "fmt " sub-chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true); // ByteRate
    view.setUint16(32, numChannels * bitsPerSample / 8, true); // BlockAlign
    view.setUint16(34, bitsPerSample, true); // BitsPerSample

    // "data" sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true); // Subchunk2Size

    // Combine header and audio data
    const wavFile = new Uint8Array(44 + audioBuffer.length);
    wavFile.set(new Uint8Array(header), 0);
    wavFile.set(audioBuffer, 44);

    const form = new FormData();
    form.append('file', Buffer.from(wavFile), {
        filename: `${filename}.wav`,
        contentType: 'audio/wav'
    });
    form.append('upload_preset', 'ml_default');
    form.append('resource_type', 'video'); // Use 'video' for audio files

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
        {
            method: 'POST',
            body: form
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Cloudinary upload failed: ${error}`);
    }

    const data = await response.json();
    return data.secure_url;
}

async function generatePreviews() {
    console.log('🎙️  Starting voice preview generation...\n');
    console.log(`Preview text: "${PREVIEW_TEXT}"\n`);

    const results = [];
    let successCount = 0;
    let failCount = 0;
    let sqlStatements = '-- Update preview URLs for generated voices\n';

    for (const voice of voices) {
        for (const model of models) {
            const voiceId = `${voice.id}-${model.id}`;
            const displayName = `${voice.name} (${model.id === 'flash' ? 'Flash' : 'Pro'})`;

            try {
                console.log(`🔄 Generating: ${displayName} (${voiceId})...`);

                // Generate TTS
                const audioBuffer = await generateTTS(voice.id, model.endpoint);

                // Upload to Cloudinary
                const url = await uploadToCloudinary(audioBuffer, `voice_preview_${voiceId}`);

                results.push({ voiceId, displayName, url });
                successCount++;

                console.log(`✅ ${displayName}: ${url}\n`);

                sqlStatements += `UPDATE voice_presets SET preview_url = '${url}' WHERE voice_id = '${voiceId}';\n`;

                // Increased delay to 10 seconds between requests to be safe
                await new Promise(resolve => setTimeout(resolve, 10000));

            } catch (error) {
                failCount++;
                console.error(`❌ ${displayName}: ${error.message}\n`);
                results.push({ voiceId, displayName, error: error.message });
            }
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✨ Preview generation complete!`);
    console.log(`   Success: ${successCount}/60`);
    console.log(`   Failed: ${failCount}/60`);
    console.log('='.repeat(80) + '\n');

    // Save results to JSON file
    const outputPath = path.join(process.cwd(), 'voice_preview_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);

    // Save SQL to a new migration file
    const migrationTimestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const migrationFilename = `${migrationTimestamp}_update_preview_urls.sql`;
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFilename);

    fs.writeFileSync(migrationPath, sqlStatements);
    console.log(`\n📝 Migration file created: ${migrationPath}`);
    console.log('👉 You can now run "supabase db push" to apply these changes.');
}

generatePreviews().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
