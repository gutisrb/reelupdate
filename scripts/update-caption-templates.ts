import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateCaptionTemplates() {
  console.log('🔄 Updating caption templates...');

  // Delete existing templates
    const { error: deleteError } = await supabase
      .from('caption_templates')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('❌ Error deleting old templates:', deleteError);
      process.exit(1);
    }

    console.log('✅ Deleted old templates');

    // Insert new templates
    const templates = [
      { zapcap_template_id: '1bb3b68b-6a93-453a-afd7-a774b62cdab8', name: 'Ali', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/1bb3b68b-6a93-453a-afd7-a774b62cdab8.gif', style_description: 'Ali caption style', sort_order: 1 },
      { zapcap_template_id: '46d20d67-255c-4c6a-b971-31fddcfea7f0', name: 'Beast', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/46d20d67-255c-4c6a-b971-31fddcfea7f0.gif', style_description: 'Beast caption style', sort_order: 2 },
      { zapcap_template_id: '9a2b0ed5-231b-4052-9211-5af9dc2de65e', name: 'Beth', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/9a2b0ed5-231b-4052-9211-5af9dc2de65e.gif', style_description: 'Beth caption style', sort_order: 3 },
      { zapcap_template_id: '6255949c-4a52-4255-8a67-39ebccfaa3ef', name: 'Cairo', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/6255949c-4a52-4255-8a67-39ebccfaa3ef.gif', style_description: 'Cairo caption style', sort_order: 4 },
      { zapcap_template_id: '07ffd4b8-4e1a-4ee3-8921-d58802953bcd', name: 'Celine', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/07ffd4b8-4e1a-4ee3-8921-d58802953bcd.gif', style_description: 'Celine caption style', sort_order: 5 },
      { zapcap_template_id: 'a6760d82-72c1-4190-bfdb-7d9c908732f1', name: 'Dan', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/a6760d82-72c1-4190-bfdb-7d9c908732f1.gif', style_description: 'Dan caption style', sort_order: 6 },
      { zapcap_template_id: 'd46bb0da-cce0-4507-909d-fa8904fb8ed7', name: 'Devin', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/d46bb0da-cce0-4507-909d-fa8904fb8ed7.gif', style_description: 'Devin caption style', sort_order: 7 },
      { zapcap_template_id: 'e7e758de-4eb4-460f-aeca-b2801ac7f8cc', name: 'Ella', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/e7e758de-4eb4-460f-aeca-b2801ac7f8cc.gif', style_description: 'Ella caption style', sort_order: 8 },
      { zapcap_template_id: 'cc4b8197-2d49-4cc7-9f77-d9fbd8ef96ab', name: 'Felix', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/cc4b8197-2d49-4cc7-9f77-d9fbd8ef96ab.gif', style_description: 'Felix caption style', sort_order: 9 },
      { zapcap_template_id: 'cfa6a20f-cacc-4fb6-b1d0-464a81fed6cf', name: 'Gstaad', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/cfa6a20f-cacc-4fb6-b1d0-464a81fed6cf.gif', style_description: 'Gstaad caption style', sort_order: 10 },
      { zapcap_template_id: 'a51c5222-47a7-4c37-b052-7b9853d66bf6', name: 'Hormozi 1', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/a51c5222-47a7-4c37-b052-7b9853d66bf6.gif', style_description: 'Hormozi caption style 1', sort_order: 11 },
      { zapcap_template_id: 'ca050348-e2d0-49a7-9c75-7a5e8335c67d', name: 'Hormozi 2', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/ca050348-e2d0-49a7-9c75-7a5e8335c67d.gif', style_description: 'Hormozi caption style 2', sort_order: 12 },
      { zapcap_template_id: 'decf5309-2094-4257-a646-cabe1f1ba89a', name: 'Hormozi 3', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/decf5309-2094-4257-a646-cabe1f1ba89a.gif', style_description: 'Hormozi caption style 3', sort_order: 13 },
      { zapcap_template_id: 'e659ee0c-53bb-497e-869c-90f8ec0a921f', name: 'Hormozi 4', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/e659ee0c-53bb-497e-869c-90f8ec0a921f.gif', style_description: 'Hormozi caption style 4', sort_order: 14 },
      { zapcap_template_id: 'a5619dcb-199d-4c6d-af05-6e5d5daef601', name: 'Hormozi 5', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/a5619dcb-199d-4c6d-af05-6e5d5daef601.gif', style_description: 'Hormozi caption style 5', sort_order: 15 },
      { zapcap_template_id: 'eb5de878-2997-41fe-858a-726e9e3712df', name: 'Iman', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/eb5de878-2997-41fe-858a-726e9e3712df.gif', style_description: 'Iman caption style', sort_order: 16 },
      { zapcap_template_id: '50cdfac1-0a7a-48dd-af14-4d24971e213a', name: 'Jason', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/50cdfac1-0a7a-48dd-af14-4d24971e213a.gif', style_description: 'Jason caption style', sort_order: 17 },
      { zapcap_template_id: 'dfe027d9-bd9d-4e55-a94f-d57ed368a060', name: 'Jordan', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/dfe027d9-bd9d-4e55-a94f-d57ed368a060.gif', style_description: 'Jordan caption style', sort_order: 18 },
      { zapcap_template_id: '14bcd077-3f98-465b-b788-1b628951c340', name: 'Karl', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/14bcd077-3f98-465b-b788-1b628951c340.gif', style_description: 'Karl caption style', sort_order: 19 },
      { zapcap_template_id: '1c0c9b65-47c4-41bf-a187-25a8305fd0dd', name: 'Lira', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/1c0c9b65-47c4-41bf-a187-25a8305fd0dd.gif', style_description: 'Lira caption style', sort_order: 20 },
      { zapcap_template_id: '982ad276-a76f-4d80-a4e2-b8fae0038464', name: 'Luke', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/982ad276-a76f-4d80-a4e2-b8fae0038464.gif', style_description: 'Luke caption style', sort_order: 21 },
      { zapcap_template_id: '7b946549-ae16-4085-9dd3-c20c82504daa', name: 'Maya', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/7b946549-ae16-4085-9dd3-c20c82504daa.gif', style_description: 'Maya caption style', sort_order: 22 },
      { zapcap_template_id: 'a104df87-5b1a-4490-8cca-62e504a84615', name: 'Noah', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/a104df87-5b1a-4490-8cca-62e504a84615.gif', style_description: 'Noah caption style', sort_order: 23 },
      { zapcap_template_id: '55267be2-9eec-4d06-aff8-edcb401b112e', name: 'Sage', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/55267be2-9eec-4d06-aff8-edcb401b112e.gif', style_description: 'Sage caption style', sort_order: 24 },
      { zapcap_template_id: '5de632e7-0b02-4d15-8137-e004871e861b', name: 'Sydney', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/5de632e7-0b02-4d15-8137-e004871e861b.gif', style_description: 'Sydney caption style', sort_order: 25 },
      { zapcap_template_id: '21327a45-df89-46bc-8d56-34b8d29d3a0e', name: 'Tracy', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/21327a45-df89-46bc-8d56-34b8d29d3a0e.gif', style_description: 'Tracy caption style', sort_order: 26 },
      { zapcap_template_id: 'c88bff11-7f03-4066-94cd-88f71f9ecc68', name: 'Umi', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/c88bff11-7f03-4066-94cd-88f71f9ecc68.gif', style_description: 'Umi caption style', sort_order: 27 },
      { zapcap_template_id: 'd2018215-2125-41c1-940e-f13b411fff5c', name: 'Viktor', preview_image_url: 'https://cdn.zapcap.ai/template-gifs/d2018215-2125-41c1-940e-f13b411fff5c.gif', style_description: 'Viktor caption style', sort_order: 28 },
    ];

    const { error: insertError } = await supabase
      .from('caption_templates')
      .insert(templates);

  if (insertError) {
    console.error('❌ Error inserting new templates:', insertError);
    process.exit(1);
  }

  console.log('✅ Successfully updated caption templates!');
  console.log(`📊 Inserted ${templates.length} new templates`);
}

updateCaptionTemplates().catch(console.error);
