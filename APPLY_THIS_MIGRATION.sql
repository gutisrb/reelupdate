-- Disable all existing voices
UPDATE voice_presets SET active = false WHERE active = true;

-- Insert new Gemini voices with Serbian names
INSERT INTO voice_presets (voice_id, name, gender, description, voice_type, language_code, active, sort_order, preview_url) VALUES
-- Male voices - Flash
('Zephyr-flash', 'Marko (Flash)', 'male', 'Svetao i jasan ton', 'gemini-flash', 'sr-RS', true, 10, NULL),
('Puck-flash', 'Stefan (Flash)', 'male', 'Optimističan i energičan', 'gemini-flash', 'sr-RS', true, 30, NULL),
('Charon-flash', 'Nikola (Flash)', 'male', 'Dubok i informativan', 'gemini-flash', 'sr-RS', true, 50, NULL),
('Fenrir-flash', 'Aleksandar (Flash)', 'male', 'Uzbudljiv i dinamičan', 'gemini-flash', 'sr-RS', true, 90, NULL),
('Orus-flash', 'Luka (Flash)', 'male', 'Čvrst i autoritativan', 'gemini-flash', 'sr-RS', true, 130, NULL),
('Enceladus-flash', 'Dimitrije (Flash)', 'male', 'Disajući i mekan', 'gemini-flash', 'sr-RS', true, 210, NULL),
('Iapetus-flash', 'Miloš (Flash)', 'male', 'Jasan i razgovetan', 'gemini-flash', 'sr-RS', true, 230, NULL),
('Umbriel-flash', 'Nemanja (Flash)', 'male', 'Opušten i miran', 'gemini-flash', 'sr-RS', true, 250, NULL),
('Algieba-flash', 'Petar (Flash)', 'male', 'Gladak i uglađen', 'gemini-flash', 'sr-RS', true, 270, NULL),
('Algenib-flash', 'Đorđe (Flash)', 'male', 'Hrapav i teksturiran', 'gemini-flash', 'sr-RS', true, 330, NULL),
('Rasalgethi-flash', 'Vladimir (Flash)', 'male', 'Informativan i stručan', 'gemini-flash', 'sr-RS', true, 350, NULL),
('Achernar-flash', 'Dušan (Flash)', 'male', 'Mekan i nežan', 'gemini-flash', 'sr-RS', true, 390, NULL),
('Alnilam-flash', 'Jovan (Flash)', 'male', 'Čvrst i siguran', 'gemini-flash', 'sr-RS', true, 410, NULL),
('Schedar-flash', 'Milan (Flash)', 'male', 'Uravnotežen i stabilan', 'gemini-flash', 'sr-RS', true, 430, NULL),
('Gacrux-flash', 'Branko (Flash)', 'male', 'Zreo i etabliran', 'gemini-flash', 'sr-RS', true, 450, NULL),
('Zubenelgenubi-flash', 'Srđan (Flash)', 'male', 'Ležeran i opušten', 'gemini-flash', 'sr-RS', true, 510, NULL),
('Sadaltager-flash', 'Dejan (Flash)', 'male', 'Znalački i ekspertski', 'gemini-flash', 'sr-RS', true, 570, NULL),

-- Male voices - Pro
('Zephyr-pro', 'Marko (Pro)', 'male', 'Svetao i jasan ton', 'gemini-pro', 'sr-RS', true, 20, NULL),
('Puck-pro', 'Stefan (Pro)', 'male', 'Optimističan i energičan', 'gemini-pro', 'sr-RS', true, 40, NULL),
('Charon-pro', 'Nikola (Pro)', 'male', 'Dubok i informativan', 'gemini-pro', 'sr-RS', true, 60, NULL),
('Fenrir-pro', 'Aleksandar (Pro)', 'male', 'Uzbudljiv i dinamičan', 'gemini-pro', 'sr-RS', true, 100, NULL),
('Orus-pro', 'Luka (Pro)', 'male', 'Čvrst i autoritativan', 'gemini-pro', 'sr-RS', true, 140, NULL),
('Enceladus-pro', 'Dimitrije (Pro)', 'male', 'Disajući i mekan', 'gemini-pro', 'sr-RS', true, 220, NULL),
('Iapetus-pro', 'Miloš (Pro)', 'male', 'Jasan i razgovetan', 'gemini-pro', 'sr-RS', true, 240, NULL),
('Umbriel-pro', 'Nemanja (Pro)', 'male', 'Opušten i miran', 'gemini-pro', 'sr-RS', true, 260, NULL),
('Algieba-pro', 'Petar (Pro)', 'male', 'Gladak i uglađen', 'gemini-pro', 'sr-RS', true, 280, NULL),
('Algenib-pro', 'Đorđe (Pro)', 'male', 'Hrapav i teksturiran', 'gemini-pro', 'sr-RS', true, 340, NULL),
('Rasalgethi-pro', 'Vladimir (Pro)', 'male', 'Informativan i stručan', 'gemini-pro', 'sr-RS', true, 360, NULL),
('Achernar-pro', 'Dušan (Pro)', 'male', 'Mekan i nežan', 'gemini-pro', 'sr-RS', true, 400, NULL),
('Alnilam-pro', 'Jovan (Pro)', 'male', 'Čvrst i siguran', 'gemini-pro', 'sr-RS', true, 420, NULL),
('Schedar-pro', 'Milan (Pro)', 'male', 'Uravnotežen i stabilan', 'gemini-pro', 'sr-RS', true, 440, NULL),
('Gacrux-pro', 'Branko (Pro)', 'male', 'Zreo i etabliran', 'gemini-pro', 'sr-RS', true, 460, NULL),
('Zubenelgenubi-pro', 'Srđan (Pro)', 'male', 'Ležeran i opušten', 'gemini-pro', 'sr-RS', true, 520, NULL),
('Sadaltager-pro', 'Dejan (Pro)', 'male', 'Znalački i ekspertski', 'gemini-pro', 'sr-RS', true, 580, NULL),

-- Female voices - Flash
('Kore-flash', 'Ana (Flash)', 'female', 'Čvrsta i profesionalna', 'gemini-flash', 'sr-RS', true, 70, NULL),
('Leda-flash', 'Jelena (Flash)', 'female', 'Mladalačka i svežа', 'gemini-flash', 'sr-RS', true, 110, NULL),
('Aoede-flash', 'Milica (Flash)', 'female', 'Lagana i prozračna', 'gemini-flash', 'sr-RS', true, 150, NULL),
('Callirrhoe-flash', 'Jovana (Flash)', 'female', 'Opuštena i prijatna', 'gemini-flash', 'sr-RS', true, 170, NULL),
('Autonoe-flash', 'Marija (Flash)', 'female', 'Svetla i privlačna', 'gemini-flash', 'sr-RS', true, 190, NULL),
('Despina-flash', 'Katarina (Flash)', 'female', 'Glatka i elegantna', 'gemini-flash', 'sr-RS', true, 290, NULL),
('Erinome-flash', 'Teodora (Flash)', 'female', 'Jasna i artikulisana', 'gemini-flash', 'sr-RS', true, 310, NULL),
('Laomedeia-flash', 'Sofija (Flash)', 'female', 'Optimistična i vesela', 'gemini-flash', 'sr-RS', true, 370, NULL),
('Pulcherrima-flash', 'Ivana (Flash)', 'female', 'Direktna i otvorena', 'gemini-flash', 'sr-RS', true, 470, NULL),
('Achird-flash', 'Aleksandra (Flash)', 'female', 'Prijateljska i topla', 'gemini-flash', 'sr-RS', true, 490, NULL),
('Vindemiatrix-flash', 'Tijana (Flash)', 'female', 'Nežna i ljubazna', 'gemini-flash', 'sr-RS', true, 530, NULL),
('Sadachbia-flash', 'Maja (Flash)', 'female', 'Živahna i animirana', 'gemini-flash', 'sr-RS', true, 550, NULL),
('Sulafat-flash', 'Nina (Flash)', 'female', 'Topla i privlačna', 'gemini-flash', 'sr-RS', true, 590, NULL),

-- Female voices - Pro
('Kore-pro', 'Ana (Pro)', 'female', 'Čvrsta i profesionalna', 'gemini-pro', 'sr-RS', true, 80, NULL),
('Leda-pro', 'Jelena (Pro)', 'female', 'Mladalačka i svežа', 'gemini-pro', 'sr-RS', true, 120, NULL),
('Aoede-pro', 'Milica (Pro)', 'female', 'Lagana i prozračna', 'gemini-pro', 'sr-RS', true, 160, NULL),
('Callirrhoe-pro', 'Jovana (Pro)', 'female', 'Opuštena i prijatna', 'gemini-pro', 'sr-RS', true, 180, NULL),
('Autonoe-pro', 'Marija (Pro)', 'female', 'Svetla i privlačna', 'gemini-pro', 'sr-RS', true, 200, NULL),
('Despina-pro', 'Katarina (Pro)', 'female', 'Glatka i elegantna', 'gemini-pro', 'sr-RS', true, 300, NULL),
('Erinome-pro', 'Teodora (Pro)', 'female', 'Jasna i artikulisana', 'gemini-pro', 'sr-RS', true, 320, NULL),
('Laomedeia-pro', 'Sofija (Pro)', 'female', 'Optimistična i vesela', 'gemini-pro', 'sr-RS', true, 380, NULL),
('Pulcherrima-pro', 'Ivana (Pro)', 'female', 'Direktna i otvorena', 'gemini-pro', 'sr-RS', true, 480, NULL),
('Achird-pro', 'Aleksandra (Pro)', 'female', 'Prijateljska i topla', 'gemini-pro', 'sr-RS', true, 500, NULL),
('Vindemiatrix-pro', 'Tijana (Pro)', 'female', 'Nežna i ljubazna', 'gemini-pro', 'sr-RS', true, 540, NULL),
('Sadachbia-pro', 'Maja (Pro)', 'female', 'Živahna i animirana', 'gemini-pro', 'sr-RS', true, 560, NULL),
('Sulafat-pro', 'Nina (Pro)', 'female', 'Topla i privlačna', 'gemini-pro', 'sr-RS', true, 600, NULL);
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
