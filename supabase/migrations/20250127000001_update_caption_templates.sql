-- Update caption templates with new ZapCap templates
-- Remove old templates and add new ones

-- Delete all existing templates
DELETE FROM public.caption_templates;

-- Insert new ZapCap caption templates
INSERT INTO public.caption_templates (zapcap_template_id, name, preview_image_url, style_description, sort_order)
VALUES
  ('1bb3b68b-6a93-453a-afd7-a774b62cdab8', 'Ali', 'https://cdn.zapcap.ai/template-gifs/1bb3b68b-6a93-453a-afd7-a774b62cdab8.gif', 'Ali caption style', 1),
  ('46d20d67-255c-4c6a-b971-31fddcfea7f0', 'Beast', 'https://cdn.zapcap.ai/template-gifs/46d20d67-255c-4c6a-b971-31fddcfea7f0.gif', 'Beast caption style', 2),
  ('9a2b0ed5-231b-4052-9211-5af9dc2de65e', 'Beth', 'https://cdn.zapcap.ai/template-gifs/9a2b0ed5-231b-4052-9211-5af9dc2de65e.gif', 'Beth caption style', 3),
  ('6255949c-4a52-4255-8a67-39ebccfaa3ef', 'Cairo', 'https://cdn.zapcap.ai/template-gifs/6255949c-4a52-4255-8a67-39ebccfaa3ef.gif', 'Cairo caption style', 4),
  ('07ffd4b8-4e1a-4ee3-8921-d58802953bcd', 'Celine', 'https://cdn.zapcap.ai/template-gifs/07ffd4b8-4e1a-4ee3-8921-d58802953bcd.gif', 'Celine caption style', 5),
  ('a6760d82-72c1-4190-bfdb-7d9c908732f1', 'Dan', 'https://cdn.zapcap.ai/template-gifs/a6760d82-72c1-4190-bfdb-7d9c908732f1.gif', 'Dan caption style', 6),
  ('d46bb0da-cce0-4507-909d-fa8904fb8ed7', 'Devin', 'https://cdn.zapcap.ai/template-gifs/d46bb0da-cce0-4507-909d-fa8904fb8ed7.gif', 'Devin caption style', 7),
  ('e7e758de-4eb4-460f-aeca-b2801ac7f8cc', 'Ella', 'https://cdn.zapcap.ai/template-gifs/e7e758de-4eb4-460f-aeca-b2801ac7f8cc.gif', 'Ella caption style', 8),
  ('cc4b8197-2d49-4cc7-9f77-d9fbd8ef96ab', 'Felix', 'https://cdn.zapcap.ai/template-gifs/cc4b8197-2d49-4cc7-9f77-d9fbd8ef96ab.gif', 'Felix caption style', 9),
  ('cfa6a20f-cacc-4fb6-b1d0-464a81fed6cf', 'Gstaad', 'https://cdn.zapcap.ai/template-gifs/cfa6a20f-cacc-4fb6-b1d0-464a81fed6cf.gif', 'Gstaad caption style', 10),
  ('a51c5222-47a7-4c37-b052-7b9853d66bf6', 'Hormozi 1', 'https://cdn.zapcap.ai/template-gifs/a51c5222-47a7-4c37-b052-7b9853d66bf6.gif', 'Hormozi caption style 1', 11),
  ('ca050348-e2d0-49a7-9c75-7a5e8335c67d', 'Hormozi 2', 'https://cdn.zapcap.ai/template-gifs/ca050348-e2d0-49a7-9c75-7a5e8335c67d.gif', 'Hormozi caption style 2', 12),
  ('decf5309-2094-4257-a646-cabe1f1ba89a', 'Hormozi 3', 'https://cdn.zapcap.ai/template-gifs/decf5309-2094-4257-a646-cabe1f1ba89a.gif', 'Hormozi caption style 3', 13),
  ('e659ee0c-53bb-497e-869c-90f8ec0a921f', 'Hormozi 4', 'https://cdn.zapcap.ai/template-gifs/e659ee0c-53bb-497e-869c-90f8ec0a921f.gif', 'Hormozi caption style 4', 14),
  ('a5619dcb-199d-4c6d-af05-6e5d5daef601', 'Hormozi 5', 'https://cdn.zapcap.ai/template-gifs/a5619dcb-199d-4c6d-af05-6e5d5daef601.gif', 'Hormozi caption style 5', 15),
  ('eb5de878-2997-41fe-858a-726e9e3712df', 'Iman', 'https://cdn.zapcap.ai/template-gifs/eb5de878-2997-41fe-858a-726e9e3712df.gif', 'Iman caption style', 16),
  ('50cdfac1-0a7a-48dd-af14-4d24971e213a', 'Jason', 'https://cdn.zapcap.ai/template-gifs/50cdfac1-0a7a-48dd-af14-4d24971e213a.gif', 'Jason caption style', 17),
  ('dfe027d9-bd9d-4e55-a94f-d57ed368a060', 'Jordan', 'https://cdn.zapcap.ai/template-gifs/dfe027d9-bd9d-4e55-a94f-d57ed368a060.gif', 'Jordan caption style', 18),
  ('14bcd077-3f98-465b-b788-1b628951c340', 'Karl', 'https://cdn.zapcap.ai/template-gifs/14bcd077-3f98-465b-b788-1b628951c340.gif', 'Karl caption style', 19),
  ('1c0c9b65-47c4-41bf-a187-25a8305fd0dd', 'Lira', 'https://cdn.zapcap.ai/template-gifs/1c0c9b65-47c4-41bf-a187-25a8305fd0dd.gif', 'Lira caption style', 20),
  ('982ad276-a76f-4d80-a4e2-b8fae0038464', 'Luke', 'https://cdn.zapcap.ai/template-gifs/982ad276-a76f-4d80-a4e2-b8fae0038464.gif', 'Luke caption style', 21),
  ('7b946549-ae16-4085-9dd3-c20c82504daa', 'Maya', 'https://cdn.zapcap.ai/template-gifs/7b946549-ae16-4085-9dd3-c20c82504daa.gif', 'Maya caption style', 22),
  ('a104df87-5b1a-4490-8cca-62e504a84615', 'Noah', 'https://cdn.zapcap.ai/template-gifs/a104df87-5b1a-4490-8cca-62e504a84615.gif', 'Noah caption style', 23),
  ('55267be2-9eec-4d06-aff8-edcb401b112e', 'Sage', 'https://cdn.zapcap.ai/template-gifs/55267be2-9eec-4d06-aff8-edcb401b112e.gif', 'Sage caption style', 24),
  ('5de632e7-0b02-4d15-8137-e004871e861b', 'Sydney', 'https://cdn.zapcap.ai/template-gifs/5de632e7-0b02-4d15-8137-e004871e861b.gif', 'Sydney caption style', 25),
  ('21327a45-df89-46bc-8d56-34b8d29d3a0e', 'Tracy', 'https://cdn.zapcap.ai/template-gifs/21327a45-df89-46bc-8d56-34b8d29d3a0e.gif', 'Tracy caption style', 26),
  ('c88bff11-7f03-4066-94cd-88f71f9ecc68', 'Umi', 'https://cdn.zapcap.ai/template-gifs/c88bff11-7f03-4066-94cd-88f71f9ecc68.gif', 'Umi caption style', 27),
  ('d2018215-2125-41c1-940e-f13b411fff5c', 'Viktor', 'https://cdn.zapcap.ai/template-gifs/d2018215-2125-41c1-940e-f13b411fff5c.gif', 'Viktor caption style', 28);

COMMENT ON COLUMN public.caption_templates.preview_image_url IS 'Preview GIF URL from ZapCap CDN';
