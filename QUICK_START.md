# Quick Start Guide

## ✅ Already Done:
- Development server running at **http://localhost:8080/**
- All code is complete and ready

---

## 🚀 3 Simple Steps to Get Running:

### Step 1: Run Database Migration (2 minutes)

1. **Open** this file: `supabase/migrations/20250124000002_update_customization_tables.sql`
2. **Copy** the entire contents (Cmd+A, Cmd+C)
3. **Go to** https://supabase.com/dashboard
4. **Navigate to**: Your Project → SQL Editor
5. **Paste** the SQL and click "Run"
6. **Done!** ✅

**Note:** This migration is safe to run multiple times - it won't create duplicates.

---

### Step 2: Deploy Edge Functions (5 minutes)

#### Option A: Via Supabase Dashboard (Easier)

1. **Go to**: Edge Functions → Create new function
2. **Name**: `upload-custom-music`
3. **Copy contents** from: `supabase/functions/upload-custom-music/index.ts`
4. **Paste** and Deploy

5. **Update** existing function: `process-video-generation`
6. **Copy updated contents** from: `supabase/functions/process-video-generation/index.ts`
7. **Paste** and Deploy

#### Option B: Via Supabase CLI (If installed)

```bash
supabase functions deploy upload-custom-music
supabase functions deploy process-video-generation
```

---

### Step 3: Set Environment Secrets (3 minutes)

1. **Go to**: Edge Functions → Manage secrets (gear icon)
2. **Add** these secrets (get values from your `.env` file):

```
LUMA_API_KEY
OPENAI_API_KEY
GOOGLE_AI_API_KEY
ELEVENLABS_API_KEY
ZAPCAP_API_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

3. **Click** Add/Save

---

## 🎉 That's It! Now Test:

### Test Music Upload:
1. Open http://localhost:8080/app/login
2. Login with your account
3. Go to **Settings** → **Muzika** tab
4. Accept the license terms
5. Upload a short MP3 file
6. Verify it appears in the list

---

## 🔧 Optional: Generate Voice Previews

This is optional but recommended - it populates 100+ Serbian voices:

```bash
npx tsx scripts/generate-voice-previews.ts
```

**Runtime:** ~5-10 minutes
**What it does:** Generates preview audio for all Google TTS Serbian voices

---

## ❓ Troubleshooting

**"Function not found"**
- Make sure Edge Functions are deployed
- Wait 1-2 minutes after deployment for functions to be available

**"Missing secrets"**
- Check all 8 secrets are set in Edge Functions → Manage secrets
- Redeploy functions after setting secrets

**"Upload failed"**
- Verify Cloudinary secrets are correct
- Check file is under 10MB and 60 seconds
- Look at browser console for specific error

---

## 📚 Full Documentation

- **MANUAL_STEPS.md** - Detailed step-by-step guide
- **IMPLEMENTATION_SUMMARY.md** - Complete overview of all changes
- **scripts/README.md** - How to use utility scripts

---

**Current Status:**
- ✅ Frontend: Complete
- ✅ Backend: Complete
- ✅ Dev Server: Running
- ⏳ Database: Run migration (Step 1)
- ⏳ Edge Functions: Deploy (Step 2)
- ⏳ Secrets: Configure (Step 3)

**Total time to complete: ~10 minutes**
