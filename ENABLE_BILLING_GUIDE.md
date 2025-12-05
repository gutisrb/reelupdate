# Enable Google Cloud Billing for Gemini TTS

## ✅ Your API Key is Already Correct!
Your API key from **Google AI Studio** (aistudio.google.com) already has access to:
- ✅ Gemini 2.5 Flash TTS voices
- ✅ Gemini 2.5 Pro TTS voices
- ✅ All 30 voice presets (Zephyr, Puck, Kore, etc.)

**You just need to enable billing to remove the 15/day limit.**

---

## Step-by-Step: Enable Billing

### Step 1: Go to Google AI Studio
1. Open: https://aistudio.google.com/
2. Sign in with your Google account

### Step 2: Check Your API Key's Project
1. Click **"Get API key"** in the left sidebar
2. You'll see your API key and which **Google Cloud Project** it belongs to
3. Note the project name (e.g., "My Project" or "generativelanguage-...")

### Step 3: Enable Billing for That Project
1. Click the **"Enable billing"** button in Google AI Studio, OR
2. Go directly to: https://console.cloud.google.com/billing
3. Select your project from Step 2
4. Click **"Link a billing account"**
5. Add your credit card and complete setup

### Step 4: Verify Billing is Active
1. Go back to: https://aistudio.google.com/
2. You should see "Billing enabled" or similar confirmation
3. The 15/day limit will be removed

---

## Alternative: Use Vertex AI (Optional)
If you can't find the billing option in AI Studio:

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Search for **"Vertex AI API"** in the search bar
4. Enable it (this is the same API, different interface)
5. Go to Billing: https://console.cloud.google.com/billing
6. Link a billing account

---

## Cost Estimate
- **30 Flash previews**: ~$0.30-0.50 total
- **Per preview**: ~$0.01-0.02
- Very affordable for one-time generation!

## Important Notes
- ✅ You'll only pay for what you use
- ✅ No monthly fees or subscriptions
- ✅ First-time users often get **$300 free credit**
- ✅ Same voices as Google AI Studio

## Once Billing is Enabled
Let me know and I'll run:
```bash
node scripts/generate_voice_previews.mjs
```

This will generate all 30 Flash previews in about 5-10 minutes!

---

## ⚠️ Troubleshooting: Still Getting Quota Errors?

If you linked billing but still see "RESOURCE_EXHAUSTED" errors, you need to **enable the paid API**:

### Option 1: Enable Vertex AI API (Recommended)
1. Go to: https://console.cloud.google.com/marketplace/product/google/aiplatform.googleapis.com
2. Select your project (the one with $300 credits)
3. Click **"Enable"**
4. Wait 1-2 minutes for it to activate
5. Try running the script again

### Option 2: Create a New API Key in Cloud Console
1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your project with billing enabled
3. Click **"Create Credentials"** → **"API Key"**
4. Copy the new API key
5. Replace the old key in your `.env.local` file
6. Try running the script again

### Why This Happens
- Google AI Studio API keys default to **free tier** (15/day limit)
- Even with billing enabled, they stay on free tier
- Vertex AI API or Cloud Console API keys use **paid tier** (unlimited)

Let me know once you've tried one of these options!
