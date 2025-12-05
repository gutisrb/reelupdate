-- ============================================================================
-- MINIMAL FIX SCRIPT: ADD MISSING COLUMNS ONLY
-- ============================================================================
-- Run this to add the new columns required for saving settings.

-- 1. Add 'voice_style_instructions' to user_settings
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'voice_style_instructions') THEN 
        ALTER TABLE public.user_settings ADD COLUMN voice_style_instructions TEXT DEFAULT 'UGC style voiceover with warm, confident delivery in a sophisticated professional tone, emphasizing key features naturally, in a Belgrade Serbian dialect. and fast pace'; 
    END IF;
END $$;

-- 2. Add Caption Settings Columns
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'caption_system') THEN 
        ALTER TABLE public.user_settings ADD COLUMN caption_system TEXT DEFAULT 'whisper';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'caption_style_type') THEN 
        ALTER TABLE public.user_settings ADD COLUMN caption_style_type TEXT DEFAULT 'template';
    END IF;

    -- Custom caption styling columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'caption_font_family') THEN 
        ALTER TABLE public.user_settings ADD COLUMN caption_font_family TEXT DEFAULT 'Arial';
        ALTER TABLE public.user_settings ADD COLUMN caption_font_size INTEGER DEFAULT 34;
        ALTER TABLE public.user_settings ADD COLUMN caption_font_color TEXT DEFAULT 'FFFFFF';
        ALTER TABLE public.user_settings ADD COLUMN caption_bg_color TEXT DEFAULT '000000';
        ALTER TABLE public.user_settings ADD COLUMN caption_bg_opacity INTEGER DEFAULT 100;
        ALTER TABLE public.user_settings ADD COLUMN caption_font_weight TEXT DEFAULT 'bold';
        ALTER TABLE public.user_settings ADD COLUMN caption_uppercase BOOLEAN DEFAULT false;
        ALTER TABLE public.user_settings ADD COLUMN caption_stroke_color TEXT DEFAULT '000000';
        ALTER TABLE public.user_settings ADD COLUMN caption_stroke_width INTEGER DEFAULT 0;
        ALTER TABLE public.user_settings ADD COLUMN caption_shadow_color TEXT DEFAULT '000000';
        ALTER TABLE public.user_settings ADD COLUMN caption_shadow_blur INTEGER DEFAULT 0;
        ALTER TABLE public.user_settings ADD COLUMN caption_shadow_x INTEGER DEFAULT 2;
        ALTER TABLE public.user_settings ADD COLUMN caption_shadow_y INTEGER DEFAULT 2;
        ALTER TABLE public.user_settings ADD COLUMN caption_position TEXT DEFAULT 'auto';
        ALTER TABLE public.user_settings ADD COLUMN caption_animation TEXT DEFAULT 'none';
        ALTER TABLE public.user_settings ADD COLUMN caption_max_lines INTEGER DEFAULT 2;
        ALTER TABLE public.user_settings ADD COLUMN caption_emojis BOOLEAN DEFAULT false;
        ALTER TABLE public.user_settings ADD COLUMN caption_single_word BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. Refresh RLS Policies (Just to be safe)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;

CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

GRANT ALL ON public.user_settings TO authenticated;
