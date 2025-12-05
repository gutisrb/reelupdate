-- ============================================================================
-- FIX PRODUCTION DATABASE SCRIPT (SAFE & IDEMPOTENT)
-- ============================================================================
-- This script safely applies all necessary schema changes to ensure the
-- production database matches the latest development version.
-- It is designed to be safe to run even if some parts were already applied.

-- 1. Ensure user_settings table exists
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  voice_id TEXT DEFAULT 'sr-RS-Standard-A',
  voice_language_code TEXT DEFAULT 'sr-RS',
  logo_url TEXT,
  logo_position TEXT DEFAULT 'corner_top_right',
  logo_size_percent INTEGER DEFAULT 15 CHECK (logo_size_percent BETWEEN 10 AND 25),
  caption_template_id UUID,
  caption_enabled BOOLEAN DEFAULT true,
  music_preference TEXT DEFAULT 'auto_generate',
  default_music_volume_db INTEGER DEFAULT -60 CHECK (default_music_volume_db BETWEEN -80 AND -40),
  post_description_template TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Add missing columns to user_settings (IF NOT EXISTS)
-- This fixes the "saving settings" error by ensuring all columns exist
DO $$ 
BEGIN 
    -- Add voice_style_instructions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'voice_style_instructions') THEN 
        ALTER TABLE public.user_settings ADD COLUMN voice_style_instructions TEXT DEFAULT 'UGC style voiceover with warm, confident delivery in a sophisticated professional tone, emphasizing key features naturally, in a Belgrade Serbian dialect. and fast pace'; 
    END IF;

    -- Add caption customization columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'caption_system') THEN 
        ALTER TABLE public.user_settings ADD COLUMN caption_system TEXT DEFAULT 'whisper';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'caption_style_type') THEN 
        ALTER TABLE public.user_settings ADD COLUMN caption_style_type TEXT DEFAULT 'template';
    END IF;

    -- Add other caption columns...
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

-- 3. Ensure RLS is enabled and policies exist
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them safely (avoids "policy already exists" errors)
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;

-- Recreate policies
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.user_settings TO authenticated;

-- 4. Ensure voice_presets table exists and has correct columns
CREATE TABLE IF NOT EXISTS public.voice_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_id TEXT NOT NULL UNIQUE,
  language_code TEXT NOT NULL,
  gender TEXT,
  name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  voice_type TEXT DEFAULT 'standard',
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_presets' AND column_name = 'preview_url') THEN 
        ALTER TABLE public.voice_presets ADD COLUMN preview_url TEXT; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_presets' AND column_name = 'voice_type') THEN 
        ALTER TABLE public.voice_presets ADD COLUMN voice_type TEXT DEFAULT 'standard'; 
    END IF;
END $$;

-- Enable RLS for voice_presets
ALTER TABLE public.voice_presets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Voice presets are publicly readable" ON public.voice_presets;
CREATE POLICY "Voice presets are publicly readable" ON public.voice_presets FOR SELECT USING (active = true);
GRANT SELECT ON public.voice_presets TO authenticated;

-- 5. Update Voice Data (Types, Names, Genders) - SAFE UPDATES
-- These use UPDATE, so if the data is already correct, nothing changes.
-- No new rows are inserted, preventing duplicates.

-- Deactivate old voices
UPDATE voice_presets SET active = false WHERE voice_type NOT IN ('flash', 'pro');

-- Update types
UPDATE voice_presets SET voice_type = 'flash' WHERE voice_id LIKE '%-flash';
UPDATE voice_presets SET voice_type = 'pro' WHERE voice_id LIKE '%-pro';

-- Fix Genders and Names (Corrected)
UPDATE voice_presets SET name = 'Marina', gender = 'female' WHERE voice_id IN ('Zephyr-flash', 'Zephyr-pro');
UPDATE voice_presets SET name = 'Branka', gender = 'female' WHERE voice_id IN ('Gacrux-flash', 'Gacrux-pro');
UPDATE voice_presets SET name = 'Dunja', gender = 'female' WHERE voice_id IN ('Achernar-flash', 'Achernar-pro');
UPDATE voice_presets SET name = 'Andrej', gender = 'male' WHERE voice_id IN ('Achird-flash', 'Achird-pro');
UPDATE voice_presets SET name = 'Mihajlo', gender = 'male' WHERE voice_id IN ('Sadachbia-flash', 'Sadachbia-pro');

-- 6. Update Preview URLs (Latest generated) - SAFE UPDATES
-- Only updates existing rows. If URLs are already set, this just re-confirms them.
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865207/voice_preview_Zephyr-flash_yzmk6b.wav' WHERE voice_id = 'Zephyr-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865224/voice_preview_Zephyr-pro_utkjvl.wav' WHERE voice_id = 'Zephyr-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865246/voice_preview_Puck-flash_qytlc2.wav' WHERE voice_id = 'Puck-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865264/voice_preview_Puck-pro_tpamfb.wav' WHERE voice_id = 'Puck-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865299/voice_preview_Charon-flash_rjxonb.wav' WHERE voice_id = 'Charon-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865316/voice_preview_Charon-pro_oo9ezb.wav' WHERE voice_id = 'Charon-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865332/voice_preview_Fenrir-flash_kseojo.wav' WHERE voice_id = 'Fenrir-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865349/voice_preview_Fenrir-pro_hnlppz.wav' WHERE voice_id = 'Fenrir-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865366/voice_preview_Orus-flash_trekhm.wav' WHERE voice_id = 'Orus-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865383/voice_preview_Orus-pro_otnzwq.wav' WHERE voice_id = 'Orus-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865467/voice_preview_Enceladus-flash_rt675l.wav' WHERE voice_id = 'Enceladus-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865484/voice_preview_Enceladus-pro_gqpusf.wav' WHERE voice_id = 'Enceladus-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865499/voice_preview_Iapetus-flash_tk8ptw.wav' WHERE voice_id = 'Iapetus-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865517/voice_preview_Iapetus-pro_dy7bga.wav' WHERE voice_id = 'Iapetus-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865532/voice_preview_Umbriel-flash_nlxtb1.wav' WHERE voice_id = 'Umbriel-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865550/voice_preview_Umbriel-pro_ymjbot.wav' WHERE voice_id = 'Umbriel-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865568/voice_preview_Algieba-flash_y3uztp.wav' WHERE voice_id = 'Algieba-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865600/voice_preview_Algieba-pro_v85o6a.wav' WHERE voice_id = 'Algieba-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865617/voice_preview_Algenib-flash_uj891q.wav' WHERE voice_id = 'Algenib-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865635/voice_preview_Algenib-pro_rpoipa.wav' WHERE voice_id = 'Algenib-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865651/voice_preview_Rasalgethi-flash_fr95ts.wav' WHERE voice_id = 'Rasalgethi-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865669/voice_preview_Rasalgethi-pro_jhbtha.wav' WHERE voice_id = 'Rasalgethi-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865685/voice_preview_Achernar-flash_s9njnl.wav' WHERE voice_id = 'Achernar-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865921/voice_preview_Achernar-pro_fha2jh.wav' WHERE voice_id = 'Achernar-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764865937/voice_preview_Alnilam-flash_gagbft.wav' WHERE voice_id = 'Alnilam-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866008/voice_preview_Alnilam-pro_spmc4a.wav' WHERE voice_id = 'Alnilam-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866023/voice_preview_Schedar-flash_ekxbsy.wav' WHERE voice_id = 'Schedar-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866039/voice_preview_Schedar-pro_huzvmj.wav' WHERE voice_id = 'Schedar-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866055/voice_preview_Gacrux-flash_dmjmnz.wav' WHERE voice_id = 'Gacrux-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866123/voice_preview_Gacrux-pro_go9yks.wav' WHERE voice_id = 'Gacrux-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866149/voice_preview_Zubenelgenubi-flash_fcf812.wav' WHERE voice_id = 'Zubenelgenubi-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866166/voice_preview_Zubenelgenubi-pro_y1idch.wav' WHERE voice_id = 'Zubenelgenubi-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866231/voice_preview_Sadaltager-flash_yk7fvy.wav' WHERE voice_id = 'Sadaltager-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866249/voice_preview_Sadaltager-pro_pgie7p.wav' WHERE voice_id = 'Sadaltager-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866305/voice_preview_Kore-flash_k4kapf.wav' WHERE voice_id = 'Kore-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866331/voice_preview_Kore-pro_xek1sy.wav' WHERE voice_id = 'Kore-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866348/voice_preview_Leda-flash_knicgf.wav' WHERE voice_id = 'Leda-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866366/voice_preview_Leda-pro_s2x5ny.wav' WHERE voice_id = 'Leda-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866382/voice_preview_Aoede-flash_qtlkxm.wav' WHERE voice_id = 'Aoede-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866399/voice_preview_Aoede-pro_wpe2lw.wav' WHERE voice_id = 'Aoede-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866415/voice_preview_Callirrhoe-flash_tb0g1n.wav' WHERE voice_id = 'Callirrhoe-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866440/voice_preview_Callirrhoe-pro_osu8hk.wav' WHERE voice_id = 'Callirrhoe-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866456/voice_preview_Autonoe-flash_appmer.wav' WHERE voice_id = 'Autonoe-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866474/voice_preview_Autonoe-pro_nphrav.wav' WHERE voice_id = 'Autonoe-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866489/voice_preview_Despina-flash_dcmcv8.wav' WHERE voice_id = 'Despina-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866506/voice_preview_Despina-pro_rpst5f.wav' WHERE voice_id = 'Despina-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866522/voice_preview_Erinome-flash_zwkjgm.wav' WHERE voice_id = 'Erinome-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866538/voice_preview_Erinome-pro_debsjr.wav' WHERE voice_id = 'Erinome-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866593/voice_preview_Laomedeia-flash_zoskto.wav' WHERE voice_id = 'Laomedeia-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866726/voice_preview_Laomedeia-pro_mdoeow.wav' WHERE voice_id = 'Laomedeia-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866741/voice_preview_Pulcherrima-flash_zojfwv.wav' WHERE voice_id = 'Pulcherrima-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866777/voice_preview_Pulcherrima-pro_iuwf32.wav' WHERE voice_id = 'Pulcherrima-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866829/voice_preview_Achird-flash_wvz2h4.wav' WHERE voice_id = 'Achird-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866852/voice_preview_Achird-pro_xxst9x.wav' WHERE voice_id = 'Achird-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866903/voice_preview_Vindemiatrix-flash_qmo1gf.wav' WHERE voice_id = 'Vindemiatrix-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866922/voice_preview_Vindemiatrix-pro_anm1ay.wav' WHERE voice_id = 'Vindemiatrix-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866937/voice_preview_Sadachbia-flash_hqx3em.wav' WHERE voice_id = 'Sadachbia-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866954/voice_preview_Sadachbia-pro_acumn6.wav' WHERE voice_id = 'Sadachbia-pro';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866971/voice_preview_Sulafat-flash_ycvgbp.wav' WHERE voice_id = 'Sulafat-flash';
UPDATE voice_presets SET preview_url = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1764866988/voice_preview_Sulafat-pro_giqpv5.wav' WHERE voice_id = 'Sulafat-pro';
