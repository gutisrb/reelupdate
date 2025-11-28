-- Migration: Update user customization tables (safe version)
-- Date: 2025-01-24
-- Purpose: Add missing columns and tables without conflicts

-- ============================================
-- 1. UPDATE USER_SETTINGS TABLE (add new columns if they don't exist)
-- ============================================

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

    COMMENT ON COLUMN public.voice_presets.voice_type IS 'Voice type: standard, wavenet, neural2, studio, journey';
  END IF;
END $$;

-- Add selected_custom_music_id to user_settings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings'
    AND column_name = 'selected_custom_music_id'
  ) THEN
    ALTER TABLE public.user_settings
    ADD COLUMN selected_custom_music_id UUID;

    COMMENT ON COLUMN public.user_settings.selected_custom_music_id IS 'FK to custom_music_uploads table';
  END IF;
END $$;

-- Add music_license_accepted to user_settings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings'
    AND column_name = 'music_license_accepted'
  ) THEN
    ALTER TABLE public.user_settings
    ADD COLUMN music_license_accepted BOOLEAN DEFAULT false;

    COMMENT ON COLUMN public.user_settings.music_license_accepted IS 'Has user accepted music licensing terms';
  END IF;
END $$;

-- Add music_license_accepted_at to user_settings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings'
    AND column_name = 'music_license_accepted_at'
  ) THEN
    ALTER TABLE public.user_settings
    ADD COLUMN music_license_accepted_at TIMESTAMPTZ;

    COMMENT ON COLUMN public.user_settings.music_license_accepted_at IS 'When user accepted music licensing terms';
  END IF;
END $$;

-- Update music_preference column to support 'custom' option
DO $$
BEGIN
  -- Drop the constraint if it exists and recreate it
  ALTER TABLE public.user_settings
  DROP CONSTRAINT IF EXISTS user_settings_music_preference_check;

  -- No constraint needed - TEXT column accepts any value
  -- Application layer will validate: 'auto_generate' | 'library_pick' | 'custom'
END $$;

-- ============================================
-- 2. CREATE CUSTOM_MUSIC_UPLOADS TABLE (if not exists)
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
  format TEXT NOT NULL,

  -- User-provided info
  title TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate uploads
  UNIQUE(user_id, cloudinary_public_id)
);

-- Add RLS policies for custom_music_uploads (only if table was just created)
DO $$
BEGIN
  -- Enable RLS
  ALTER TABLE public.custom_music_uploads ENABLE ROW LEVEL SECURITY;

  -- Create policies only if they don't exist
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_music_uploads_user_id
  ON public.custom_music_uploads(user_id);

-- ============================================
-- 3. ADD FOREIGN KEY CONSTRAINT (if not exists)
-- ============================================
DO $$
BEGIN
  -- Add FK constraint from user_settings to custom_music_uploads
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

-- ============================================
-- 4. CREATE HELPER FUNCTION (replace if exists)
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
-- 5. GRANT PERMISSIONS
-- ============================================
GRANT ALL ON public.custom_music_uploads TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- This migration safely adds:
-- - voice_type column to voice_presets
-- - selected_custom_music_id, music_license_accepted, music_license_accepted_at to user_settings
-- - custom_music_uploads table with RLS policies
-- - Foreign key constraint
-- - Helper function for music preferences
