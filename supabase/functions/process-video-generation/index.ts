// Main Video Generation Edge Function
// Replaces Make.com workflow

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { initClients } from '../_shared/clients/index.ts';
import { CREATIVE_WILDCARDS } from '../_shared/constants/wildcards.ts';
import type { VideoGenerationRequest, UserSettings, ClipData, VideoBlueprint, DirectorContext } from '../_shared/types.ts';
import { API_ENDPOINTS } from '../_shared/config.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check if this is a recursive poll request (JSON)
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = await req.json();

      if (payload.mode === 'zapcap_poll') {
        console.log(`[${payload.video_id}] 🔄 RESUMING: Recursive polling for ZapCap`);
        // @ts-ignore
        EdgeRuntime.waitUntil(
          handleZapCapPoll(payload, req.url, req.headers.get('Authorization') || '')
        );
        return new Response(JSON.stringify({ ok: true, message: 'Polling resumed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Default: Initial connection (FormData)
    const formData = await req.formData();
    const videoId = formData.get('video_id') as string;
    const userId = formData.get('user_id') as string;
    const groupingStr = formData.get('grouping') as string;
    const captionVideoUrl = formData.get('caption_video_url') as string | null;
    const directorPersonality = formData.get('director_personality') as string | null;

    if (!videoId || !userId) {
      throw new Error('Missing required fields: video_id or user_id');
    }

    // [Setup data object...]
    const propertyData = {
      title: formData.get('title') as string || '',
      price: formData.get('price') as string || '',
      location: formData.get('location') as string || '',
      size: formData.get('size') as string || '',
      beds: formData.get('beds') as string || '',
      baths: formData.get('baths') as string || '',
      sprat: formData.get('sprat') as string || '',
      extras: formData.get('extras') as string || '',
    };

    const grouping = JSON.parse(groupingStr || '[]');
    const totalImages = parseInt(formData.get('total_images') as string || '0');
    const images: any[] = [];
    for (let i = 0; i < totalImages; i++) {
      const imageFile = formData.get('image_' + i) as File;
      if (imageFile) {
        images.push({ data: await imageFile.arrayBuffer(), name: imageFile.name });
      }
    }

    const imageSlots: any[] = [];
    for (const group of grouping) {
      if (group.type === 'frame-to-frame') {
        imageSlots.push({ mode: 'frame-to-frame', images: [images[group.first_index], images[group.second_index]].filter(Boolean) });
      } else if (group.type === 'single') {
        imageSlots.push({ mode: 'image-to-video', images: [images[group.index]].filter(Boolean) });
      }
    }

    const data: VideoGenerationRequest = {
      video_id: videoId,
      user_id: userId,
      property_data: propertyData,
      image_slots: imageSlots,
      grouping: groupingStr,
      slot_mode_info: groupingStr,
      total_images: totalImages,
      caption_video_url: captionVideoUrl || undefined,
      logo_size_percent: formData.get('logo_size') ? parseInt(formData.get('logo_size') as string) : undefined,
      director_personality: directorPersonality || undefined,
      property_type: formData.get('property_type') as string | undefined,
      script_hook: formData.get('script_hook') as string | undefined,
      visual_hook: formData.get('visual_hook') as string | undefined,
      is_preview: formData.get('is_preview') === 'true'
    };

    // Initialize Supabase client
    const supabase = createClient(API_ENDPOINTS.supabase.url, API_ENDPOINTS.supabase.serviceRoleKey);
    const clients = initClients();

    // 1. Check Credits
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('video_credits_remaining').eq('id', data.user_id).single();
    if (profileError || !profileData || profileData.video_credits_remaining <= 0) {
      return new Response(JSON.stringify({ error: 'NO_VIDEO_CREDITS' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Deduct Credit & Create Record
    await supabase.rpc('spend_video_credit', { p_user: data.user_id });
    await supabase.from('videos').insert({
      id: data.video_id, user_id: data.user_id, type: 'video', status: 'processing',
      title: data.property_data.title, thumbnail_url: null, video_url: null, duration_seconds: null,
    });

    console.log(`[${data.video_id}] 🚀 Starting video generation (Start Phase)`);

    // Run Start Phase in Background
    // @ts-ignore
    EdgeRuntime.waitUntil(
      startVideoGeneration(data, supabase, clients, req.url, req.headers.get('Authorization') || '')
    );

    return new Response(
      JSON.stringify({ ok: true, video_id: data.video_id, message: 'Video generation started' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Request handling error:', error);
    return new Response(JSON.stringify({ error: (error as any).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

// ==========================================
// PHASE 1: START (Heavy Lifting -> ZapCap Init)
// ==========================================
async function startVideoGeneration(data: VideoGenerationRequest, supabase: any, clients: any, functionUrl: string, authToken: string) {
  const startTime = Date.now();
  try {
    // 3. GET USER SETTINGS
    const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', data.user_id).single();
    const userSettings: UserSettings = settings || {
      voice_id: 'sr-RS-Standard-A', voice_language_code: 'sr-RS', logo_url: null, logo_position: 'corner_top_right', logo_size_percent: 15,
      caption_template_id: null, caption_enabled: true, music_preference: 'auto_generate', default_music_volume_db: -60, caption_system: 'whisper',
      caption_style_type: 'template', caption_font_family: 'Arial', caption_font_size: 34, caption_font_color: 'FFFFFF', caption_bg_color: '000000', caption_bg_opacity: 100
    };

    if (data.logo_size_percent) {
      userSettings.logo_size_percent = data.logo_size_percent;
    }

    let captionTemplateId = null;
    if (userSettings.caption_template_id) {
      const { data: t } = await supabase.from('caption_templates').select('zapcap_template_id').eq('id', userSettings.caption_template_id).single();
      captionTemplateId = t?.zapcap_template_id;
    }
    if (!captionTemplateId) captionTemplateId = '6255949c-4a52-4255-8a67-39ebccfaa3ef';

    // ============================================
    // PHASE 0: THE DIRECTOR AGENT (Blueprint)
    // ============================================
    await supabase.from('videos').update({ processing_status_text: 'AI Director is designing strategy...' }).eq('id', data.video_id);

    // Fetch History
    const { data: interactionHistory } = await supabase
      .from('video_generation_details')
      .select('strategy_used, processing_started_at')
      .order('processing_started_at', { ascending: false })
      .limit(5);

    const recentlyUsedStrategies = interactionHistory?.map((h: any) => h.strategy_used).filter(Boolean) || [];
    const randomWildcard = CREATIVE_WILDCARDS[Math.floor(Math.random() * CREATIVE_WILDCARDS.length)];

    const directorContext: DirectorContext = {
      history_strategies: recentlyUsedStrategies,
      wildcard: randomWildcard,
      preferred_vibe: data.director_personality,
      brand_logo_url: userSettings.logo_url,
      brand_colors: {
        primary: userSettings.caption_font_color, // Use caption color as primary brand color hint
        secondary: userSettings.caption_bg_color
      }
    };

    console.log(`[${data.video_id}] 🧠 AGENT DIRECTOR: Starting blueprint generation...`);
    const blueprint: VideoBlueprint = await clients.director.generateBlueprint(data.property_data, directorContext);
    console.log(`[${data.video_id}] 🎬 Director Strategy: ${blueprint.strategy_name} | Constraint: ${randomWildcard}`);
    console.log(`[${data.video_id}] 📄 BLUEPRINT READY:`, JSON.stringify(blueprint));

    // OVERRIDE: If user provided a manual script hook, use it.
    if (data.script_hook && data.script_hook.trim().length > 0) {
      console.log(`[${data.video_id}] ✍️ User provided manual script hook: "${data.script_hook}"`);
      blueprint.script_hook = data.script_hook;
    }

    // 4. PROCESS CLIPS (With Visual Hooks)
    const isTestMode = data.property_data.title.toUpperCase().includes('TEST_MODE');
    const isPreview = data.is_preview === true;
    let clips: ClipData[] = [];

    if (isTestMode) {
      const placeholderClips = [
        'https://res.cloudinary.com/dyarnpqaq/video/upload/v1765287500/clip_7f7e06bb-39d0-4add-b358-ea333ade6a04_0_fmtela_iznuwx.mp4',
        'https://res.cloudinary.com/dyarnpqaq/video/upload/v1765287500/clip_7f7e06bb-39d0-4add-b358-ea333ade6a04_1_s65doc_kxkxv4.mp4',
        'https://res.cloudinary.com/dyarnpqaq/video/upload/v1765287500/clip_7f7e06bb-39d0-4add-b358-ea333ade6a04_2_qgb0vb_axic0c.mp4',
        'https://res.cloudinary.com/dyarnpqaq/video/upload/v1765287500/clip_7f7e06bb-39d0-4add-b338-ea333ade6a04_3_re2ma1_xy4odo.mp4',
        'https://res.cloudinary.com/dyarnpqaq/video/upload/v1765287500/clip_7f7e06bb-39d0-4add-b358-ea333ade6a04_4_eoizxe_jvrhvl.mp4',
      ];
      clips = data.image_slots.map((_s, i) => ({
        slot_index: i, luma_generation_id: 'test', luma_prompt: 'test', clip_url: placeholderClips[i % 5],
        first_image_url: '', second_image_url: null, is_keyframe: false, description: 'test', mood: 'modern'
      }));
    } else {
      console.log(`[${data.video_id}] 🎬 CLIPS: Preparing ${data.image_slots.length} clips...`);
      // If PREVIEW, only process the first slot (Visual Hook)
      const slotsToProcess = isPreview ? [data.image_slots[0]] : data.image_slots;
      const clipPreparations = slotsToProcess.map((slot, index) =>
        prepareClip(slot, index, data, clients, index === 0 ? blueprint : null)
      );
      clips = await Promise.all(clipPreparations);
      console.log(`[${data.video_id}] 🎨 CLIPS READY (${clips.length})`);
    }

    if (clips.length > 0 && clips[0].first_image_url) {
      await supabase.from('videos').update({ thumbnail_url: clips[0].first_image_url }).eq('id', data.video_id);
    }

    // 5. AUDIO & SCRIPT
    await supabase.from('videos').update({ processing_status_text: 'Generating preview components...' }).eq('id', data.video_id);
    let voiceoverScript = 'Test Script';
    let voiceoverUpload: any = { secure_url: '' };
    let musicUrl = '';
    let musicSource = 'auto';

    if (isTestMode) {
      voiceoverScript = 'TEST_MODE placeholder script';
      voiceoverUpload = { secure_url: 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1765407043/cwl0mqzkwc3xf7iesmgl.wav' };
      musicUrl = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1765440325/music_1765440324652.mp3';
    } else {
      const visualContext = clips.map(c => c.luma_prompt).join('; ');

      // Inject Script Hook via Extras
      const hookedPropertyData = {
        ...data.property_data,
        extras: `[IMPORTANT: START SCRIPT WITH THIS EXACT HOOK: "${blueprint.script_hook}"] ${data.property_data.extras}`
      };

      await supabase.from('videos').update({ processing_status_text: 'Writing script...' }).eq('id', data.video_id);
      console.log(`[${data.video_id}] 🎙️ GEMINI: Generating full voiceover script...`);
      voiceoverScript = await clients.google.generateVoiceoverScript(
        { ...hookedPropertyData, price_mention: data.price_mention }, // Pass price_mention
        visualContext,
        clips.length * 5,
        blueprint.script_hook
      );
      console.log(`[${data.video_id}] 📜 SCRIPT: "${voiceoverScript}"`);

      if (!isPreview) {
        console.log(`[${data.video_id}] 🔊 AUDIO: Processing TTS and Music...`);
        await supabase.from('videos').update({ processing_status_text: 'Generating voiceover...' }).eq('id', data.video_id);
        const voiceoverPCM = await clients.google.generateTTS(voiceoverScript, userSettings.voice_id, userSettings.voice_style_instructions);
        voiceoverUpload = await clients.cloudinary.uploadVideo(voiceoverPCM, `voiceover_${data.video_id}.wav`);
        console.log(`[${data.video_id}] 🗣️ VOICE READY: ${voiceoverUpload.secure_url}`);

        await supabase.from('videos').update({ processing_status_text: 'Composing music...' }).eq('id', data.video_id);
        const musicPrompt = clients.elevenlabs.generateMusicPrompt(clips[0]?.mood || 'modern', clips[0]?.description || '');
        musicUrl = await clients.elevenlabs.generateMusic(musicPrompt, clips.length * 5 * 1000);
        console.log(`[${data.video_id}] 🎶 MUSIC READY: ${musicUrl}`);
      }
    }

    // Wait for Kling (Wait for loop)
    if (!isTestMode) {
      await supabase.from('videos').update({ processing_status_text: 'Animating hooks...' }).eq('id', data.video_id);
      const completionPromises = clips.map((clip, index) => finishClip(clip, index, data, clients));
      clips = await Promise.all(completionPromises);
    }

    // 6. FINALIZING PREVIEW OR FULL ASSEMBLY
    if (isPreview) {
      console.log(`[${data.video_id}] 🏁 PREVIEW MODE COMPLETE`);
      await supabase.from('videos').update({
        status: 'ready',
        video_url: clips[0].clip_url,
        thumbnail_url: clips[0]?.first_image_url || null,
        duration_seconds: 5,
        // Store script in a structured detail record or repurposed field
        title: `[PREVIEW] ${voiceoverScript.substring(0, 50)}...`,
        updated_at: new Date().toISOString()
      }).eq('id', data.video_id);

      // Also update details so user can see the full script
      await supabase.from('video_generation_details').insert({
        video_id: data.video_id,
        clip_data: clips,
        voiceover_script: voiceoverScript,
        settings_snapshot: {
          ...userSettings,
          is_preview: true,
          visual_hook: data.visual_hook || blueprint.visual_hook_instruction,
          script_hook: data.script_hook || blueprint.script_hook
        },
        strategy_used: blueprint.strategy_name,
        processing_started_at: new Date(startTime).toISOString(),
      });
      return;
    }

    await supabase.from('videos').update({ processing_status_text: 'Assembling video...' }).eq('id', data.video_id);
    console.log(`[${data.video_id}] 🧱 ASSEMBLY: Starting stage 1 assembly...`);
    const assemblyTransformationUrl = clients.cloudinary.assembleVideo(
      clips.map(c => c.clip_url), voiceoverUpload.secure_url, musicUrl, clips.length * 5, userSettings.default_music_volume_db
    );
    const stage1Result = await clients.cloudinary.uploadVideoFromUrl(assemblyTransformationUrl, `stage1_assembly_${data.video_id}_${Date.now()}`);
    const currentVideoUrl = stage1Result.secure_url;
    console.log(`[${data.video_id}] 🧱 ASSEMBLY: STAGE 1 COMPLETE: ${currentVideoUrl}`);

    let zapCapTaskId = null;
    let zapCapVideoId = null;

    /*
    if (userSettings.caption_enabled && userSettings.caption_system === 'zapcap') {
      console.log(`[${data.video_id}] 🧱 ASSEMBLY: Sending to ZapCap...`);
      await supabase.from('videos').update({
        processing_status_text: 'Generating captions...',
        video_url: currentVideoUrl
      }).eq('id', data.video_id);

      const zc = await clients.zapcap.createCaptionTask(currentVideoUrl, captionTemplateId);
      zapCapTaskId = zc.taskId;
      zapCapVideoId = zc.videoId;
      console.log(`[${data.video_id}] 🚀 ZAPCAP SUBMITTED: Task ID ${zapCapTaskId}, Video ID ${zapCapVideoId}`);
    }
    */
    console.log(`[${data.video_id}] 🛑 ZAPCAP DISABLED BY USER REQUEST (Saving credits)`);

    const captionData = {
      template_id: captionTemplateId,
      transcript: '',
      zapcap_task_id: zapCapTaskId,
      zapcap_video_id: zapCapVideoId,
      stage1_url: currentVideoUrl
    };

    const { error: dbError } = await supabase.from('video_generation_details').insert({
      video_id: data.video_id,
      clip_data: clips,
      voiceover_script: voiceoverScript,
      voiceover_url: voiceoverUpload.secure_url,
      music_url: musicUrl,
      music_source: musicSource,
      caption_data: captionData,
      settings_snapshot: {
        ...userSettings,
        visual_hook: data.visual_hook || blueprint.visual_hook_instruction,
        script_hook: data.script_hook || blueprint.script_hook,
        property_type: data.property_type,
        property_data: data.property_data
      },
      strategy_used: blueprint.strategy_name,
      processing_started_at: new Date(startTime).toISOString(),
    });

    if (dbError) console.error('DB Insert Error:', dbError);

    if (zapCapTaskId) {
      console.log(`[${data.video_id}] ⏳ Triggering recursive polling...`);
      await invokeSelf({
        mode: 'zapcap_poll',
        video_id: data.video_id,
        zapcap_task_id: zapCapTaskId,
        zapcap_video_id: zapCapVideoId,
        stage1_url: currentVideoUrl,
        original_request_data: data
      }, functionUrl, authToken);

    } else {
      await supabase.from('videos').update({
        status: 'ready',
        video_url: currentVideoUrl,
        thumbnail_url: clips[0]?.first_image_url || null,
        duration_seconds: clips.length * 5,
        updated_at: new Date().toISOString()
      }).eq('id', data.video_id);
    }

  } catch (error) {
    console.error(`[${data.video_id}] Fatal Error in Start Phase:`, error);
    await supabase.from('videos').update({ status: 'failed', error_text: (error as any).message }).eq('id', data.video_id);
  }
}

async function handleZapCapPoll(payload: any, functionUrl: string, authToken: string) {
  const { video_id, zapcap_task_id, zapcap_video_id } = payload;
  const supabase = createClient(API_ENDPOINTS.supabase.url, API_ENDPOINTS.supabase.serviceRoleKey);
  const clients = initClients();

  console.log(`[${video_id}] 📡 Polling ZapCap Task: ${zapcap_task_id}`);

  const { data: details } = await supabase.from('video_generation_details').select('*').eq('video_id', video_id).single();
  if (!details) { console.error('Details not found'); return; }

  const voiceoverScript = details.voiceover_script;
  const MAX_TIME_MS = 50000;
  const START_TIME = Date.now();
  const POLL_INTERVAL = 10000;
  let isDone = false;

  while (Date.now() - START_TIME < MAX_TIME_MS) {
    try {
      const status = await clients.zapcap.getTaskStatus(zapcap_video_id, zapcap_task_id);
      if (status.status === 'failed') throw new Error('ZapCap task failed');

      const currentCaptionData = details.caption_data || {};
      if (!currentCaptionData.corrections_made) {
        try {
          const transcriptRes = await clients.zapcap.getTranscript(zapcap_video_id, zapcap_task_id);
          if (transcriptRes && transcriptRes.text) {
            const corrected = await clients.openai.correctTranscript(transcriptRes.text, voiceoverScript);
            await clients.zapcap.updateTranscript(zapcap_video_id, zapcap_task_id, corrected, transcriptRes.raw);
            await clients.zapcap.approveTranscript(zapcap_video_id, zapcap_task_id);
            currentCaptionData.corrections_made = true;
            await supabase.from('video_generation_details').update({ caption_data: currentCaptionData }).eq('video_id', video_id);
          }
        } catch (e: any) { if (!e.message?.includes('404')) console.warn('Transcript error', e); }
      }

      const finalUrl = status.downloadUrl || status.video_url;
      if (status.status === 'completed' && finalUrl) {
        const stage2Result = await clients.cloudinary.uploadVideoFromUrl(finalUrl, `stage2_zapcap_${video_id}_${Date.now()}`);
        let currentVideoUrl = stage2Result.secure_url;

        let finalVideoWithLogo = currentVideoUrl;
        const userSettings = details.settings_snapshot;
        if (userSettings && userSettings.logo_url) {
          try {
            const logoTransformationUrl = clients.cloudinary.addLogoOverlay(currentVideoUrl, userSettings.logo_url, userSettings.logo_position || 'corner_top_right', userSettings.logo_size_percent || 15);
            if (logoTransformationUrl !== currentVideoUrl) {
              const stage3Result = await clients.cloudinary.uploadVideoFromUrl(logoTransformationUrl, `final_video_${video_id}_${Date.now()}`);
              finalVideoWithLogo = stage3Result.secure_url;
            }
          } catch (e) { console.error('Logo failed', e); }
        }

        await supabase.from('videos').update({ status: 'ready', video_url: finalVideoWithLogo, updated_at: new Date().toISOString() }).eq('id', video_id);
        isDone = true;
        break;
      }
    } catch (error) { console.error('Poll Error', error); }
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }

  if (!isDone) await invokeSelf(payload, functionUrl, authToken);
}

async function invokeSelf(payload: any, passedUrl: string, authToken: string) {
  try {
    const projectUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const functionUrl = projectUrl ? `${projectUrl}/functions/v1/process-video-generation` : passedUrl;
    const token = serviceKey ? `Bearer ${serviceKey}` : authToken;
    await fetch(functionUrl, { method: 'POST', headers: { 'Authorization': token, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (e) { console.error('Invoke self failed', e); }
}

async function prepareClip(
  slot: any,
  index: number,
  data: VideoGenerationRequest,
  clients: any,
  blueprint: VideoBlueprint | null
): Promise<ClipData> {
  console.log(`[${data.video_id}] Preparing clip ${index + 1}...`);
  const isKeyframe = slot.images.length > 1;
  const firstImage = slot.images[0];
  const secondImage = isKeyframe ? slot.images[1] : null;

  const firstImageUpload = await clients.cloudinary.uploadImage(firstImage.data, firstImage.name);
  let secondImageUpload: any = null;
  if (secondImage) secondImageUpload = await clients.cloudinary.uploadImage(secondImage.data, secondImage.name);

  let startUrl = firstImageUpload.secure_url;
  let endUrl = secondImageUpload?.secure_url || null;
  let usedInstruction = '';

  const PRESET_HOOKS: Record<string, string> = {
    "Start with Blur": "Apply heavy gaussian blur to the entire image while keeping colors vibrant. The result must be a high-quality blurred version of this specific room.",
    "Agent Fail": "Add a professional real estate agent standing in the center of the room, professional attire.",
    "Empty to Furnished": "Virtually stage this room with high-end modern furniture, luxury rugs, and ambient lighting. Maintain the same floor and wall structure.",
    "Furnished to Empty": "Completely remove all furniture, rugs, and decor from this room. Show only the empty architectural shell, clean floors, and bare walls.",
    "Labubu": "Add a giant 3D Labubu toy mascot character standing in the center of the room. High detail, matching lighting.",
    "Sketch": "Transform this photo into an artistic pencil sketch / architectural drawing. High contrast, graphite texture.",
    "Low Battery": "Overlay a realistic iPhone 'Low Battery' warning popup (20% remaining) centered on the image."
  };

  if (index === 0 && blueprint && blueprint.visual_hook_type === 'motion') {
    const rawHook = data.visual_hook || blueprint.visual_hook_instruction;
    const mappedInstruction = PRESET_HOOKS[rawHook as keyof typeof PRESET_HOOKS] || rawHook;

    console.log(`[${data.video_id}] 🎨 VISUAL HOOK LOGIC: Raw="${rawHook}"`);

    try {
      if (rawHook === 'Start with Blur') {
        const blurredUrl = await clients.kie.editImage(startUrl, mappedInstruction);
        endUrl = endUrl || startUrl;
        startUrl = blurredUrl;
        usedInstruction = "Blurred start frame transition to clear original";
      } else if (rawHook === 'Agent Fail') {
        console.log(`[${data.video_id}] 🎭 MULTI-STEP: Processing Agent Fail with cross-frame consistency...`);
        const prompt1 = "Insert a professional real estate agent standing in the center of the room, professional attire, full body, clear face.";
        const optimizedPrompt1 = await clients.openai.optimizeImagePrompt(prompt1);
        console.log(`[${data.video_id}] 🎨 Kie Pass 1 (Standing): ${optimizedPrompt1}`);
        const standingAgentUrl = await clients.kie.editImage(startUrl, optimizedPrompt1);

        const prompt2 = "Insert the exact same person from the reference image, but now they are tripping and falling on the floor in the center of the room. Comical, shocked expression.";
        const optimizedPrompt2 = await clients.openai.optimizeImagePrompt(prompt2);
        const targetCanvas = endUrl || startUrl;
        console.log(`[${data.video_id}] 🎨 Kie Pass 2 (Falling): "${optimizedPrompt2}"`);

        const fallingAgentUrl = await clients.kie.editImage(
          targetCanvas,
          optimizedPrompt2,
          undefined,
          standingAgentUrl
        );

        startUrl = standingAgentUrl;
        endUrl = fallingAgentUrl;
        usedInstruction = "Agent standing (Frame 1) to agent falling (Frame 2) sequence";
      } else {
        // Broaden motion detection to catch camera-only instructions
        const motionKeywords = [
          'walk', 'walking', 'move', 'moving', 'pan', 'panning', 'zoom', 'zooming',
          'camera', 'view', 'showcasing', 'revealing', 'tour', 'first-person', 'pov',
          'open', 'opening', 'door', 'entrance', 'fly', 'flying', 'glide', 'gliding',
          'reveal'
        ];
        const lowerHook = rawHook.toLowerCase();
        const isActuallyMotion = motionKeywords.some(k => lowerHook.includes(k));

        if (isActuallyMotion && !PRESET_HOOKS[rawHook]) {
          console.log(`[${data.video_id}] ⏩ HOOK IS CAMERA MOTION ("${rawHook}"). Routing to KLING, skipping Image Edit.`);
          endUrl = endUrl || startUrl;
          usedInstruction = rawHook;
        } else {
          const targetForEdit = endUrl || startUrl;
          console.log(`[${data.video_id}] 🎨 SENDING TO IMAGE EDITOR (Kie.ai): "${mappedInstruction}"`);
          const editedImageUrl = await clients.kie.editImage(targetForEdit, mappedInstruction, data.visual_hook);
          endUrl = editedImageUrl;
          usedInstruction = `Image Edit Context: ${rawHook}`;
        }
      }
    } catch (e) {
      console.error(`[${data.video_id}] Visual Hook Failed:`, e);
    }
  }

  const promptSystemInstruction = getCinematicPrompt(usedInstruction);

  const visionAnalysis = await clients.openai.analyzeImagesForVideo(
    startUrl,
    endUrl,
    promptSystemInstruction
  );

  console.log(`[${data.video_id}] 🚀 [KLING-ENGAGED] Submitting to Kling 2.1 Pro via Kie.ai Client...`);

  // Kling generation (waits for completion)
  const klingVideoUrl = await clients.kie.generateVideo(
    visionAnalysis.luma_prompt,
    startUrl,
    endUrl
  );

  return {
    slot_index: index,
    luma_generation_id: 'LEGACY_COMPAT_ID',
    luma_prompt: visionAnalysis.luma_prompt,
    clip_url: klingVideoUrl,
    first_image_url: startUrl,
    second_image_url: endUrl,
    is_keyframe: !!endUrl,
    description: visionAnalysis.description,
    mood: visionAnalysis.mood,
  };
}

async function finishClip(clipData: ClipData, index: number, data: VideoGenerationRequest, clients: any): Promise<ClipData> {
  // Kling generation already happened.
  if (!clipData.clip_url) {
    console.error(`[${data.video_id}] Clip ${index} has no URL!`);
    return clipData;
  }

  // Upload to Cloudinary
  const cloudinaryUpload = await clients.cloudinary.uploadVideo(clipData.clip_url, `clip_${data.video_id}_${index}.mp4`);
  return { ...clipData, clip_url: cloudinaryUpload.secure_url };
}

function getCinematicPrompt(extraInstruction: string = ""): string {
  const instructionBlock = extraInstruction ? `\n\nCRITICAL OVERRIDE / VISUAL HOOK INSTRUCTION:\nThe user has specified a mandatory visual hook/motion: "${extraInstruction}".\nYOU MUST INCORPORATE THIS into 'luma_prompt'. If it describes a camera motion (e.g. "POV walk"), use the closest matching Allowed Motion (e.g. Push In or Move) and describe that action in Sentence A.` : "";

  return 'You generate a compact control prompt for High-Fidelity AI Video Model (Kling Pro) from 1 or 2 property images(keyframes).\nReturn ONLY the JSON fields: is_keyframe, description, luma_prompt, mood.' + instructionBlock + '\n\nALLOWED CAMERA MOTIONS(choose EXACTLY one token, verbatim)\nStatic | Move Left | Move Right | Move Up | Move Down | Push In | Pull Out | Zoom In | Zoom Out | Pan Left | Pan Right | Orbit Left | Orbit Right | Crane Up | Crane Down\n\n1) ANALYZE IMAGES(do not output this analysis)\n- Room type & scale(tight / medium / wide).Lighting(bright daylight / warm indoor / mixed / evening).\n- Stable parallax anchors: window wall, balcony doors, columns, beams, skylight, staircase, kitchen island, long sofa, media wall, floor pattern.\n- Edits / themes / hooks actually visible: balloons / confetti / seasonal decor; mascot / large toy; signage / text overlay; 3D room "cube on white"; added furniture; renovation deltas.\n- Actors / people: none | only frame 1 | only frame 2 | present in both(note if positions differ).\n- Frame relation: ONE_IMAGE | SAME_SPACE | ADJACENT_VIEW | DIFFERENT_ROOM | CUBE_START.\n\n2) CAMERA MOTION SELECTION(pick ONE from the list)\n  - Prefer Push In / Move Left / Move Right / Pan Left / Pan Right for tight interiors.\n- Allow Orbit / Crane / Pull Out / Zoom Out only in large / open spaces or exteriors where "out-painting" is safer.\n- If any actors visible, downshift to Push In / Move / Pan.\n- CRITICAL: If using "Zoom Out" or "Pull Out", you MUST include "stable geometry preservation" and "gradual lens expansion" to prevent sliding artifacts.\n- Use Static only if artifacts demand it.\n\nPROFESSIONAL CAMERA LANGUAGE REQUIREMENT:\n' +
    'ALWAYS use professional cinematography descriptors:\n- Movement quality: "glides smoothly", "sweeps gradually", "tracks steadily", "dollies fluidly", "pans gracefully"\n' +
    '- Reveal verbs: "revealing", "showcasing", "highlighting", "unveiling"(NEVER "explore", "past" alone)\n' +
    '- Motion quality: "with cinematic parallax", "with fluid motion", "with smooth acceleration"\n' +
    '- Easing: "starts gently and accelerates" or "eases into motion" when space allows\n\n' +
    '3) COMPOSE luma_prompt AS TWO SHORT SENTENCES(total 20–30 words)\n' +
    'Sentence A(professional cinematography + space):\n- Start with the chosen CAMERA MOTION token(exact text), followed by a colon.\n- Add professional movement descriptor: "camera glides smoothly", "camera sweeps gradually", "camera tracks steadily", "camera dollies fluidly"\n' +
    '- Add 1–2 spatial anchors using cinematic language:\n- Use "gliding alongside"(NOT "past" or "along" alone)\n- Use "sweeping across" or "tracking through"(NOT bare prepositions)\n' +
    '- Use "revealing [feature]" or "showcasing [detail]"(NOT "exploring")\n' +
    '- Examples: "camera glides smoothly alongside window wall, revealing dining area"\n' +
    '"camera tracks steadily from media wall, showcasing architectural flow"\n' +
    '"camera sweeps gradually across living space, highlighting natural light"\n' +
    '- Add motion quality descriptor: "with cinematic parallax", "with fluid spatial flow", "with smooth acceleration"\n' +
    '- Add ONE relation clause:\n– ONE_IMAGE: "smoothly revealing [architectural feature]" or "gradually showcasing [spatial detail]"\n' +
    '– SAME_SPACE: "fluid transition with cinematic parallax; seamless geometry preservation; avoid dissolve"\n' +
    '– ADJACENT_VIEW: "professional camera movement connecting views; maintain spatial continuity; avoid dissolve"\n' +
    '– DIFFERENT_ROOM: "smooth cinematic transition into second space; professional match-cut; no dissolve"\n' +
    '– CUBE_START: "cinematic push from exterior into interior; smooth acceleration; maintain motion flow"\n\n' +
    'Sentence B(include ONLY what applies; keep compact):\n' +
    '- Actors:\n– only frame 1 → "character remains first frame only; exits naturally; no rapid motion."\n' +
    '– only frame 2 → "character enters naturally in second frame; minimal motion."\n' +
    '– in both → "characters hold still (blinks okay); no rapid movement; maintain identity."\n– none → "no people."\n' +
    '- Hooks / themes / props(ONLY IF SALIENT): mention category - level only(e.g., "balloons", "seasonal decor", "signage") when visually central or ≳15 % of frame; otherwise do NOT mention.\n' +
    '– Use ONE simple verb: drift / settle / appear / clear / pop softly.\n' +
    '- Small decor(frames, plants, small plush / toys, table items): remain static and SHOULD NOT be mentioned.\n' +
    '- Furnishing change: choose ONE → "furniture appears naturally" OR "furniture clears naturally."\n' +
    '- End Sentence B with lighting and ONE mood word(from the whitelist below).\n\n' +
    'PROFESSIONAL CAMERA EXAMPLES(use this language style):\n✅ "Move Right: camera glides smoothly alongside media wall, revealing dining area with cinematic parallax; seamless spatial transition. No people. Bright daylight, cozy."\n✅ "Push In: camera dollies forward steadily toward window, showcasing panoramic views with smooth acceleration. No people. Natural lighting, elegant."\n✅ "Pan Left: camera sweeps gradually across living space, highlighting architectural features with fluid motion. No people. Warm lighting, sophisticated."\n✅ "Static: camera holds steady at window wall, smoothly revealing seating arrangement in natural light. No people. Bright lighting, spacious."\n\n' +
    '❌ AVOID these(sounds like walking / handheld):\n❌ "Move Right past media wall and dining table"\n❌ "explore seating arrangement"\n❌ "along window wall"(without "gliding" or "smoothly")\n❌ "over geometric floor"(without smooth descriptor)\n\n' +
    '4) COMPOSE description(STRICT PROPERTY - ONLY, 12–18 words)\n' +
    '- Include ONLY architectural / permanent features and natural lighting: layout & room type; windows / doors / balcony; beams / coffers / skylight; built - ins / cabinetry / media wall; fixed kitchen / bath items; flooring material / pattern; view; lighting as observed.\n' +
    '- EXCLUDE everything movable or likely edited: people / actors; balloons / confetti / themes; loose furniture / decor; rugs; plants; tableware; toys; signage / text overlays; staged props.\n' +
    '- If two images, favor features present in BOTH; if unsure a feature is permanent, omit it.\n' +
    '- Friendly marketing tone.\n\n' +
    '5) FINAL SELF - CHECK BEFORE OUTPUT\n' +
    '- luma_prompt begins with a valid motion token followed by colon; total ≤ 30 words.\n' +
    '- luma_prompt includes PROFESSIONAL CAMERA LANGUAGE: "glides/sweeps/tracks/dollies/smoothly/gradually/fluidly"\n' +
    '- luma_prompt uses CINEMATIC REVEAL VERBS: "revealing/showcasing/highlighting"(NOT "past/explore/along" alone)\n' +
    '- Movement includes quality descriptor: "with cinematic parallax", "with fluid motion", "with smooth acceleration"\n' +
    '- If is_keyframe = true and "avoid dissolve" is missing, add it to Sentence A.\n' +
    '- If any actors detected and motion is Orbit / Crane / Pull Out / Zoom, downgrade to Push In.\n' +
    '- luma_prompt contains no tiny - prop nouns; use category - level only when salient(≥15 % frame).\n' +
    '- description contains NO people / props / themes / staging words(property - only).\n' +
    '- NO WALKING LANGUAGE: verify no "past", "explore", or bare "along" / "over" without smooth descriptors\n\n' +
    '6) OUTPUT FORMAT(Return ONLY a JSON object.No ```json blocks or additional text )\n{\n  "is_keyframe": boolean,\n  "description": "property-only, 12–18 words",\n  "luma_prompt": "two sentences, 20–30 words, using professional cinematography language",\n  "mood": "luxury|modern|elegant|cozy|upbeat|calm|sophisticated|contemporary|warm|bright|minimalist|spacious|intimate|professional|stylish|chic|serene|energetic|ambient|classic|urban|trendy"\n}';
}
