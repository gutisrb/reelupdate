# Voice Preview Generation Instructions

## Overview
This guide will help you generate preview audio files for all 60 Gemini voices and update the database with the preview URLs.

## Prerequisites

### 1. Environment Variables
You need the following environment variables set:

```bash
export GOOGLE_AI_API_KEY="your-google-ai-api-key"
export CLOUDINARY_API_KEY="your-cloudinary-api-key"
export CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
export CLOUDINARY_CLOUD_NAME="dyarnpqaq"  # Your cloud name
```

### 2. Install Dependencies
```bash
npm install node-fetch form-data
```

## Step-by-Step Process

### Step 1: Run the Preview Generation Script

```bash
cd /Users/johhn/reelestate2/reelupdate
node scripts/generate_voice_previews.mjs
```

**What this does:**
- Generates 60 audio files using Google Gemini TTS API
- Uses the phrase: "Dobar dan, ovo je primer mog glasa za video prezentacije."
- Uploads each file to Cloudinary
- Outputs SQL UPDATE statements
- Saves results to `voice_preview_results.json`

**Expected duration:** ~5-10 minutes (with 2-second delays between API calls)

### Step 2: Apply the Migration

First, apply the base migration with Serbian names:

```bash
# Using Supabase CLI
supabase db push

# Or manually through Supabase dashboard
# Copy the contents of: supabase/migrations/20251203000001_update_voices_gemini.sql
```

### Step 3: Update Preview URLs

After the script completes, it will output SQL UPDATE statements. Copy these and run them in your Supabase SQL editor:

```sql
-- Example output from the script:
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/...' WHERE voice_id = 'Zephyr-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/...' WHERE voice_id = 'Zephyr-pro';
-- ... (60 total)
```

## Voice List with Serbian Names

### Male Voices (17 × 2 = 34 voices)
- Marko (Zephyr) - Svetao i jasan ton
- Stefan (Puck) - Optimističan i energičan
- Nikola (Charon) - Dubok i informativan
- Aleksandar (Fenrir) - Uzbudljiv i dinamičan
- Luka (Orus) - Čvrst i autoritativan
- Dimitrije (Enceladus) - Disajući i mekan
- Miloš (Iapetus) - Jasan i razgovetan
- Nemanja (Umbriel) - Opušten i miran
- Petar (Algieba) - Gladak i uglađen
- Đorđe (Algenib) - Hrapav i teksturiran
- Vladimir (Rasalgethi) - Informativan i stručan
- Dušan (Achernar) - Mekan i nežan
- Jovan (Alnilam) - Čvrst i siguran
- Milan (Schedar) - Uravnotežen i stabilan
- Branko (Gacrux) - Zreo i etabliran
- Srđan (Zubenelgenubi) - Ležeran i opušten
- Dejan (Sadaltager) - Znalački i ekspertski

### Female Voices (13 × 2 = 26 voices)
- Ana (Kore) - Čvrsta i profesionalna
- Jelena (Leda) - Mladalačka i svežа
- Milica (Aoede) - Lagana i prozračna
- Jovana (Callirrhoe) - Opuštena i prijatna
- Marija (Autonoe) - Svetla i privlačna
- Katarina (Despina) - Glatka i elegantna
- Teodora (Erinome) - Jasna i artikulisana
- Sofija (Laomedeia) - Optimistična i vesela
- Ivana (Pulcherrima) - Direktna i otvorena
- Aleksandra (Achird) - Prijateljska i topla
- Tijana (Vindemiatrix) - Nežna i ljubazna
- Maja (Sadachbia) - Živahna i animirana
- Nina (Sulafat) - Topla i privlačna

Each voice is available in both **Flash** and **Pro** variants.

## Troubleshooting

### API Rate Limiting & Quotas
If you see errors like `429 Too Many Requests` or `RESOURCE_EXHAUSTED`, you have likely hit the Google Gemini API rate limits.
- **Free Tier Limit**: ~15 requests per day per model.
- **Solution**: 
  1. Wait for the quota to reset (usually 24 hours).
  2. Upgrade to a paid Google Cloud project.
  3. Use a different API key.

The script includes automatic retries, but it cannot bypass daily quotas.

### Failed Uploads
Check `voice_preview_results.json` to see which voices failed and their error messages.

### Missing Environment Variables
Make sure all environment variables are set before running the script.

## Verification

After completing all steps:
1. Go to Settings > Voices in your app
2. Verify all 60 voices are listed with Serbian names
3. Click "Preview" on any voice to test the audio
4. Verify the correct model badge (Flash = Orange, Pro = Red)

## Files Modified

- ✅ `supabase/migrations/20251203000001_update_voices_gemini.sql` - Migration with Serbian names
- ✅ `scripts/generate_voice_previews.mjs` - Preview generation script
- ✅ `supabase/functions/_shared/config.ts` - Added Flash/Pro endpoints
- ✅ `supabase/functions/_shared/clients/google.ts` - Updated TTS logic
- ✅ `src/components/settings/VoiceSettingsRedesigned.tsx` - Added Gemini badges/filters
