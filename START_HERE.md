# 🚨 START HERE - Issues & Fixes

## Current Problems:
1. ❌ Voice section empty (no voices showing)
2. ❌ Music settings won't save
3. ❌ Music upload fails ("Failed to fetch")
4. ❌ Music previews don't play

## Root Cause:
**Your API keys are missing!**

Your `.env` file only has Supabase URL and Make.com webhooks, but is missing:
- Cloudinary credentials (needed for music upload)
- AI service keys (Luma, OpenAI, Google, ElevenLabs, ZapCap)
- Supabase service role key (needed for database operations)

---

## 🎯 Fix Everything (3 Steps):

### Step 1: Add API Keys to Supabase (10 minutes)

**Where:** https://supabase.com/dashboard/project/nhbsvtcuehbttqtcgpoc/settings/functions

Click **"Manage secrets"**

**What to add:** See `SECRETS_TO_ADD.md` for the complete list and where to get each key.

**Minimum to get music upload working:**
```
SUPABASE_URL=https://nhbsvtcuehbttqtcgpoc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[get from Supabase Dashboard → Settings → API]
CLOUDINARY_CLOUD_NAME=[get from cloudinary.com]
CLOUDINARY_API_KEY=[get from cloudinary.com]
CLOUDINARY_API_SECRET=[get from cloudinary.com]
```

**After adding**, redeploy functions:
```bash
export SUPABASE_ACCESS_TOKEN='sbp_baa13ebd9e0a0e30afa39e92cfed9411c5dc1ef7'
cd /Users/johhn/Documents/flowforge-init
supabase functions deploy upload-custom-music --no-verify-jwt
```

---

### Step 2: Run Database Migration (2 minutes)

**Where:** https://supabase.com/dashboard/project/nhbsvtcuehbttqtcgpoc/sql

**What:** Copy the SQL from `FIXES_NEEDED.md` section "Fix 2" and run it.

This creates the `custom_music_uploads` table and adds missing columns.

---

### Step 3: Add Voices (Quick: 1 minute OR Full: 10 minutes)

**Quick Option (4 voices, no previews):**

Run this SQL in SQL Editor:
```sql
INSERT INTO public.voice_presets (voice_id, language_code, gender, name, description, voice_type, sort_order, active)
VALUES
  ('sr-RS-Standard-A', 'sr-RS', 'female', 'Ana (Ženski)', 'Standardni ženski glas', 'standard', 1, true),
  ('sr-RS-Standard-B', 'sr-RS', 'male', 'Marko (Muški)', 'Standardni muški glas', 'standard', 2, true),
  ('sr-RS-Wavenet-A', 'sr-RS', 'female', 'Jelena (Ženski Premium)', 'Premium ženski glas', 'wavenet', 3, true),
  ('sr-RS-Wavenet-B', 'sr-RS', 'male', 'Stefan (Muški Premium)', 'Premium muški glas', 'wavenet', 4, true)
ON CONFLICT (voice_id) DO NOTHING;
```

**Full Option (100+ voices with audio previews):**

After adding API keys to `.env`:
```bash
npx tsx scripts/generate-voice-previews.ts
```

---

## After Completing All Steps:

### Restart Dev Server:
```bash
# Press Ctrl+C in the terminal running dev
npm run dev
```

### Test Everything:
1. Go to http://localhost:8080/app/settings
2. **Voice tab:** Should see voices listed
3. **Music tab:** Try uploading an MP3 file
4. **Settings:** Try switching between auto-generate and custom music

---

## Quick Checklist:

- [ ] Add API secrets to Supabase Dashboard
- [ ] Redeploy `upload-custom-music` function
- [ ] Run database migration SQL
- [ ] Add voices (quick SQL or full script)
- [ ] Restart dev server
- [ ] Test music upload
- [ ] Test voice selection
- [ ] Test settings save

---

## 📚 Detailed Guides:

- **SECRETS_TO_ADD.md** - Complete list of API keys needed & where to get them
- **FIXES_NEEDED.md** - Step-by-step fixes with SQL code
- **DEPLOY_GUIDE.md** - How to deploy Edge Functions
- **QUICK_START.md** - Original quick start guide

---

## Need Help?

**Check function logs:**
https://supabase.com/dashboard/project/nhbsvtcuehbttqtcgpoc/functions

Click on a function → Logs tab to see errors

**Check browser console:**
Press F12 → Console tab to see frontend errors

---

**The main blocker is missing API keys - fix that first and everything else will work!** 🔑
