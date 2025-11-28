-- Add Serbian voices without previews (previews can be added later)
-- This allows the voice selection to work immediately

-- Clear existing voices first
DELETE FROM public.voice_presets;

-- Insert Serbian voices with proper naming
INSERT INTO public.voice_presets (voice_id, language_code, gender, name, description, voice_type, sort_order, active, preview_url)
VALUES
  -- Standard voices
  ('sr-RS-Standard-A', 'sr-RS', 'female', 'Ana (ženski, Standard)', 'Standardni ženski glas, prirodan i prijatan za nekretninske videe', 'standard', 501, true, null),
  ('sr-RS-Standard-B', 'sr-RS', 'male', 'Marko (muški, Standard)', 'Standardni muški glas, profesionalan i autoritativan ton', 'standard', 502, true, null),

  -- Wavenet voices (Premium quality)
  ('sr-RS-Wavenet-A', 'sr-RS', 'female', 'Jelena (ženski, Premium)', 'Visokokvalitetni ženski glas sa prirodnim naglaskom, topao i prijatan', 'wavenet', 301, true, null),
  ('sr-RS-Wavenet-B', 'sr-RS', 'male', 'Stefan (muški, Premium)', 'Visokokvalitetni muški glas, energičan i dinamičan', 'wavenet', 302, true, null)
ON CONFLICT (voice_id) DO UPDATE SET
  name = EXCLUDED.name,
  gender = EXCLUDED.gender,
  description = EXCLUDED.description,
  voice_type = EXCLUDED.voice_type,
  sort_order = EXCLUDED.sort_order;
