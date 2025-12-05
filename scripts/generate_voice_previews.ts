// Script to generate preview audio files for Gemini voices
// Run this once to create preview files for all voices

import { GoogleAIClient } from '../supabase/functions/_shared/clients/google.ts';
import { CloudinaryClient } from '../supabase/functions/_shared/clients/cloudinary.ts';

const PREVIEW_TEXT = "Dobrodošli u vašu novu nekretninu. Ovaj moderan stan nudi savršenu kombinaciju luksuza i komfora.";

const voices = [
    'Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Aoede',
    'Callirrhoe', 'Autonoe', 'Enceladus', 'Iapetus', 'Umbriel', 'Algieba',
    'Despina', 'Erinome', 'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar',
    'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird', 'Zubenelgenubi',
    'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat'
];

const models = ['flash', 'pro'];

async function generatePreviews() {
    const google = new GoogleAIClient();
    const cloudinary = new CloudinaryClient();

    console.log('Starting preview generation for all Gemini voices...');

    for (const voice of voices) {
        for (const model of models) {
            const voiceId = `${voice}-${model}`;

            try {
                console.log(`Generating preview for ${voiceId}...`);

                // Generate TTS
                const audioBuffer = await google.generateTTS(PREVIEW_TEXT, voiceId);

                // Upload to Cloudinary
                const upload = await cloudinary.uploadVideo(
                    audioBuffer,
                    `voice_preview_${voiceId}.mp3`
                );

                console.log(`✓ ${voiceId}: ${upload.secure_url}`);

                // Wait a bit to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                console.error(`✗ ${voiceId}: ${error.message}`);
            }
        }
    }

    console.log('Preview generation complete!');
}

generatePreviews().catch(console.error);
