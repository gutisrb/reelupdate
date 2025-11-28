# Manual Steps Required

Since the Supabase CLI is not installed locally, you'll need to complete these steps through the Supabase Dashboard.

---

## ✅ Completed:
- ✅ Script dependencies installed (tsx, dotenv)
- ✅ Development server running at http://localhost:8080/

---

## 📋 Remaining Manual Steps:

### 1. Apply Database Migrations

**Via Supabase Dashboard:**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Database** → **Migrations**
4. Create new migration or run SQL directly in the **SQL Editor**:

**Run This Migration:**
```sql
-- Copy and paste the entire contents of:
supabase/migrations/20250124000002_update_customization_tables.sql
```

**This migration is SAFE to run multiple times** - it checks for existing tables/columns before creating them.

**What it does:**
- ✅ Adds `voice_type` column to `voice_presets` (if not exists)
- ✅ Adds `selected_custom_music_id`, `music_license_accepted`, `music_license_accepted_at` to `user_settings` (if not exist)
- ✅ Creates `custom_music_uploads` table (if not exists)
- ✅ Creates RLS policies (if not exist)
- ✅ Creates helper function `get_user_music_preference`

**Note:** This migration file was specifically designed to avoid conflicts with existing tables/policies.

---

### 2. Deploy Edge Functions

**Via Supabase Dashboard:**

1. Go to **Edge Functions** section
2. Create a new function called `upload-custom-music`
   - Copy contents from: `supabase/functions/upload-custom-music/index.ts`
   - Deploy it

3. Update existing function `process-video-generation`
   - Copy updated contents from: `supabase/functions/process-video-generation/index.ts`
   - Deploy it

**OR via Supabase CLI (if you install it):**
```bash
# Install Supabase CLI
brew install supabase/tap/supabase  # macOS
# or
npm install -g supabase              # via npm

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy upload-custom-music
supabase functions deploy process-video-generation
```

---

### 3. Set Environment Variables for Edge Functions

**Via Supabase Dashboard:**

1. Go to **Edge Functions** → **Manage secrets**
2. Add these secrets:

```
LUMA_API_KEY=your_luma_api_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ZAPCAP_API_KEY=your_zapcap_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Note:** These are the same values from your `.env` file, but need to be set in Supabase for the Edge Functions to access them.

---

### 4. Generate Voice Previews (Optional but Recommended)

**After setting environment variables:**

```bash
npx tsx scripts/generate-voice-previews.ts
```

This will:
- Fetch 100+ Serbian voices from Google Cloud TTS
- Generate preview audio for each voice
- Upload to Cloudinary
- Populate the `voice_presets` table

**Expected runtime:** 5-10 minutes (depending on number of voices)

---

### 5. Test Environment (Recommended)

```bash
npx tsx scripts/check-environment.ts
```

This will verify:
- All environment variables are set
- All API keys are valid
- Database connectivity works
- Cloudinary is configured

**Run this before testing video generation to catch issues early!**

---

## 🧪 Testing the New Features

### Test 1: Music Upload

1. Open http://localhost:8080/app/login and log in
2. Go to **Settings** → **Muzika** tab
3. Accept the license terms checkbox
4. Upload a short MP3 file (under 10MB, under 60 seconds)
5. Verify:
   - Upload succeeds
   - Music appears in list
   - Preview player works
   - Can select as default

### Test 2: Voice Previews (after running generator script)

1. Go to **Settings** → **Glas** tab
2. Verify:
   - Multiple voices are listed (100+)
   - Can play voice previews
   - Voices are organized by type

### Test 3: Full Video Generation (when you have Luma credits)

1. Set music preference to "custom" in Settings
2. Select an uploaded song
3. Go to **Reel Studio** (`/app/reel`)
4. Fill in property details
5. Upload 5-6 images
6. Click "Generiši video"
7. Wait 5-10 minutes
8. Check **Galerija** for completed video
9. Verify video uses your custom music

---

## 🐛 Troubleshooting

### "No matching edge function found"
- Make sure Edge Functions are deployed
- Check function names are exactly: `upload-custom-music` and `process-video-generation`

### "Missing environment variables"
- Set all secrets in Supabase Dashboard → Edge Functions → Manage secrets
- Redeploy functions after setting secrets

### "Table does not exist"
- Run the migration SQL in Database → SQL Editor
- Check for typos in table names

### Music upload fails
- Check Cloudinary credentials are set in Edge Function secrets
- Verify file is under 10MB and 60 seconds
- Check browser console for specific error

### Voice preview generator fails
- Ensure `GOOGLE_AI_API_KEY` is set in `.env`
- Check Text-to-Speech API is enabled in Google Cloud Console
- Verify Cloudinary credentials in `.env`

---

## 📚 Quick Reference

**Dev Server:** http://localhost:8080/
**Supabase Dashboard:** https://supabase.com/dashboard
**Documentation:** See `IMPLEMENTATION_SUMMARY.md` for complete overview

---

**Current Status:**
- ✅ Frontend code complete
- ✅ Backend code complete
- ✅ Dev server running
- ⏳ Database migrations need to be applied manually
- ⏳ Edge Functions need to be deployed manually
- ⏳ Environment variables need to be set in Supabase Dashboard

**Once you complete the manual steps above, everything will be ready for testing!**
