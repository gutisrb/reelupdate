-- Add voice style instructions column to user_settings
-- This allows users to customize the delivery style, tone, pace, and accent of Gemini TTS voices

ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS voice_style_instructions TEXT 
DEFAULT 'UGC style voiceover with warm, confident delivery in a sophisticated professional tone, emphasizing key features naturally, in a Belgrade Serbian dialect. and fast pace';

-- Add comment for documentation
COMMENT ON COLUMN public.user_settings.voice_style_instructions IS 'Natural language instructions for Gemini TTS voice styling (tone, pace, accent, delivery style)';
