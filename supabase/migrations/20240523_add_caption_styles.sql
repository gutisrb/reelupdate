-- Add caption styling columns to user_settings table

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS caption_system text DEFAULT 'whisper', -- 'zapcap' or 'whisper'
ADD COLUMN IF NOT EXISTS caption_style_type text DEFAULT 'template', -- 'template' or 'custom' (only for whisper)
ADD COLUMN IF NOT EXISTS caption_font_family text DEFAULT 'Arial',
ADD COLUMN IF NOT EXISTS caption_font_size integer DEFAULT 34,
ADD COLUMN IF NOT EXISTS caption_font_color text DEFAULT 'FFFFFF',
ADD COLUMN IF NOT EXISTS caption_bg_color text DEFAULT '000000',
ADD COLUMN IF NOT EXISTS caption_bg_opacity integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS caption_font_weight text DEFAULT 'bold',
ADD COLUMN IF NOT EXISTS caption_uppercase boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS caption_stroke_color text DEFAULT '000000',
ADD COLUMN IF NOT EXISTS caption_stroke_width integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS caption_shadow_color text DEFAULT '000000',
ADD COLUMN IF NOT EXISTS caption_shadow_blur integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS caption_shadow_x integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS caption_shadow_y integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS caption_position text DEFAULT 'auto', -- 'auto', 'top', 'middle', 'bottom', 'custom'
ADD COLUMN IF NOT EXISTS caption_animation text DEFAULT 'none', -- 'none', 'pop', 'fade', 'slide_up', etc.
ADD COLUMN IF NOT EXISTS caption_max_lines integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS caption_emojis boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS caption_single_word boolean DEFAULT false;

-- Add comment to explain columns
COMMENT ON COLUMN user_settings.caption_system IS 'Which caption system to use: zapcap or whisper';
COMMENT ON COLUMN user_settings.caption_style_type IS 'Determines if using a pre-made template or custom styles (whisper only)';
COMMENT ON COLUMN user_settings.caption_position IS 'Vertical position of captions: auto, top, middle, bottom, custom';
COMMENT ON COLUMN user_settings.caption_animation IS 'Animation style for captions';
COMMENT ON COLUMN user_settings.caption_emojis IS 'Whether to include emojis in the captions';
COMMENT ON COLUMN user_settings.caption_single_word IS 'Whether to display captions one word at a time';
