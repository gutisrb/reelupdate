# Gemini Voice Migration - Summary

## ✅ Completed Changes

### 1. Database Migration
**File**: `supabase/migrations/20251203000001_update_voices_gemini.sql`
- Disables all existing voices
- Inserts **60 new Gemini voices** (30 voices × 2 models)
  - **Gemini 2.5 Flash** (30 voices)
  - **Gemini 2.5 Pro** (30 voices)
- Voice naming: `{VoiceName}-{model}` (e.g., `Zephyr-flash`, `Kore-pro`)
- All voices include: gender, description, language_code (sr-RS)

### 2. Backend Configuration
**File**: `supabase/functions/_shared/config.ts`
- Added `geminiTTSFlash` endpoint
- Added `geminiTTSPro` endpoint
- Removed old `geminiTTS` endpoint

### 3. Backend Client Logic
**File**: `supabase/functions/_shared/clients/google.ts`
- Updated `generateTTS()` method to:
  - Parse voice ID suffix (`-flash` or `-pro`)
  - Select appropriate endpoint based on model
  - Extract clean voice name (e.g., `Zephyr-flash` → `Zephyr`)

### 4. Frontend Voice Settings
**File**: `src/components/settings/VoiceSettingsRedesigned.tsx`
- Added badge colors:
  - `gemini-flash`: Orange (`bg-orange-500`)
  - `gemini-pro`: Red (`bg-red-500`)
- Added filter options for Gemini Flash and Gemini Pro

### 5. Preview Generation Script
**File**: `scripts/generate_voice_previews.ts`
- Script to generate preview audio for all 60 voices
- Uses Serbian text: "Dobrodošli u vašu novu nekretninu..."
- Uploads to Cloudinary with naming: `voice_preview_{voiceId}.mp3`

## 📋 Next Steps

### Option A: Generate Previews (Recommended)
Run the preview generation script to create audio samples for all voices:

```bash
# You'll need to run this with Deno (since it uses Supabase edge function modules)
# Or adapt it to run with Node.js/tsx
```

### Option B: Manual Preview Upload
If you have existing preview files, update the migration to include `preview_url` values.

### Apply the Migration
```bash
# Using Supabase CLI
supabase db push

# Or apply manually through Supabase dashboard
```

## 🎯 Voice List (30 voices × 2 models = 60 total)

1. Zephyr (Bright)
2. Puck (Upbeat)
3. Charon (Informative)
4. Kore (Firm)
5. Fenrir (Excitable)
6. Leda (Youthful)
7. Orus (Firm)
8. Aoede (Breezy)
9. Callirrhoe (Easy-going)
10. Autonoe (Bright)
11. Enceladus (Breathy)
12. Iapetus (Clear)
13. Umbriel (Easy-going)
14. Algieba (Smooth)
15. Despina (Smooth)
16. Erinome (Clear)
17. Algenib (Gravelly)
18. Rasalgethi (Informative)
19. Laomedeia (Upbeat)
20. Achernar (Soft)
21. Alnilam (Firm)
22. Schedar (Even)
23. Gacrux (Mature)
24. Pulcherrima (Forward)
25. Achird (Friendly)
26. Zubenelgenubi (Casual)
27. Vindemiatrix (Gentle)
28. Sadachbia (Lively)
29. Sadaltager (Knowledgeable)
30. Sulafat (Warm)

Each available in both **Flash** and **Pro** variants.

## 🔍 Testing Checklist

- [ ] Apply migration to database
- [ ] Verify voices appear in Settings > Voices
- [ ] Test voice selection and save
- [ ] Test voice preview playback (once previews are generated)
- [ ] Test filtering by model (Flash/Pro)
- [ ] Generate a test video with a Gemini voice
- [ ] Verify the correct model endpoint is called

## 📝 Notes

- **Preview URLs**: Currently set to `NULL` in migration. Generate them using the script or add manually.
- **Deno Errors**: The TypeScript errors about `Deno` are expected for edge functions - they only run in Deno runtime, not in your IDE.
- **Voice Selection**: The frontend will display all 60 voices. Users can filter by gender and model type.
