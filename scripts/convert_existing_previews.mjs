/**
 * Convert existing raw audio previews to proper WAV format
 * This downloads the existing files, adds WAV headers, and re-uploads them
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dyarnpqaq';

// List of existing preview URLs from the database
const existingPreviews = [
    { voiceId: 'Zephyr-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764854740/voice_preview_Zephyr-flash_x4gcj4.wav' },
    { voiceId: 'Puck-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764854756/voice_preview_Puck-flash_nivj0x.wav' },
    { voiceId: 'Charon-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764854771/voice_preview_Charon-flash_t85xr2.wav' },
    { voiceId: 'Fenrir-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764854791/voice_preview_Fenrir-flash_nlkpbw.wav' },
    { voiceId: 'Orus-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764854807/voice_preview_Orus-flash_l6ab8z.wav' },
    { voiceId: 'Enceladus-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764854822/voice_preview_Enceladus-flash_lgkkl3.wav' },
    { voiceId: 'Iapetus-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764854933/voice_preview_Iapetus-flash_dt3emn.wav' },
    { voiceId: 'Umbriel-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764854948/voice_preview_Umbriel-flash_ewzofu.wav' },
    { voiceId: 'Algenib-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764854964/voice_preview_Algenib-flash_igrj7e.wav' },
    { voiceId: 'Rasalgethi-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764855039/voice_preview_Rasalgethi-flash_nloswg.wav' },
    { voiceId: 'Achernar-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764855055/voice_preview_Achernar-flash_anmryj.wav' },
    { voiceId: 'Schedar-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764855170/voice_preview_Schedar-flash_trjtjt.wav' },
    { voiceId: 'Gacrux-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764855201/voice_preview_Gacrux-flash_lird7f.wav' },
    { voiceId: 'Zubenelgenubi-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764855217/voice_preview_Zubenelgenubi-flash_tu9zez.wav' },
    { voiceId: 'Sadaltager-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764855250/voice_preview_Sadaltager-flash_hzjba2.wav' },
    { voiceId: 'Leda-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764855456/voice_preview_Leda-flash_e77ktn.wav' },
    { voiceId: 'Aoede-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764855478/voice_preview_Aoede-flash_gavrvl.wav' },
    { voiceId: 'Callirrhoe-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764855496/voice_preview_Callirrhoe-flash_npjqwc.wav' },
    { voiceId: 'Autonoe-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764855522/voice_preview_Autonoe-flash_l9paa9.wav' },
    { voiceId: 'Despina-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764855549/voice_preview_Despina-flash_mx4tow.wav' },
    { voiceId: 'Erinome-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764855586/voice_preview_Erinome-flash_rdxpd1.wav' },
    { voiceId: 'Laomedeia-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764855617/voice_preview_Laomedeia-flash_w8lzza.wav' },
    { voiceId: 'Pulcherrima-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764855847/voice_preview_Pulcherrima-flash_sm1ias.wav' },
    { voiceId: 'Achird-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764855863/voice_preview_Achird-flash_a9wjak.wav' },
    { voiceId: 'Vindemiatrix-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764855878/voice_preview_Vindemiatrix-flash_h1txhx.wav' },
    { voiceId: 'Sadachbia-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764856031/voice_preview_Sadachbia-flash_mg7ut8.wav' },
    { voiceId: 'Sulafat-flash', url: 'https://res.cloudinary.com/dyarnpqaq/raw/upload/v1764856048/voice_preview_Sulafat-flash_sadp7f.wav' },
];

async function addWavHeader(audioBuffer) {
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;

    const dataSize = audioBuffer.length;
    const fileSize = 36 + dataSize;

    const header = new ArrayBuffer(44);
    const view = new DataView(header);

    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, fileSize, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
    view.setUint16(32, numChannels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true);

    const wavFile = new Uint8Array(44 + audioBuffer.length);
    wavFile.set(new Uint8Array(header), 0);
    wavFile.set(audioBuffer, 44);

    return Buffer.from(wavFile);
}

async function convertAndReupload() {
    console.log('🔄 Converting existing previews to proper WAV format...\n');

    let sqlStatements = '-- Update preview URLs with converted files\n';
    let successCount = 0;

    for (const preview of existingPreviews) {
        try {
            console.log(`📥 Downloading: ${preview.voiceId}...`);

            // Download raw audio
            const response = await fetch(preview.url);
            const arrayBuffer = await response.arrayBuffer();
            const rawAudio = new Uint8Array(arrayBuffer);

            console.log(`   ✏️  Adding WAV headers...`);
            const wavFile = await addWavHeader(rawAudio);

            console.log(`   ☁️  Re-uploading to Cloudinary...`);
            const form = new FormData();
            form.append('file', wavFile, {
                filename: `voice_preview_${preview.voiceId}_fixed.wav`,
                contentType: 'audio/wav'
            });
            form.append('upload_preset', 'ml_default');
            form.append('resource_type', 'video');

            const uploadResponse = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
                { method: 'POST', body: form }
            );

            const data = await uploadResponse.json();
            console.log(`   ✅ ${preview.voiceId}: ${data.secure_url}\n`);

            sqlStatements += `UPDATE voice_presets SET preview_url = '${data.secure_url}' WHERE voice_id = '${preview.voiceId}';\n`;
            successCount++;

        } catch (error) {
            console.error(`   ❌ ${preview.voiceId}: ${error.message}\n`);
        }
    }

    console.log(`\n✨ Conversion complete! ${successCount}/${existingPreviews.length} files converted\n`);
    console.log('📝 SQL to update database:\n');
    console.log(sqlStatements);
}

convertAndReupload().catch(console.error);
