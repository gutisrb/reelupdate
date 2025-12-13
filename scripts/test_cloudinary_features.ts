
// scripts/test_cloudinary_features.ts
// Tests various Cloudinary URL features to isolate the "Invalid URL" error.

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const CLOUD_NAME = 'dyarnpqaq';
const BASE_VIDEO = 'clip_7f7e06bb-39d0-4add-b358-ea333ade6a04_1_s65doc_kxkxv4.mp4'; // Known working clip

// Base transformation parts
const BASE_TRANSFORM = 'ar_9:16,c_fill,w_1080,h_1920,ac_none';

async function checkUrl(name: string, url: string) {
    try {
        // Use a short timeout to fail fast
        await execAsync(`curl -I --fail --max-time 5 "${url}"`);
        console.log(`[PASS] ${name}`);
    } catch (error: any) {
        console.log(`[FAIL] ${name}`);
        console.log(`       URL: ${url}`);
        // console.log(`       Error: ${error.message}`);
    }
}

async function runTests() {
    console.log("Starting Cloudinary Feature Tests...");

    // 1. Baseline
    const url1 = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${BASE_TRANSFORM}/${BASE_VIDEO}`;
    await checkUrl('Baseline (Simple)', url1);

    // 2. Text Overlay Simple
    const textSimple = `l_text:Arial_34:Hello,co_rgb:FFFFFF/fl_layer_apply`;
    const url2 = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${BASE_TRANSFORM}/${textSimple}/${BASE_VIDEO}`;
    await checkUrl('Text Simple', url2);

    // 3. Text Overlay with Background (b_rgb)
    // Testing the b_rgb syntax specifically
    const textBg = `l_text:Arial_34:Hello,co_rgb:FFFFFF,b_rgb:6f1390/fl_layer_apply`;
    const url3 = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${BASE_TRANSFORM}/${textBg}/${BASE_VIDEO}`;
    await checkUrl('Text with b_rgb', url3);

    // 4. Text Overlay with Stroke (bo)
    // Testing bo syntax on layer
    const textStroke = `l_text:Arial_34:Hello,co_rgb:FFFFFF,bo_5px_solid_rgb:000000/fl_layer_apply`;
    const url4 = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${BASE_TRANSFORM}/${textStroke}/${BASE_VIDEO}`;
    await checkUrl('Text with Stroke', url4);

    // 5. Font Encoding "Times New Roman"
    const fontEncoded = `l_text:Times%20New%20Roman_34_bold:Hello,co_rgb:FFFFFF/fl_layer_apply`;
    const url5 = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${BASE_TRANSFORM}/${fontEncoded}/${BASE_VIDEO}`;
    await checkUrl('Font Times New Roman', url5);

    // 6. Full Combination (Font + BG + Stroke)
    const fullCombo = `l_text:Times%20New%20Roman_34_bold:Hello%20World,co_rgb:FFFFFF,b_rgb:6f1390,bo_5px_solid_rgb:000000,g_south,y_100/fl_layer_apply`;
    const url6 = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${BASE_TRANSFORM}/${fullCombo}/${BASE_VIDEO}`;
    await checkUrl('Full Combo (Font+BG+Stroke)', url6);

    // 7. Flags at End (f_mp4, etc.)
    // Testing if flags break it
    const url7 = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${BASE_TRANSFORM}/${fullCombo}/f_mp4/vc_h264/q_auto:good/${BASE_VIDEO}`;
    await checkUrl('Full Combo + Flags', url7);

    // 8. Complex Multi-Layer (Simulating User URL)
    const complexLayers = [
        `l_text:Times%20New%20Roman_34_bold:Line%20One,co_rgb:FFFFFF,b_rgb:6f1390,g_south,y_100,so_0,du_2/fl_layer_apply`,
        `l_text:Times%20New%20Roman_34_bold:Line%20Two%20is%20longer,co_rgb:FFFFFF,b_rgb:6f1390,g_south,y_100,so_2,du_2/fl_layer_apply`,
        `l_text:Times%20New%20Roman_34_bold:Line%20Three%20is%20very%20long%20indeed,co_rgb:FFFFFF,b_rgb:6f1390,g_south,y_100,so_4,du_2/fl_layer_apply`,
        `l_image:logos:6275d377-59e9-4a27-ba44-e7dc6b0c549f:Cezar-Logo-3-3_q7sopj,g_north_east,x_20,y_20,w_270,o_80/fl_layer_apply`
    ].join('/');

    // 8. Complex URL restored
    const url8 = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${BASE_TRANSFORM}/${complexLayers}/f_mp4/vc_h264/q_auto:good/${BASE_VIDEO}`;
    await checkUrl('Complex Multi-Layer', url8);
    // 9. Spliced Video + Text Overlay (Simulating Exact User Scenario)
    // Splicing the same clip 3 times, then adding text
    const splicedLayers = [
        `l_video:${BASE_VIDEO.replace('.mp4', '')},ar_9:16,c_fill,w_1080,h_1920,fl_splice,ac_none/fl_layer_apply`,
        `l_video:${BASE_VIDEO.replace('.mp4', '')},ar_9:16,c_fill,w_1080,h_1920,fl_splice,ac_none/fl_layer_apply`,
        `l_text:Times%20New%20Roman_34_bold:Line%20One,co_rgb:FFFFFF,b_rgb:6f1390,g_south,y_100,so_0,du_2/fl_layer_apply`
    ].join('/');

    // Note: Cloudinary expects the base video (first clip) at the end of the URL
    // And spliced clips are appended to it.

    const url9 = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${BASE_TRANSFORM}/${splicedLayers}/f_mp4/vc_h264/q_auto:good/${BASE_VIDEO}`;
    await checkUrl('Spliced + Text + BG', url9);
    // 10. STRESS TEST (Exact User Replica)
    // 4 Spliced clips + 7 Text Layers with BG + Logo + Audio + Flags
    const stressLayers = [
        // Splices (x4)
        `l_video:${BASE_VIDEO.replace('.mp4', '')},ar_9:16,c_fill,w_1080,h_1920,fl_splice,ac_none/fl_layer_apply`,
        `l_video:${BASE_VIDEO.replace('.mp4', '')},ar_9:16,c_fill,w_1080,h_1920,fl_splice,ac_none/fl_layer_apply`,
        `l_video:${BASE_VIDEO.replace('.mp4', '')},ar_9:16,c_fill,w_1080,h_1920,fl_splice,ac_none/fl_layer_apply`,
        `l_video:${BASE_VIDEO.replace('.mp4', '')},ar_9:16,c_fill,w_1080,h_1920,fl_splice,ac_none/fl_layer_apply`,

        // Audio
        // `l_audio:music...` (Skipping actual audio UUIDs to avoid 404, using placeholder logic if needed, but lets skip for now as video logic is key)

        // Text Layers (x7)
        `l_text:Times%20New%20Roman_34_bold:Line%20One,co_rgb:FFFFFF,b_rgb:6f1390,g_south,y_100,so_0,du_2/fl_layer_apply`,
        `l_text:Times%20New%20Roman_34_bold:Line%20Two,co_rgb:FFFFFF,b_rgb:6f1390,g_south,y_100,so_2,du_2/fl_layer_apply`,
        `l_text:Times%20New%20Roman_34_bold:Line%20Three,co_rgb:FFFFFF,b_rgb:6f1390,g_south,y_100,so_4,du_2/fl_layer_apply`,
        `l_text:Times%20New%20Roman_34_bold:Line%20Four,co_rgb:FFFFFF,b_rgb:6f1390,g_south,y_100,so_6,du_2/fl_layer_apply`,
        `l_text:Times%20New%20Roman_34_bold:Line%20Five,co_rgb:FFFFFF,b_rgb:6f1390,g_south,y_100,so_8,du_2/fl_layer_apply`,
        `l_text:Times%20New%20Roman_34_bold:Line%20Six,co_rgb:FFFFFF,b_rgb:6f1390,g_south,y_100,so_10,du_2/fl_layer_apply`,
        `l_text:Times%20New%20Roman_34_bold:Line%20Seven,co_rgb:FFFFFF,b_rgb:6f1390,g_south,y_100,so_12,du_2/fl_layer_apply`,

        // Logo
        `l_image:logos:6275d377-59e9-4a27-ba44-e7dc6b0c549f:Cezar-Logo-3-3_q7sopj,g_north_east,x_20,y_20,w_270,o_80/fl_layer_apply`
    ].join('/');

    const url10 = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${BASE_TRANSFORM}/${stressLayers}/f_mp4/vc_h264/q_auto:good/${BASE_VIDEO}`;
    await checkUrl('STRESS TEST (Replica)', url10);
    // 11. Special Characters Test
    // Testing "Nije šala!" which contains 'š' (UTF8: 0xC5 0xA1)
    // encodeURIComponent('š') = %C5%A1
    const specialText = 'Nije šala!';
    const encodedSpecial = encodeURIComponent(specialText);
    const specialLayer = `l_text:Times%20New%20Roman_34_bold:${encodedSpecial},co_rgb:FFFFFF,b_rgb:6f1390,g_south,y_100/fl_layer_apply`;

    const url11 = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${BASE_TRANSFORM}/${specialLayer}/f_mp4/vc_h264/q_auto:good/${BASE_VIDEO}`;
    await checkUrl('Special Char (š)', url11);
    // 12. Font Test: Times New Roman
    // Testing if "Times New Roman" is actually supported
    // If this fails, we must map to "Times" or "Arial"
    const fontText = encodeURIComponent("Testing Font");
    const fontLayer = `l_text:Times%20New%20Roman_34_bold:${fontText},co_rgb:FFFFFF/fl_layer_apply`;
    const url12 = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${BASE_TRANSFORM}/${fontLayer}/f_mp4/vc_h264/q_auto:good/${BASE_VIDEO}`;
    await checkUrl('Font: Times New Roman', url12);

    // 13. Font Test: Times (Alternative)
    const timesLayer = `l_text:Times_34_bold:${fontText},co_rgb:FFFFFF/fl_layer_apply`;
    const url13 = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${BASE_TRANSFORM}/${timesLayer}/f_mp4/vc_h264/q_auto:good/${BASE_VIDEO}`;
    await checkUrl('Font: Times', url13);

    // 14. Punctuation Test (Period)
    // Testing "evra." ending with period
    const periodText = encodeURIComponent("evra.");
    // periodText is "evra." because encodeURIComponent doesn't encode dots
    const periodLayer = `l_text:Arial_34_bold:${periodText},co_rgb:FFFFFF/fl_layer_apply`;
    const url14 = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${BASE_TRANSFORM}/${periodLayer}/f_mp4/vc_h264/q_auto:good/${BASE_VIDEO}`;
    await checkUrl('Punctuation: Period (.)', url14);

    // 15. Punctuation Test (Encoded Period %2E)
    // Manually encoding dot
    const safePeriodText = "evra%2E";
    const safePeriodLayer = `l_text:Arial_34_bold:${safePeriodText},co_rgb:FFFFFF/fl_layer_apply`;
    const url15 = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${BASE_TRANSFORM}/${safePeriodLayer}/f_mp4/vc_h264/q_auto:good/${BASE_VIDEO}`;
    await checkUrl('Punctuation: Safe Period (%2E)', url15);
}

runTests();
