-- Create caption_templates table for ZapCap template management

CREATE TABLE IF NOT EXISTS public.caption_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  zapcap_template_id TEXT NOT NULL UNIQUE,
  preview_image_url TEXT,
  style_description TEXT,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_caption_templates_active
  ON public.caption_templates(active, sort_order);

-- Enable RLS
ALTER TABLE public.caption_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read caption templates
CREATE POLICY "Anyone can view active caption templates"
  ON public.caption_templates FOR SELECT
  USING (active = true);

-- Grant permissions
GRANT SELECT ON public.caption_templates TO authenticated;

-- Insert initial templates based on ZapCap screenshot IDs
-- These are the template IDs visible in the screenshots
INSERT INTO public.caption_templates (zapcap_template_id, name, style_description, sort_order)
VALUES
  -- Row 1
  ('07ffd4b8-4e1a-4ee3-8921-d58802953bcd', 'Bold Red "ADD CAPTIONS"', 'Crveni bold tekst sa "ADD CAPTIONS" natpisom', 1),
  ('14bcd077-3f98-465b-b788-1b628951c340', 'Simple "ADD CAPTIONS"', 'Običan tekst sa "ADD CAPTIONS"', 2),
  ('1bb3b68b-6a93-453a-afd7-a774b62cdab8', 'White Block "ADD CAPTIONS"', 'Beli blok tekst sa ADD CAPTIONS', 3),
  ('21327a45-df89-46bc-8d56-34b8d29d3a0e', 'Red Outline "ADD CAPTIONS"', 'Crveni obrub tekst', 4),
  ('46d20d67-255c-4c6a-b971-31fddc fea7f0', 'Yellow Neon "VIDEOS"', 'Žuti neon stil sa VIDEOS', 5),

  -- Row 2
  ('50cdfac1-0a7a-48dd-af14-4d24971e213a', 'Orange "CAPTIONS"', 'Narandžasti CAPTIONS tekst', 6),
  ('55267be2-9eec-4d06-aff8-edc40161i2e', 'Yellow Bold "VIDEOS"', 'Žuti bold VIDEOS tekst', 7),
  ('5de632e7-0b02-4d15-8137-e004871e861b', 'Yellow Block', 'Žuti blok stil', 8),
  ('7b946549-ae16-4085-9dd3-c20c8250 4daa', 'Outlined "VIDEOS"', 'Konturisani VIDEOS tekst', 9),
  ('982ad276-a76f-4d80-a4e2-b8fae0038464', 'Simple Block', 'Običan blok', 10),

  -- Row 3
  ('a104df87-5b1a-4490-8cca-62e504a84615', 'Orange Block + Emoji', 'Narandžasti blok sa emoji', 11),
  ('a51c5222-47a7-4c37-b052-7b9853d66bf6', 'Document + Text', 'Dokument sa tekstom', 12),
  ('a6700d82-72c1-4190-bfdb-7d9c900732f1', 'Hammer + Captions', 'Čekić emoji sa tekstom', 13),
  ('c88bff11-7f03-4066-94cd-88f71f9ecc68', 'Chat Bubble', 'Oblačić za chat', 14),
  ('ca050348-e2d0-49a7-9c75-7a5e8335c67d', 'Pencil + Yellow', 'Olovka sa žutim tekstom', 15),

  -- Row 4
  ('cfa6a20f-cacc-4fb6-b1d0-464a81fed6cf', 'Burger Emoji', 'Burger emoji sa tekstom', 16),
  ('d46bb0da-cce0-4507-909d-fa88047b8ed7', 'Document Green', 'Zeleni dokument stil', 17),
  ('decf5309-2094-4257-a646-cabe1f1ba89a', 'Burger Yellow', 'Žuti burger stil', 18),
  ('dfe027d9-bd9d-4e55-a94f-d57ed368a060', 'Simple Outline', 'Običan obrub', 19),
  ('e7e758de-4eb4-460f-aeca-b2801ac7f8cc', 'Yellow Bold 2', 'Žuti bold verzija 2', 20),

  -- Row 5
  ('eb5de878-2997-41fe-858a-72e6e9e37126f', 'Simple Clean', 'Čist jednostavan stil', 21),
  ('cc4b8197-2d49-4cc7-9f77-d9fbd8ef96ab', 'Basic White', 'Osnovni beli tekst', 22),
  ('6255949c-4a52-4255-8a67-39ebccfaa3ef', 'Default Style', 'Podrazumevani stil (default)', 23),
  ('a5619dcb-199d-4c6d-af05-6e5d5d6aef601', 'Minimal Style', 'Minimalistički stil', 24),
  ('e659ee0c-53bb-497e-869c-9078ec0a921f', 'Modern Clean', 'Moderni čist stil', 25),

  -- Row 6
  ('1c0c9b65-47c4-41bf-a187-25a83057dd0d', 'Simple "To"', 'Jednostavno "To"', 26),
  ('9a2b0ed5-231b-4032-9211-5af9dc2de65e', 'Yellow Small', 'Žuti mali tekst', 27),
  ('d2010215-2125-41c1-940e-f13b411fff5c', 'ABC Style', 'ABC stil sa ikonama', 28)
ON CONFLICT (zapcap_template_id) DO NOTHING;

COMMENT ON TABLE public.caption_templates IS 'ZapCap caption template configurations for video captions';
