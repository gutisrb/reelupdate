/**
 * Voice Preview Generator Script
 *
 * This script:
 * 1. Fetches all available voices from Google Cloud Text-to-Speech API
 * 2. Filters for Serbian (sr-RS) voices
 * 3. Generates a 10-second preview for each voice
 * 4. Uploads previews to Cloudinary
 * 5. Populates the voice_presets table in Supabase
 *
 * Usage:
 *   npx tsx scripts/generate-voice-previews.ts
 *
 * Required environment variables:
 *   - GOOGLE_AI_API_KEY (Google Cloud API key with TTS access)
 *   - CLOUDINARY_CLOUD_NAME
 *   - CLOUDINARY_API_KEY
 *   - CLOUDINARY_API_SECRET
 *   - VITE_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validation
if (!GOOGLE_API_KEY || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY ||
    !CLOUDINARY_API_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Required: GOOGLE_AI_API_KEY, CLOUDINARY_*, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Serbian preview text
const PREVIEW_TEXT = `Dobar dan. Ovo je primer mog glasa za nekretninske video prezentacije.
Jasno izgovaram reči i brojeve poput dva stana osamdesetpet kvadrata sa tri spavaće sobe i dva kupatila.
Cena je sto trideset pet hiljada evra. Kontaktirajte nas za više informacija.`;

interface GoogleVoice {
  languageCodes: string[];
  name: string;
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  naturalSampleRateHertz: number;
}

interface VoicePreset {
  voice_id: string;
  language_code: string;
  gender: string;
  name: string;
  description: string;
  preview_url: string | null;
  active: boolean;
  sort_order: number;
  voice_type: string;
}

/**
 * Fetch all available voices from Google Cloud TTS
 */
async function fetchGoogleVoices(): Promise<GoogleVoice[]> {
  console.log('🔍 Fetching voices from Google Cloud TTS API...');

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/voices?key=${GOOGLE_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch voices: ${response.statusText}`);
  }

  const data = await response.json();

  // Filter for Serbian voices
  const serbianVoices = data.voices.filter((voice: GoogleVoice) =>
    voice.languageCodes.includes('sr-RS')
  );

  console.log(`✅ Found ${serbianVoices.length} Serbian voices`);
  return serbianVoices;
}

/**
 * Generate TTS audio for a specific voice
 */
async function generateVoicePreview(voiceId: string, languageCode: string): Promise<Buffer> {
  console.log(`  🎙️  Generating preview for ${voiceId}...`);

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: PREVIEW_TEXT },
        voice: {
          languageCode: languageCode,
          name: voiceId,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TTS generation failed for ${voiceId}: ${error}`);
  }

  const data = await response.json();

  if (!data.audioContent) {
    throw new Error(`No audio content returned for ${voiceId}`);
  }

  // Convert base64 to buffer
  return Buffer.from(data.audioContent, 'base64');
}

/**
 * Upload audio to Cloudinary
 */
async function uploadToCloudinary(audioBuffer: Buffer, voiceId: string): Promise<string> {
  console.log(`  ☁️  Uploading to Cloudinary...`);

  // Create temporary file
  const tempDir = path.join(process.cwd(), '.temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFile = path.join(tempDir, `${voiceId}.mp3`);
  fs.writeFileSync(tempFile, audioBuffer);

  try {
    // Upload to Cloudinary using unsigned upload (simpler, no signature needed)
    const formData = new FormData();
    const fileBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    formData.append('file', fileBlob, `${voiceId}.mp3`);
    formData.append('upload_preset', 'ml_default');
    formData.append('folder', 'voice_previews');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudinary upload failed: ${error}`);
    }

    const data = await response.json();
    console.log(`  ✅ Uploaded: ${data.secure_url}`);

    return data.secure_url;
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

/**
 * Generate Cloudinary signature
 */
async function generateCloudinarySignature(params: Record<string, string>): Promise<string> {
  const crypto = await import('crypto');

  // Sort parameters alphabetically
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  const message = sortedParams + CLOUDINARY_API_SECRET;

  return crypto.createHash('sha1').update(message).digest('hex');
}

/**
 * Get friendly name for voice with actual Serbian names (unique names)
 */
const usedMaleNames = new Set<string>();
const usedFemaleNames = new Set<string>();

function getVoiceFriendlyName(voiceId: string, gender: string): string {
  const type = voiceId.includes('Wavenet') ? 'Premium' :
                voiceId.includes('Neural2') ? 'Ultra' :
                voiceId.includes('Studio') ? 'Studio' :
                voiceId.includes('Journey') ? 'Konverzacijski' :
                voiceId.includes('Chirp3-HD') ? 'HD' : 'Standard';

  // Large pool of Serbian names
  const maleNames = [
    'Marko', 'Stefan', 'Nikola', 'Luka', 'Aleksandar', 'Milan', 'Đorđe', 'Vladimir',
    'Nemanja', 'Filip', 'Dušan', 'Miloš', 'Ivan', 'Petar', 'Jovan', 'Danilo',
    'Uroš', 'Vuk', 'Dimitrije', 'Bogdan', 'Srđan', 'Dejan', 'Goran', 'Zoran',
    'Darko', 'Igor', 'Branko', 'Dragan', 'Mladen', 'Bojan', 'Pavle', 'Novak'
  ];

  const femaleNames = [
    'Ana', 'Jelena', 'Milica', 'Sara', 'Sofija', 'Nina', 'Teodora', 'Jovana',
    'Marija', 'Katarina', 'Anastasija', 'Dunja', 'Isidora', 'Mila', 'Lena', 'Petra',
    'Maja', 'Nataša', 'Ivana', 'Aleksandra', 'Nevena', 'Tamara', 'Dragana', 'Vesna',
    'Sanja', 'Snežana', 'Tijana', 'Jasmina', 'Anđela', 'Kristina', 'Emilija', 'Luna'
  ];

  let name = '';
  if (gender === 'MALE') {
    // Find first unused male name
    for (const n of maleNames) {
      if (!usedMaleNames.has(n)) {
        name = n;
        usedMaleNames.add(n);
        break;
      }
    }
    if (!name) name = `Muški ${usedMaleNames.size + 1}`;
  } else if (gender === 'FEMALE') {
    // Find first unused female name
    for (const n of femaleNames) {
      if (!usedFemaleNames.has(n)) {
        name = n;
        usedFemaleNames.add(n);
        break;
      }
    }
    if (!name) name = `Ženski ${usedFemaleNames.size + 1}`;
  } else {
    // For neutral, use the voice ID's celestial name
    const celestialName = voiceId.split('-').pop() || 'Glas';
    name = celestialName;
  }

  const genderLabel = gender === 'MALE' ? 'muški' : gender === 'FEMALE' ? 'ženski' : 'neutralan';

  return `${name} (${genderLabel}, ${type})`;
}

/**
 * Get voice description matching Google AI Studio style
 */
function getVoiceDescription(voiceId: string, gender: string, sampleRate: number): string {
  const celestialName = voiceId.split('-').pop() || '';
  const hash = Math.abs(celestialName.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0));

  if (voiceId.includes('Chirp3-HD')) {
    const maleDesc = [
      'Dubok, autoritativan ton idealan za profesionalne prezentacije nekretnina',
      'Topao, pouzdan glas savršen za prodajne videe i predstavljanje objekata',
      'Snažan, ubedljiv ton za marketinške kampanje i promocije',
      'Profesionalan, jasan glas za poslovne prezentacije',
      'Energičan, dinamičan ton koji privlači pažnju kupaca'
    ];
    const femaleDesc = [
      'Jasan, energičan glas savršen za marketinške sadržaje i društvene mreže',
      'Prijatan, profesionalan ton za atraktivne prezentacije nekretnina',
      'Topao, pozitivan glas idealan za prodajne videe koji inspirišu',
      'Živahan, angažovan ton za Instagram i TikTok sadržaj',
      'Sofisticiran, elegantan glas za luksuzne nekretnine'
    ];
    const desc = gender === 'MALE' ? maleDesc[hash % maleDesc.length] : femaleDesc[hash % femaleDesc.length];
    return `${desc}. Najnovija Chirp3 HD tehnologija - ${sampleRate/1000}kHz kvalitet.`;
  }

  if (voiceId.includes('Wavenet')) {
    return gender === 'MALE'
      ? 'Premium WaveNet glas sa dubokim tonom i prirodnom prozodijom. Idealan za profesionalne naracije sa emocionalnom dubinom.'
      : 'Premium WaveNet kvalitet - melodičan, prijatan glas. Savršen za angažovanje publike i marketinške videe.';
  }

  if (voiceId.includes('Neural2')) {
    return gender === 'MALE'
      ? 'Najnovija Neural2 generacija - ultra prirodan govor sa naprednom intonacijom. Vrhunski izbor za prestižne projekte.'
      : 'Neural2 tehnologija - kristalno jasan glas sa emocionalnom bojom. Idealan za sve vrste video sadržaja.';
  }

  if (voiceId.includes('Studio')) {
    return 'Studio kvalitet - vrhunski profesionalan glas. Najkvalitetnija opcija za komercijalne projekte i brendiranje.';
  }

  if (voiceId.includes('Journey')) {
    return 'Journey glas - optimizovan za duge naracije. Prirodan konverzacijski stil koji ne zamara slušaoce.';
  }

  return 'Standardni kvalitet - pouzdana opcija sa jasnom dikcijom. Dobar balans kvaliteta i performansi.';
}

/**
 * Main function
 */
async function main() {
  console.log('🎙️  Voice Preview Generator');
  console.log('==========================\n');

  try {
    // Step 1: Fetch voices
    const voices = await fetchGoogleVoices();

    // Step 2: Clear existing voice presets
    console.log('\n🗑️  Clearing existing voice presets...');
    const { error: deleteError } = await supabase
      .from('voice_presets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.warn('Warning: Could not clear existing presets:', deleteError.message);
    }

    // Step 3: Process each voice
    const voicePresets: VoicePreset[] = [];
    let sortOrder = 1;

    for (const voice of voices) {
      console.log(`\n[${sortOrder}/${voices.length}] Processing ${voice.name}...`);

      try {
        // Generate preview
        const audioBuffer = await generateVoicePreview(voice.name, voice.languageCodes[0]);

        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(audioBuffer, voice.name);

        // Determine voice type for sorting
        const type = voice.name.includes('Neural2') ? 1 :
                      voice.name.includes('Studio') ? 2 :
                      voice.name.includes('Wavenet') ? 3 :
                      voice.name.includes('Journey') ? 4 : 5;

        // Map gender - treat NEUTRAL as the actual pitch (analyze voice ID for A/B pattern)
        let mappedGender = voice.ssmlGender.toLowerCase();
        if (voice.ssmlGender === 'NEUTRAL') {
          // Try to infer from voice name pattern - typically A/C/E are higher (female), B/D/F are lower (male)
          const match = voice.name.match(/-([A-Z])$/);
          if (match) {
            const letter = match[1];
            const letterCode = letter.charCodeAt(0) - 65; // A=0, B=1, etc.
            mappedGender = (letterCode % 2 === 0) ? 'female' : 'male';
          }
        }

        voicePresets.push({
          voice_id: voice.name,
          language_code: voice.languageCodes[0],
          gender: mappedGender,
          name: getVoiceFriendlyName(voice.name, voice.ssmlGender),
          description: getVoiceDescription(voice.name, voice.ssmlGender, voice.naturalSampleRateHertz),
          preview_url: cloudinaryUrl,
          active: true,
          sort_order: type * 100 + sortOrder, // Group by type, then by order
          voice_type: voice.name.includes('Wavenet') ? 'wavenet' :
                       voice.name.includes('Neural2') ? 'neural2' :
                       voice.name.includes('Studio') ? 'studio' :
                       voice.name.includes('Journey') ? 'journey' : 'standard',
        });

        sortOrder++;
      } catch (error) {
        console.error(`  ❌ Failed to process ${voice.name}:`, error);
        // Continue with next voice
      }
    }

    // Step 4: Insert into database
    console.log(`\n💾 Inserting ${voicePresets.length} voice presets into database...`);

    const { error: insertError } = await supabase
      .from('voice_presets')
      .insert(voicePresets);

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    console.log(`✅ Successfully inserted ${voicePresets.length} voice presets!`);

    // Step 5: Display summary
    console.log('\n📊 Summary:');
    console.log(`   Total voices: ${voicePresets.length}`);
    console.log(`   Neural2: ${voicePresets.filter(v => v.voice_type === 'neural2').length}`);
    console.log(`   WaveNet: ${voicePresets.filter(v => v.voice_type === 'wavenet').length}`);
    console.log(`   Studio: ${voicePresets.filter(v => v.voice_type === 'studio').length}`);
    console.log(`   Journey: ${voicePresets.filter(v => v.voice_type === 'journey').length}`);
    console.log(`   Standard: ${voicePresets.filter(v => v.voice_type === 'standard').length}`);

    // Clean up temp directory
    const tempDir = path.join(process.cwd(), '.temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }

    console.log('\n✨ Done!');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
