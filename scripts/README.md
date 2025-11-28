# Scripts

Utility scripts for managing the application.

## Environment Check

Diagnoses your environment configuration and tests all API connections.

### Usage

```bash
npx tsx scripts/check-environment.ts
```

### What it does:

1. ✅ Checks all required environment variables are set
2. 🔌 Tests connection to Supabase database
3. 🧪 Validates all API keys (Luma, OpenAI, Google, ElevenLabs, ZapCap)
4. ☁️  Verifies Cloudinary configuration
5. 📊 Provides a summary report

### Example Output:

```
🔍 Checking Environment Configuration
=====================================

Checking environment variables...

✅ VITE_SUPABASE_URL
   Set (https://xxx...)

✅ LUMA_API_KEY
   Set (luma_xxxxx...)

Testing API connections...

✅ Supabase Connection
   Database connection successful

✅ Luma AI API
   API key is valid

✅ OpenAI API
   API key is valid

============================
Summary: 12 passed, 0 failed, 0 warnings

✨ All checks passed! Your environment is ready.
```

**Run this before attempting video generation to catch configuration issues early!**

---

## Voice Preview Generator

Generates voice previews for all available Google Cloud TTS Serbian voices and populates the database.

### Prerequisites

1. **Install dependencies:**
   ```bash
   npm install tsx dotenv @supabase/supabase-js --save-dev
   ```

2. **Set up environment variables** in `.env`:
   ```bash
   GOOGLE_AI_API_KEY=your_google_cloud_api_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### Usage

```bash
npx tsx scripts/generate-voice-previews.ts
```

### What it does:

1. ✅ Fetches all Serbian (sr-RS) voices from Google Cloud TTS API
2. 🎙️  Generates a 10-second Serbian preview for each voice
3. ☁️  Uploads each preview to Cloudinary (`voice_previews/` folder)
4. 💾 Populates the `voice_presets` table in Supabase
5. 📊 Displays a summary of voice types (Neural2, WaveNet, Standard, etc.)

### Expected Output:

```
🎙️  Voice Preview Generator
==========================

🔍 Fetching voices from Google Cloud TTS API...
✅ Found 25 Serbian voices

[1/25] Processing sr-RS-Neural2-A...
  🎙️  Generating preview for sr-RS-Neural2-A...
  ☁️  Uploading to Cloudinary...
  ✅ Uploaded: https://res.cloudinary.com/...

[2/25] Processing sr-RS-Wavenet-A...
  ...

💾 Inserting 25 voice presets into database...
✅ Successfully inserted 25 voice presets!

📊 Summary:
   Total voices: 25
   Neural2: 4
   WaveNet: 6
   Studio: 2
   Journey: 3
   Standard: 10

✨ Done!
```

### Troubleshooting:

**Error: "Missing required environment variables"**
- Make sure all environment variables are set in `.env` file

**Error: "Failed to fetch voices: 403 Forbidden"**
- Check that your Google Cloud API key is valid
- Ensure the Text-to-Speech API is enabled in your Google Cloud project

**Error: "Cloudinary upload failed"**
- Verify your Cloudinary credentials
- Check that you have an upload preset configured (or remove the `upload_preset` line)

**Error: "Database insert failed"**
- Make sure the database migration has been applied: `supabase db push`
- Check that your Supabase service role key is correct

### Re-running the script:

The script clears existing voice presets before inserting new ones, so it's safe to run multiple times.

### Preview Text:

The script uses the following Serbian text for voice previews:

> "Dobar dan. Ovo je primer mog glasa za nekretninske video prezentacije.
> Jasno izgovaram reči i brojeve poput dva stana osamdesetpet kvadrata sa tri spavaće sobe i dva kupatila.
> Cena je sto trideset pet hiljada evra. Kontaktirajte nas za više informacija."

You can modify this text in the script by changing the `PREVIEW_TEXT` constant.
