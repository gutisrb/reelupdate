# Environment Secrets That Need To Be Added

## Critical Issue Found:
Your `.env` file is missing the API keys for Cloudinary and AI services!

---

## Where to Add These Secrets:

Go to: **https://supabase.com/dashboard/project/nhbsvtcuehbttqtcgpoc/settings/functions**

Click **"Manage secrets"** or the gear icon (⚙️)

---

## Required Secrets:

### 1. Supabase (Already Known):
```
SUPABASE_URL=https://nhbsvtcuehbttqtcgpoc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[You need to get this from Supabase Dashboard]
```

**To find Service Role Key:**
- Go to: https://supabase.com/dashboard/project/nhbsvtcuehbttqtcgpoc/settings/api
- Look for "service_role" key (starts with `eyJ...`)
- Copy the full key

---

### 2. Cloudinary (You Need These!):
```
CLOUDINARY_CLOUD_NAME=[Your Cloudinary cloud name]
CLOUDINARY_API_KEY=[Your Cloudinary API key]
CLOUDINARY_API_SECRET=[Your Cloudinary API secret]
```

**To find Cloudinary credentials:**
- Log into: https://cloudinary.com/console
- Your cloud name is shown in the dashboard
- API Key and Secret are under "API Keys" section

---

### 3. AI Services (You Need These!):

#### Luma AI (Video Generation):
```
LUMA_API_KEY=[Your Luma API key]
```
Get from: https://lumalabs.ai/dashboard

#### OpenAI (GPT-4o Vision):
```
OPENAI_API_KEY=[Your OpenAI API key]
```
Get from: https://platform.openai.com/api-keys

#### Google AI (Gemini + TTS):
```
GOOGLE_AI_API_KEY=[Your Google AI key]
```
Get from: https://aistudio.google.com/apikey

#### ElevenLabs (Music Generation):
```
ELEVENLABS_API_KEY=[Your ElevenLabs key]
```
Get from: https://elevenlabs.io/app/settings

#### ZapCap (Captions):
```
ZAPCAP_API_KEY=[Your ZapCap key]
```
Get from your ZapCap account

---

## After Adding All Secrets:

### 1. Redeploy Functions:
```bash
export SUPABASE_ACCESS_TOKEN='sbp_baa13ebd9e0a0e30afa39e92cfed9411c5dc1ef7'
cd /Users/johhn/Documents/flowforge-init
supabase functions deploy upload-custom-music --no-verify-jwt
supabase functions deploy process-video-generation --no-verify-jwt
```

### 2. Also Add to Local .env File:

Open `/Users/johhn/Documents/flowforge-init/.env` and add these lines:

```bash
# Supabase Service Role
SUPABASE_SERVICE_ROLE_KEY=[paste here]

# Cloudinary
CLOUDINARY_CLOUD_NAME=[paste here]
CLOUDINARY_API_KEY=[paste here]
CLOUDINARY_API_SECRET=[paste here]

# AI Services
LUMA_API_KEY=[paste here]
OPENAI_API_KEY=[paste here]
GOOGLE_AI_API_KEY=[paste here]
ELEVENLABS_API_KEY=[paste here]
ZAPCAP_API_KEY=[paste here]
```

---

## Why These Are Needed:

- **CLOUDINARY_***: Upload music files and images → **Music upload fails without these!**
- **SUPABASE_SERVICE_ROLE_KEY**: Database operations → **Settings save fails without this!**
- **LUMA_API_KEY**: Generate video clips
- **OPENAI_API_KEY**: Analyze images, correct captions
- **GOOGLE_AI_API_KEY**: Generate scripts, voice synthesis → **Voice generation needs this!**
- **ELEVENLABS_API_KEY**: Generate background music
- **ZAPCAP_API_KEY**: Add captions to videos

---

## Quick Test After Setup:

Run this to verify your environment:
```bash
npx tsx scripts/check-environment.ts
```

This will test all API connections and tell you which ones are working.

---

## Current Status:

- ✅ Edge Functions deployed
- ✅ Code is complete
- ❌ **API keys are missing** ← THIS IS THE BLOCKER!
- ❌ Database migration not run yet
- ❌ Voice presets not populated

**Fix the API keys first, then everything else will work!**
