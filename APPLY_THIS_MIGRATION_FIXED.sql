-- ============================================
-- Update existing Gemini voices with Serbian names and correct types
-- ============================================

-- First, update voice types from 'gemini-flash' to 'flash' and 'gemini-pro' to 'pro'
UPDATE voice_presets SET voice_type = 'flash' WHERE voice_type = 'gemini-flash';
UPDATE voice_presets SET voice_type = 'pro' WHERE voice_type = 'gemini-pro';

-- Deactivate all old voice types (non-Gemini voices)
UPDATE voice_presets SET active = false WHERE voice_type NOT IN ('flash', 'pro');

-- Now update the names to Serbian names (removing the (Flash)/(Pro) suffix since we'll show that in UI)
UPDATE voice_presets SET name = 'Marko' WHERE voice_id = 'Zephyr-flash';
UPDATE voice_presets SET name = 'Marko' WHERE voice_id = 'Zephyr-pro';
UPDATE voice_presets SET name = 'Stefan' WHERE voice_id = 'Puck-flash';
UPDATE voice_presets SET name = 'Stefan' WHERE voice_id = 'Puck-pro';
UPDATE voice_presets SET name = 'Nikola' WHERE voice_id = 'Charon-flash';
UPDATE voice_presets SET name = 'Nikola' WHERE voice_id = 'Charon-pro';
UPDATE voice_presets SET name = 'Aleksandar' WHERE voice_id = 'Fenrir-flash';
UPDATE voice_presets SET name = 'Aleksandar' WHERE voice_id = 'Fenrir-pro';
UPDATE voice_presets SET name = 'Luka' WHERE voice_id = 'Orus-flash';
UPDATE voice_presets SET name = 'Luka' WHERE voice_id = 'Orus-pro';
UPDATE voice_presets SET name = 'Dimitrije' WHERE voice_id = 'Enceladus-flash';
UPDATE voice_presets SET name = 'Dimitrije' WHERE voice_id = 'Enceladus-pro';
UPDATE voice_presets SET name = 'Miloš' WHERE voice_id = 'Iapetus-flash';
UPDATE voice_presets SET name = 'Miloš' WHERE voice_id = 'Iapetus-pro';
UPDATE voice_presets SET name = 'Nemanja' WHERE voice_id = 'Umbriel-flash';
UPDATE voice_presets SET name = 'Nemanja' WHERE voice_id = 'Umbriel-pro';
UPDATE voice_presets SET name = 'Petar' WHERE voice_id = 'Algieba-flash';
UPDATE voice_presets SET name = 'Petar' WHERE voice_id = 'Algieba-pro';
UPDATE voice_presets SET name = 'Đorđe' WHERE voice_id = 'Algenib-flash';
UPDATE voice_presets SET name = 'Đorđe' WHERE voice_id = 'Algenib-pro';
UPDATE voice_presets SET name = 'Vladimir' WHERE voice_id = 'Rasalgethi-flash';
UPDATE voice_presets SET name = 'Vladimir' WHERE voice_id = 'Rasalgethi-pro';
UPDATE voice_presets SET name = 'Dušan' WHERE voice_id = 'Achernar-flash';
UPDATE voice_presets SET name = 'Dušan' WHERE voice_id = 'Achernar-pro';
UPDATE voice_presets SET name = 'Jovan' WHERE voice_id = 'Alnilam-flash';
UPDATE voice_presets SET name = 'Jovan' WHERE voice_id = 'Alnilam-pro';
UPDATE voice_presets SET name = 'Milan' WHERE voice_id = 'Schedar-flash';
UPDATE voice_presets SET name = 'Milan' WHERE voice_id = 'Schedar-pro';
UPDATE voice_presets SET name = 'Branko' WHERE voice_id = 'Gacrux-flash';
UPDATE voice_presets SET name = 'Branko' WHERE voice_id = 'Gacrux-pro';
UPDATE voice_presets SET name = 'Srđan' WHERE voice_id = 'Zubenelgenubi-flash';
UPDATE voice_presets SET name = 'Srđan' WHERE voice_id = 'Zubenelgenubi-pro';
UPDATE voice_presets SET name = 'Dejan' WHERE voice_id = 'Sadaltager-flash';
UPDATE voice_presets SET name = 'Dejan' WHERE voice_id = 'Sadaltager-pro';

-- Female voices
UPDATE voice_presets SET name = 'Ana' WHERE voice_id = 'Kore-flash';
UPDATE voice_presets SET name = 'Ana' WHERE voice_id = 'Kore-pro';
UPDATE voice_presets SET name = 'Jelena' WHERE voice_id = 'Leda-flash';
UPDATE voice_presets SET name = 'Jelena' WHERE voice_id = 'Leda-pro';
UPDATE voice_presets SET name = 'Milica' WHERE voice_id = 'Aoede-flash';
UPDATE voice_presets SET name = 'Milica' WHERE voice_id = 'Aoede-pro';
UPDATE voice_presets SET name = 'Jovana' WHERE voice_id = 'Callirrhoe-flash';
UPDATE voice_presets SET name = 'Jovana' WHERE voice_id = 'Callirrhoe-pro';
UPDATE voice_presets SET name = 'Marija' WHERE voice_id = 'Autonoe-flash';
UPDATE voice_presets SET name = 'Marija' WHERE voice_id = 'Autonoe-pro';
UPDATE voice_presets SET name = 'Katarina' WHERE voice_id = 'Despina-flash';
UPDATE voice_presets SET name = 'Katarina' WHERE voice_id = 'Despina-pro';
UPDATE voice_presets SET name = 'Teodora' WHERE voice_id = 'Erinome-flash';
UPDATE voice_presets SET name = 'Teodora' WHERE voice_id = 'Erinome-pro';
UPDATE voice_presets SET name = 'Sofija' WHERE voice_id = 'Laomedeia-flash';
UPDATE voice_presets SET name = 'Sofija' WHERE voice_id = 'Laomedeia-pro';
UPDATE voice_presets SET name = 'Ivana' WHERE voice_id = 'Pulcherrima-flash';
UPDATE voice_presets SET name = 'Ivana' WHERE voice_id = 'Pulcherrima-pro';
UPDATE voice_presets SET name = 'Aleksandra' WHERE voice_id = 'Achird-flash';
UPDATE voice_presets SET name = 'Aleksandra' WHERE voice_id = 'Achird-pro';
UPDATE voice_presets SET name = 'Tijana' WHERE voice_id = 'Vindemiatrix-flash';
UPDATE voice_presets SET name = 'Tijana' WHERE voice_id = 'Vindemiatrix-pro';
UPDATE voice_presets SET name = 'Maja' WHERE voice_id = 'Sadachbia-flash';
UPDATE voice_presets SET name = 'Maja' WHERE voice_id = 'Sadachbia-pro';
UPDATE voice_presets SET name = 'Nina' WHERE voice_id = 'Sulafat-flash';
UPDATE voice_presets SET name = 'Nina' WHERE voice_id = 'Sulafat-pro';
