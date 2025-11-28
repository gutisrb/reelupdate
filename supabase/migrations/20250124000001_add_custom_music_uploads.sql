-- Migration: Add custom music uploads support
-- Date: 2025-01-24
-- Purpose: Allow users to upload their own background music for videos

-- ============================================
-- 1. CUSTOM_MUSIC_UPLOADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.custom_music_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- File information
  filename TEXT NOT NULL,
  cloudinary_url TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,

  -- Audio metadata
  duration_seconds INTEGER NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  format TEXT NOT NULL, -- mp3, wav, m4a, etc.

  -- User-provided info
  title TEXT, -- Optional: user can name their track

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate uploads
  UNIQUE(user_id, cloudinary_public_id)
);

-- Add RLS policies for custom_music_uploads
ALTER TABLE public.custom_music_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own music uploads"
  ON public.custom_music_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own music uploads"
  ON public.custom_music_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own music uploads"
  ON public.custom_music_uploads FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_custom_music_uploads_user_id ON public.custom_music_uploads(user_id);

-- ============================================
-- 2. UPDATE USER_SETTINGS TABLE
-- ============================================
-- Add field to store selected custom music ID
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS selected_custom_music_id UUID REFERENCES public.custom_music_uploads(id) ON DELETE SET NULL;

-- Add field to track if user accepted music license terms
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS music_license_accepted BOOLEAN DEFAULT false;

-- Add field to track when license was accepted
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS music_license_accepted_at TIMESTAMPTZ;

-- ============================================
-- 3. GRANT PERMISSIONS
-- ============================================
GRANT ALL ON public.custom_music_uploads TO authenticated;

-- ============================================
-- 4. HELPER FUNCTION: Get user's custom music or default
-- ============================================
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

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
