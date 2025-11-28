-- Migration: Add user customization tables for Phase 1
-- Date: 2025-01-20
-- Purpose: Support voice selection, logo upload, caption templates, and extended video metadata

-- ============================================
-- 1. USER_SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Voice settings
  voice_id TEXT DEFAULT 'sr-RS-Standard-A',
  voice_language_code TEXT DEFAULT 'sr-RS',

  -- Logo/branding settings
  logo_url TEXT,
  logo_position TEXT DEFAULT 'corner_top_right', -- watermark, corner_top_left, corner_top_right, corner_bottom_left, corner_bottom_right
  logo_size_percent INTEGER DEFAULT 15 CHECK (logo_size_percent BETWEEN 10 AND 25),

  -- Caption settings
  caption_template_id UUID,
  caption_enabled BOOLEAN DEFAULT true,

  -- Music settings
  music_preference TEXT DEFAULT 'auto_generate', -- auto_generate, library_pick
  default_music_volume_db INTEGER DEFAULT -60 CHECK (default_music_volume_db BETWEEN -80 AND -40),

  -- Post description template
  post_description_template TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Add RLS policies for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);

-- ============================================
-- 2. VOICE_PRESETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.voice_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_id TEXT NOT NULL UNIQUE, -- Google TTS voice identifier (e.g., "sr-RS-Standard-A")
  language_code TEXT NOT NULL, -- e.g., "sr-RS"
  gender TEXT, -- male, female, neutral
  name TEXT NOT NULL, -- Friendly display name
  description TEXT, -- Description copied from Google Studio
  preview_url TEXT, -- Cloudinary URL for 10s audio sample
  voice_type TEXT DEFAULT 'standard', -- standard, wavenet, neural2, studio, journey
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for voice_presets (public read)
ALTER TABLE public.voice_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voice presets are publicly readable"
  ON public.voice_presets FOR SELECT
  USING (active = true);

-- Create index for active voices
CREATE INDEX idx_voice_presets_active ON public.voice_presets(active, sort_order);

-- ============================================
-- 3. CAPTION_TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.caption_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Friendly display name (e.g., "Bold Modern")
  zapcap_template_id TEXT NOT NULL UNIQUE, -- ZapCap API template ID
  preview_image_url TEXT, -- Cloudinary URL for template screenshot
  style_description TEXT, -- Brief description of style
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for caption_templates (public read)
ALTER TABLE public.caption_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caption templates are publicly readable"
  ON public.caption_templates FOR SELECT
  USING (active = true);

-- Create index for active templates
CREATE INDEX idx_caption_templates_active ON public.caption_templates(active, sort_order);

-- ============================================
-- 4. MUSIC_LIBRARY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.music_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mood TEXT NOT NULL, -- luxury, modern, elegant, cozy, upbeat, calm, sophisticated, etc.
  cloudinary_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  preview_url TEXT, -- 15s preview for users
  elevenlabs_prompt TEXT, -- Original prompt used to generate
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for music_library (public read)
ALTER TABLE public.music_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Music library is publicly readable"
  ON public.music_library FOR SELECT
  USING (active = true);

-- Create index for mood-based queries
CREATE INDEX idx_music_library_mood ON public.music_library(mood, active);

-- ============================================
-- 5. VIDEO_GENERATION_DETAILS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.video_generation_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,

  -- Per-clip data (array of objects with luma_prompt, clip_url, generation_id)
  clip_data JSONB DEFAULT '[]'::jsonb,

  -- Audio data
  voiceover_script TEXT,
  voiceover_url TEXT,
  music_url TEXT,
  music_source TEXT, -- auto_generated, library, custom

  -- Caption data
  caption_data JSONB, -- {zapcap_task_id, transcript, corrections_made, final_url}

  -- Settings snapshot (user settings at time of generation)
  settings_snapshot JSONB,

  -- Processing metadata
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  total_processing_time_seconds INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(video_id)
);

-- Add RLS policies for video_generation_details
ALTER TABLE public.video_generation_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video details"
  ON public.video_generation_details FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.videos
    WHERE videos.id = video_generation_details.video_id
    AND videos.user_id = auth.uid()
  ));

-- Create index for faster video lookups
CREATE INDEX idx_video_generation_details_video_id ON public.video_generation_details(video_id);

-- ============================================
-- 6. PROMPT_TEMPLATES TABLE (For admin/developer)
-- ============================================
CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- luma_video, voice_script, music_prompt
  name TEXT NOT NULL, -- e.g., "Default GPT-4o Vision Prompt"
  template_text TEXT NOT NULL, -- The actual prompt with variables
  variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names used in template
  active BOOLEAN DEFAULT false, -- Only one template per type should be active
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for prompt_templates (admin only)
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prompt templates are publicly readable"
  ON public.prompt_templates FOR SELECT
  USING (true);

-- Create index for active templates
CREATE INDEX idx_prompt_templates_type_active ON public.prompt_templates(type, active);

-- Ensure only one active template per type
CREATE UNIQUE INDEX idx_prompt_templates_type_active_unique
  ON public.prompt_templates(type)
  WHERE active = true;

-- ============================================
-- 7. UPDATE TRIGGERS FOR TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_generation_details_updated_at
  BEFORE UPDATE ON public.video_generation_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at
  BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. SEED DATA - Default Voice Presets (Google AI Studio)
-- ============================================
INSERT INTO public.voice_presets (voice_id, language_code, gender, name, description, sort_order) VALUES
  ('sr-RS-Standard-A', 'sr-RS', 'female', 'Ana (Ženski)', 'Standardni ženski glas, prirodan i prijatan za nekretninske videe', 1),
  ('sr-RS-Standard-B', 'sr-RS', 'male', 'Marko (Muški)', 'Standardni muški glas, profesionalan i autoritativan ton', 2),
  ('sr-RS-Wavenet-A', 'sr-RS', 'female', 'Jelena (Ženski Premium)', 'Visokokvalitetni ženski glas sa prirodnim naglaskom, topao i prijatan', 3),
  ('sr-RS-Wavenet-B', 'sr-RS', 'male', 'Stefan (Muški Premium)', 'Visokokvalitetni muški glas, energičan i dinamičan', 4);

-- ============================================
-- 9. SEED DATA - ZapCap Caption Templates
-- ============================================
-- Note: preview_image_url will be populated after you upload screenshots to Cloudinary
INSERT INTO public.caption_templates (name, zapcap_template_id, style_description, sort_order, preview_image_url) VALUES
  ('Bold Modern', '6255949c-4a52-4255-8a67-39ebccfaa3ef', 'Krupan tekst, moderan izgled, idealan za nekretnine', 1, NULL),
  ('Template 2', '07ffd4b8-4e1a-4ee3-8921-d58802953bcd', 'Stil 2', 2, NULL),
  ('Template 3', '14bcd077-3f98-4656-b788-1b628951c340', 'Stil 3', 3, NULL),
  ('Template 4', '1bb3b68b-6a93-453a-af07-a774b62cdab8', 'Stil 4', 4, NULL),
  ('Template 5', '21327a45-df89-46bc-8d56-34b8d29d3a0e', 'Stil 5', 5, NULL),
  ('Template 6', '46d20d67-255c-4c6a-b971-31fddcfea7f0', 'Stil 6', 6, NULL),
  ('Template 7', '50cdfac1-0a7a-48dd-af14-4d24971e213a', 'Stil 7', 7, NULL),
  ('Template 8', '55267be2-0eec-4dd6-aff8-edcb401b112e', 'Stil 8', 8, NULL),
  ('Template 9', '5de632e7-0b02-4d15-8137-e804871e861b', 'Stil 9', 9, NULL),
  ('Template 10', '7b946549-ae16-4085-9dd3-c20c82504daa', 'Stil 10', 10, NULL),
  ('Template 11', '982ad276-a76f-4d80-a4e2-b8rae0038464', 'Stil 11', 11, NULL),
  ('Template 12', 'a104df87-5b1a-4490-8cca-62e504a84615', 'Stil 12', 12, NULL),
  ('Template 13', 'a51c5222-47a7-4c37-b052-7b9853d66bf6', 'Stil 13', 13, NULL),
  ('Template 14', 'a6760d82-72c1-4190-bfdb-7d9c908732f1', 'Stil 14', 14, NULL),
  ('Template 15', 'c88bff11-7f03-4066-94cd-88f71f9ecc68', 'Stil 15', 15, NULL),
  ('Template 16', 'ca050348-e2d0-49a7-9c75-7a5e8335c67d', 'Stil 16', 16, NULL),
  ('Template 17', 'cfa6a20f-cacc-4fb6-b1d0-464a81fed6cf', 'Stil 17', 17, NULL),
  ('Template 18', 'd46bb0da-cce0-4507-909d-fa8904fb8ed7', 'Stil 18', 18, NULL),
  ('Template 19', 'decf5309-2094-4257-a646-cabe1f1ba89a', 'Stil 19', 19, NULL),
  ('Template 20', 'dfe02709-bd9d-4e55-a94f-d57ed368a060', 'Stil 20', 20, NULL),
  ('Template 21', 'e7e758de-4eb4-460f-aeca-b2801ac7f8cc', 'Stil 21', 21, NULL),
  ('Template 22', 'eb5de878-2997-41fe-858a-726e9e3712df', 'Stil 22', 22, NULL),
  ('Template 23', 'cc4b8197-2d49-4cc7-9f77-d9fbd8ef96ab', 'Stil 23', 23, NULL),
  ('Template 24', 'a5619dcb-199d-4c6d-af05-6e5d5daef601', 'Stil 24', 24, NULL),
  ('Template 25', 'e659ee0c-53bb-497e-869c-90f8ec0a921f', 'Stil 25', 25, NULL),
  ('Template 26', '1c0c9b65-47c4-41bf-a187-25a8305fd0dd', 'Stil 26', 26, NULL),
  ('Template 27', '9a2b0ed5-231b-4052-9211-5af9dc2de65e', 'Stil 27', 27, NULL),
  ('Template 28', 'd2018215-2125-41c1-940e-f13b411fff5c', 'Stil 28', 28, NULL);

-- ============================================
-- 10. GRANT PERMISSIONS
-- ============================================
GRANT ALL ON public.user_settings TO authenticated;
GRANT SELECT ON public.voice_presets TO authenticated;
GRANT SELECT ON public.caption_templates TO authenticated;
GRANT SELECT ON public.music_library TO authenticated;
GRANT ALL ON public.video_generation_details TO authenticated;
GRANT SELECT ON public.prompt_templates TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
