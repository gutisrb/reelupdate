-- Add basic Serbian voices to voice_presets table
INSERT INTO public.voice_presets (voice_id, language_code, gender, name, description, voice_type, sort_order, active)
VALUES
  ('sr-RS-Standard-A', 'sr-RS', 'female', 'Ana (Ženski)', 'Standardni ženski glas, prirodan i prijatan za nekretninske videe', 'standard', 1, true),
  ('sr-RS-Standard-B', 'sr-RS', 'male', 'Marko (Muški)', 'Standardni muški glas, profesionalan i autoritativan ton', 'standard', 2, true),
  ('sr-RS-Wavenet-A', 'sr-RS', 'female', 'Jelena (Ženski Premium)', 'Visokokvalitetni ženski glas sa prirodnim naglaskom, topao i prijatan', 'wavenet', 3, true),
  ('sr-RS-Wavenet-B', 'sr-RS', 'male', 'Stefan (Muški Premium)', 'Visokokvalitetni muški glas, energičan i dinamičan', 'wavenet', 4, true)
ON CONFLICT (voice_id) DO NOTHING;
