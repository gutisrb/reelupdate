-- Update voice types to simplified names
UPDATE voice_presets SET voice_type = 'flash' WHERE voice_type = 'gemini-flash';
UPDATE voice_presets SET voice_type = 'pro' WHERE voice_type = 'gemini-pro';

-- Deactivate all old voice types (non-Gemini voices)
UPDATE voice_presets SET active = false 
WHERE voice_type NOT IN ('flash', 'pro');

-- Consolidate voices: Keep only base voice names (remove -flash/-pro suffix from voice_id)
-- We'll handle model selection in the UI instead of having duplicate entries

-- For now, keep both flash and pro entries but we'll modify the UI to group them
-- This allows users to switch between models for the same voice
