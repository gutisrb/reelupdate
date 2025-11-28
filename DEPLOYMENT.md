# Phase 1 Deployment Guide

## 🎉 What's Been Built

The entire Make.com workflow has been migrated to code:

### ✅ Backend (Supabase Edge Functions)
- Complete video generation pipeline
- Credit checking & deduction
- Parallel clip processing (GPT-4o + Luma AI)
- Audio generation (Gemini TTS + ElevenLabs)
- Video assembly (Cloudinary)
- Caption workflow (ZapCap)
- Database integration

### ✅ Frontend (React UI)
- Settings page (`/app/settings`) with 4 tabs:
  - Voice selection (with audio previews)
  - Logo upload (with position picker)
  - Caption template selector (visual grid)
  - Post description template editor
- Updated VideoWizard to call Edge Functions
- Navigation updates

### ✅ Database
- 6 new tables for user customization
- Pre-seeded with default Serbian voices
- Default caption template configured

---

## 📋 Pre-Deployment Checklist

### 1. Gather API Keys

You'll need keys for these services:

| Service | Where to Get It | Purpose |
|---------|----------------|---------|
| **Luma AI** | https://lumalabs.ai/dream-machine/api | Video generation |
| **OpenAI** | https://platform.openai.com/api-keys | GPT-4o Vision (image analysis) |
| **ElevenLabs** | https://elevenlabs.io/api | Background music |
| **ZapCap** | Your ZapCap dashboard | Captions |
| **Google AI Studio** | https://aistudio.google.com/app/apikey | Gemini TTS + voiceover scripts |
| **Cloudinary** | Your existing account | Already have: `dyarnpqaq` |

### 2. Get Supabase Credentials

From your Supabase dashboard:
- Project URL: `https://[your-project].supabase.co`
- Anon Key: Settings → API → `anon` `public` key
- Service Role Key: Settings → API → `service_role` key (⚠️ **Keep secret!**)

---

## 🚀 Deployment Steps

### Step 1: Deploy Database Migration

```bash
cd /Users/johhn/Documents/flowforge-init

# If you have Supabase CLI installed:
supabase db push

# OR manually: Copy the migration SQL and run in Supabase SQL Editor
# File: supabase/migrations/20250120000001_add_customization_tables.sql
```

**Verify migration worked:**
- Go to Supabase Dashboard → Table Editor
- You should see new tables: `user_settings`, `voice_presets`, `caption_templates`, etc.

### Step 2: Deploy Edge Functions

```bash
# Install Supabase CLI (if not already installed)
# macOS:
brew install supabase/tap/supabase

# Deploy Edge Functions
supabase functions deploy process-video-generation

# Set environment variables for Edge Function
supabase secrets set LUMA_API_KEY=your_key_here
supabase secrets set OPENAI_API_KEY=your_key_here
supabase secrets set ELEVENLABS_API_KEY=your_key_here
supabase secrets set ZAPCAP_API_KEY=your_key_here
supabase secrets set GOOGLE_AI_API_KEY=your_key_here
supabase secrets set CLOUDINARY_API_KEY=your_key_here
supabase secrets set CLOUDINARY_API_SECRET=your_key_here
```

### Step 3: Configure Frontend Environment

```bash
# Copy example file
cp .env.example .env

# Edit .env with your values:
nano .env
```

**Required values in `.env`:**
```env
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Step 4: Seed Voice Presets (Optional)

The migration already adds 3 default Serbian voices. To add more:

```sql
INSERT INTO public.voice_presets (voice_id, language_code, gender, name, description, sort_order, preview_url) VALUES
  ('sr-RS-Wavenet-B', 'sr-RS', 'male', 'Muškarac - Wavenet B', 'Visokokvalitetni muški glas', 4, 'cloudinary_url_here');
```

### Step 5: Add Caption Template Screenshots

1. Take screenshots of ZapCap templates from your dashboard
2. Upload to Cloudinary:
   ```bash
   # Upload via Cloudinary dashboard or API
   # Folder: /caption-templates/
   ```
3. Update database:
   ```sql
   UPDATE caption_templates
   SET preview_image_url = 'https://res.cloudinary.com/dyarnpqaq/image/upload/...'
   WHERE zapcap_template_id = '6255949c-4a52-4255-8a67-39ebccfaa3ef';
   ```

### Step 6: Test Locally

```bash
# Install dependencies (if needed)
npm install

# Run development server
npm run dev
```

**Navigate to:** `http://localhost:8080/app/settings`

**Test each tab:**
- ✅ Voice selector loads voices
- ✅ Logo upload works
- ✅ Caption templates display (may show placeholder if no screenshots)
- ✅ Post template editor shows preview

### Step 7: Test Video Generation

1. Go to `/app/reel`
2. Fill in property details (Step 1)
3. Upload 5-6 images (Step 2)
4. Click "Generate" (Step 3)

**Monitor progress:**
```bash
# Watch Edge Function logs
supabase functions logs process-video-generation --tail
```

**Expected flow:**
1. Credit deducted
2. Video record created (status: `processing`)
3. Clips generated (5-10 min total)
4. Audio generated
5. Video assembled
6. Captions added
7. Video record updated (status: `completed`)

**Check Supabase:**
- `videos` table: status should be `completed`
- `video_generation_details` table: should have full metadata

---

## 🐛 Troubleshooting

### Video Generation Fails

**Check Edge Function logs:**
```bash
supabase functions logs process-video-generation
```

**Common issues:**
- **"User not found"**: User doesn't exist in `profiles` table
- **"NO_VIDEO_CREDITS"**: User has 0 credits
- **API key errors**: Check `supabase secrets list`
- **Timeout**: Luma generation taking too long (increase poll attempts in config)

### Settings Page Issues

**Voice selector empty:**
```sql
-- Check if voices exist
SELECT * FROM voice_presets WHERE active = true;

-- If empty, run migration again or insert manually
```

**Caption templates empty:**
```sql
-- Check templates
SELECT * FROM caption_templates WHERE active = true;

-- Should have at least 1 default template
```

### Frontend Errors

**"Supabase URL not configured":**
- Check `.env` file exists
- Verify `VITE_SUPABASE_URL` is set
- Restart dev server: `npm run dev`

**Edge Function 404:**
- Verify function is deployed: `supabase functions list`
- Check URL format: `https://[project].supabase.co/functions/v1/process-video-generation`

---

## 📊 Cost Estimates (Per Video)

| Service | Cost per Video | Notes |
|---------|---------------|-------|
| Luma AI | $0.50 - $1.00 | 5-6 clips @ ~$0.10-0.20 each |
| OpenAI GPT-4o | $0.15 - $0.30 | Image analysis for 5-6 clips |
| Google Gemini | $0.02 - $0.05 | Voiceover script + TTS |
| ElevenLabs | $0.20 - $0.40 | Background music |
| ZapCap | $0.10 - $0.20 | Captions |
| **Total** | **$0.97 - $1.95** | ~$1.50 average |

**Optimization tips:**
- Use GPT-4o-mini for prompts (10x cheaper)
- Pre-generate music library (reuse tracks)
- Batch video generation during off-peak hours

---

## 🔧 Post-Deployment Tasks

### Add More ZapCap Templates

1. Get template IDs from ZapCap dashboard
2. Insert into database:
```sql
INSERT INTO caption_templates (name, zapcap_template_id, style_description, sort_order, preview_image_url) VALUES
  ('Energetic Pop', 'template-id-here', 'Dinamičan stil sa animacijama', 2, 'cloudinary_url');
```

### Create Voice Previews

1. Generate 10-second samples using Google TTS
2. Upload to Cloudinary
3. Update `voice_presets` table with `preview_url`

### Monitor Usage

```sql
-- Check total videos generated today
SELECT COUNT(*) FROM videos WHERE DATE(created_at) = CURRENT_DATE;

-- Check average processing time
SELECT AVG(total_processing_time_seconds) FROM video_generation_details;

-- Check credit usage
SELECT user_id, video_credits_remaining FROM profiles ORDER BY video_credits_remaining ASC;
```

---

## 🎯 Next Steps (Future Phases)

Once Phase 1 is stable:

**Phase 2 (User Customization):**
- Music library UI (pick from pre-generated tracks)
- Voiceover script editing
- Per-clip camera motion overrides

**Phase 3 (Clip Re-generation):**
- Allow users to fix individual clips
- Re-upload specific images
- Regenerate only failed clips

**Phase 4 (Analytics):**
- Track which settings produce best videos
- A/B test prompts
- User feedback collection

---

## 📞 Need Help?

If you encounter issues:

1. **Check logs first:** `supabase functions logs process-video-generation`
2. **Verify API keys:** `supabase secrets list`
3. **Test individual APIs:** Use Postman/curl to verify keys work
4. **Database state:** Check Supabase Table Editor for data

---

## ✅ Success Criteria

Your Phase 1 is successful when:

1. ✅ User can set voice, logo, caption preferences in Settings
2. ✅ Video generation completes end-to-end (5-10 test videos)
3. ✅ Output quality matches Make.com
4. ✅ Processing time within 10% of Make.com
5. ✅ No errors in Edge Function logs
6. ✅ User settings persist and apply to new videos

**You can then turn off Make.com completely!** 🎉
