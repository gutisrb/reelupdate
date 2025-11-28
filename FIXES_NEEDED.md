# Fixes Needed - Step by Step

## Issues to Fix:
1. ❌ Voice previews not loading
2. ❌ Music settings won't save
3. ❌ Music upload "Failed to fetch" error
4. ❌ Music preview playback not working

---

## Fix 1: Set Environment Secrets (Critical!)

**This is likely causing most issues!**

Go to: https://supabase.com/dashboard/project/nhbsvtcuehbttqtcgpoc/settings/functions

Click **"Manage secrets"** and add these 8 secrets:

Get the values from your `.env` file and add them:

```
SUPABASE_URL=https://nhbsvtcuehbttqtcgpoc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[from your .env]
CLOUDINARY_CLOUD_NAME=[from your .env]
CLOUDINARY_API_KEY=[from your .env]
CLOUDINARY_API_SECRET=[from your .env]
LUMA_API_KEY=[from your .env]
OPENAI_API_KEY=[from your .env]
GOOGLE_AI_API_KEY=[from your .env]
ELEVENLABS_API_KEY=[from your .env]
ZAPCAP_API_KEY=[from your .env]
```

**After adding secrets, redeploy the functions:**

```bash
export SUPABASE_ACCESS_TOKEN='sbp_baa13ebd9e0a0e30afa39e92cfed9411c5dc1ef7'
cd /Users/johhn/Documents/flowforge-init
supabase functions deploy upload-custom-music --no-verify-jwt
supabase functions deploy process-video-generation --no-verify-jwt
```

---

## Fix 2: Run Database Migration

Go to: https://supabase.com/dashboard/project/nhbsvtcuehbttqtcgpoc/sql

**Copy and paste this entire SQL:**

```sql
-- Safe migration that checks before creating

-- Add voice_type column to voice_presets if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voice_presets'
    AND column_name = 'voice_type'
  ) THEN
    ALTER TABLE public.voice_presets
    ADD COLUMN voice_type TEXT DEFAULT 'standard';
  END IF;
END $$;

-- Add columns to user_settings if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings'
    AND column_name = 'selected_custom_music_id'
  ) THEN
    ALTER TABLE public.user_settings
    ADD COLUMN selected_custom_music_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings'
    AND column_name = 'music_license_accepted'
  ) THEN
    ALTER TABLE public.user_settings
    ADD COLUMN music_license_accepted BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings'
    AND column_name = 'music_license_accepted_at'
  ) THEN
    ALTER TABLE public.user_settings
    ADD COLUMN music_license_accepted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create custom_music_uploads table if not exists
CREATE TABLE IF NOT EXISTS public.custom_music_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  cloudinary_url TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  format TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cloudinary_public_id)
);

-- Enable RLS
ALTER TABLE public.custom_music_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'custom_music_uploads'
    AND policyname = 'Users can view own music uploads'
  ) THEN
    CREATE POLICY "Users can view own music uploads"
      ON public.custom_music_uploads FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'custom_music_uploads'
    AND policyname = 'Users can insert own music uploads'
  ) THEN
    CREATE POLICY "Users can insert own music uploads"
      ON public.custom_music_uploads FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'custom_music_uploads'
    AND policyname = 'Users can delete own music uploads'
  ) THEN
    CREATE POLICY "Users can delete own music uploads"
      ON public.custom_music_uploads FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_custom_music_uploads_user_id
  ON public.custom_music_uploads(user_id);

-- Add FK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_settings_selected_custom_music_id_fkey'
  ) THEN
    ALTER TABLE public.user_settings
    ADD CONSTRAINT user_settings_selected_custom_music_id_fkey
    FOREIGN KEY (selected_custom_music_id)
    REFERENCES public.custom_music_uploads(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Create helper function
CREATE OR REPLACE FUNCTION get_user_music_preference(p_user_id UUID)
RETURNS TABLE (
  use_custom BOOLEAN,
  custom_music_url TEXT,
  custom_music_title TEXT,
  music_preference TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN us.selected_custom_music_id IS NOT NULL THEN true
      ELSE false
    END as use_custom,
    cm.cloudinary_url as custom_music_url,
    cm.title as custom_music_title,
    us.music_preference
  FROM public.user_settings us
  LEFT JOIN public.custom_music_uploads cm ON cm.id = us.selected_custom_music_id
  WHERE us.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.custom_music_uploads TO authenticated;
```

Click **"Run"**

---

## Fix 3: Populate Voice Presets (For Voice Section)

The voice section is empty because we haven't populated the voices yet.

**Option A: Manual Insert (Quick - just 4 voices)**

Run this SQL in SQL Editor:

```sql
INSERT INTO public.voice_presets (voice_id, language_code, gender, name, description, voice_type, sort_order, active)
VALUES
  ('sr-RS-Standard-A', 'sr-RS', 'female', 'Ana (Ženski)', 'Standardni ženski glas, prirodan i prijatan za nekretninske videe', 'standard', 1, true),
  ('sr-RS-Standard-B', 'sr-RS', 'male', 'Marko (Muški)', 'Standardni muški glas, profesionalan i autoritativan ton', 'standard', 2, true),
  ('sr-RS-Wavenet-A', 'sr-RS', 'female', 'Jelena (Ženski Premium)', 'Visokokvalitetni ženski glas sa prirodnim naglaskom, topao i prijatan', 'wavenet', 3, true),
  ('sr-RS-Wavenet-B', 'sr-RS', 'male', 'Stefan (Muški Premium)', 'Visokokvalitetni muški glas, energičan i dinamičan', 'wavenet', 4, true)
ON CONFLICT (voice_id) DO NOTHING;
```

**Option B: Full Generator Script (100+ voices with previews - takes 10 mins)**

```bash
cd /Users/johhn/Documents/flowforge-init
npx tsx scripts/generate-voice-previews.ts
```

---

## Fix 4: Restart Dev Server

After making the above changes:

```bash
# Kill the current dev server
# Then restart:
npm run dev
```

---

## Verification Checklist

After completing the fixes above:

### 1. Check Voice Section:
- [ ] Go to Settings → Glas
- [ ] Should see at least 4 voices listed
- [ ] Voices should be selectable

### 2. Check Music Section - Settings Save:
- [ ] Go to Settings → Muzika
- [ ] Try switching between "Automatski generiši" and "Moja uploadovana muzika"
- [ ] Should save without error

### 3. Check Music Upload:
- [ ] Accept license terms
- [ ] Try uploading a small MP3 file
- [ ] Should upload successfully (not "Failed to fetch")

### 4. Check Music Preview:
- [ ] After uploading, click the play button
- [ ] Audio should play

---

## If Issues Persist:

### Check Edge Function Logs:

Go to: https://supabase.com/dashboard/project/nhbsvtcuehbttqtcgpoc/functions

Click on `upload-custom-music` → **Logs** tab

Look for errors like:
- "SUPABASE_URL is not defined"
- "CLOUDINARY_CLOUD_NAME is not defined"
- Any other error messages

### Check Browser Console:

Open browser DevTools (F12) → Console tab

Look for errors when:
- Loading Settings page
- Uploading music
- Saving settings

---

## Most Likely Cause:

**Environment secrets are not set in Supabase!**

This would cause:
- ✅ Music upload to fail (missing Cloudinary credentials)
- ✅ Settings save to fail (missing Supabase credentials)

**Solution:** Complete Fix 1 above (Set Environment Secrets)
