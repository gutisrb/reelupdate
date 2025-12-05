-- Fix gender and name mismatches for specific voices

-- 1. Zephyr (was Marko/Male -> now Marina/Female)
UPDATE voice_presets SET name = 'Marina', gender = 'female' WHERE voice_id IN ('Zephyr-flash', 'Zephyr-pro');

-- 2. Gacrux (was Branko/Male -> now Branka/Female)
UPDATE voice_presets SET name = 'Branka', gender = 'female' WHERE voice_id IN ('Gacrux-flash', 'Gacrux-pro');

-- 3. Achernar (was Dušan/Male -> now Dunja/Female)
UPDATE voice_presets SET name = 'Dunja', gender = 'female' WHERE voice_id IN ('Achernar-flash', 'Achernar-pro');

-- 4. Achird (was Aleksandra/Female -> now Andrej/Male)
UPDATE voice_presets SET name = 'Andrej', gender = 'male' WHERE voice_id IN ('Achird-flash', 'Achird-pro');

-- 5. Sadachbia (was Maja/Female -> now Mihajlo/Male)
UPDATE voice_presets SET name = 'Mihajlo', gender = 'male' WHERE voice_id IN ('Sadachbia-flash', 'Sadachbia-pro');
