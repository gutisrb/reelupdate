// Main Video Generation Edge Function
// Replaces Make.com workflow

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
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

      if (payload.mode === 'kling_poll') {
        console.log(`[${payload.video_id}] 🔄 RESUMING: Recursive polling for Kling Videos`);
        // @ts-ignore
        EdgeRuntime.waitUntil(
          handleKlingPoll(payload, req.url, req.headers.get('Authorization') || '')
        );
        return new Response(JSON.stringify({ ok: true, message: 'Kling polling resumed' }), {
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
    const visualHookRaw = formData.get('visual_hook') as string | null;

    console.log(`[${videoId}] 📥 INPUT: visual_hook="${visualHookRaw}"`);

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
      const clipInitiations = slotsToProcess.map((slot, index) =>
        initiateClip(slot, index, data, clients, index === 0 ? blueprint : null)
      );
      clips = await Promise.all(clipInitiations);
      console.log(`[${data.video_id}] 🚀 CLIPS INITIATED (${clips.length} tasks started)`);
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
      const visualContext = clips.map(c => `${c.description || 'Prostor'} (${c.luma_prompt})`).join('; ');

      // Inject Script Hook via Extras
      const hookText = blueprint.script_hook && blueprint.script_hook !== 'undefined'
        ? `[IMPORTANT: START SCRIPT WITH THIS EXACT HOOK: "${blueprint.script_hook}"] `
        : '';

      const hookedPropertyData = {
        ...data.property_data,
        extras: `${hookText}${data.property_data.extras}`
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

    // 5. SAVE INTERMEDIATE STATE & HAND OFF TO POLLER
    const detailsPayload = {
      video_id: data.video_id,
      clip_data: clips,
      voiceover_script: voiceoverScript,
      voiceover_url: voiceoverUpload.secure_url,
      music_url: musicUrl,
      music_source: musicSource,
      caption_data: {},
      settings_snapshot: {
        ...userSettings,
        visual_hook: data.visual_hook || blueprint.visual_hook_instruction,
        script_hook: data.script_hook || blueprint.script_hook,
        property_type: data.property_type,
        property_data: data.property_data,
        is_preview: isPreview
      },
      strategy_used: blueprint.strategy_name,
      processing_started_at: new Date(startTime).toISOString(),
    };

    const { error: dbError } = await supabase.from('video_generation_details').insert(detailsPayload);
    if (dbError) console.error('DB Insert Error:', dbError);

    console.log(`[${data.video_id}] 📡 Handing off to handleKlingPoll...`);
    await invokeSelf({
      mode: 'kling_poll',
      video_id: data.video_id,
      original_request_data: data
    }, functionUrl, authToken);

  } catch (error) {
    console.error(`[${data.video_id}] Fatal Error in Start Phase:`, error);
    await supabase.from('videos').update({ status: 'failed', error_text: (error as any).message }).eq('id', data.video_id);
  }
}

async function handleKlingPoll(payload: any, functionUrl: string, authToken: string) {
  const { video_id } = payload;
  const supabase = createClient(API_ENDPOINTS.supabase.url, API_ENDPOINTS.supabase.serviceRoleKey);
  const clients = initClients();

  console.log(`[${video_id}] 📡 Polling Kling Tasks...`);

  const { data: details, error: detailsError } = await supabase.from('video_generation_details').select('*').eq('video_id', video_id).single();
  if (detailsError || !details) {
    console.error(`[${video_id}] Details not found or error:`, detailsError);
    return;
  }

  const clips: ClipData[] = details.clip_data || [];
  const MAX_TIME_MS = 100000; // 100 seconds
  const START_TIME = Date.now();
  const POLL_INTERVAL = 5000;

  let allClipsDone = false;
  let updatedSomething = false;

  while (Date.now() - START_TIME < MAX_TIME_MS) {
    let pendingCount = 0;
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      if (!clip) continue;

      const taskIds = clip.kling_task_ids || (clip.kling_task_id ? [clip.kling_task_id] : []);
      if (taskIds.length === 0) continue;

      // If clip_url is set (for single task) or clip_urls is full (for multi task), it's done
      if (clip.clip_url || (clip.clip_urls && clip.clip_urls.length === taskIds.length && taskIds.length > 0)) {
        continue;
      }

      pendingCount++;
      clip.clip_urls = clip.clip_urls || [];

      for (const taskId of taskIds) {
        if (!taskId) continue;
        // Skip if this specific task is already done
        if (clip.clip_urls?.some((url: string) => url.includes(taskId))) continue;

        try {
          const finalUrl = await clients.kie.waitForCompletionPollingOnce(taskId);
          if (finalUrl) {
            console.log(`[${video_id}] Task ${taskId} for Clip ${i} ready! Uploading to Cloudinary...`);
            const cloudinaryUpload = await clients.cloudinary.uploadVideo(finalUrl, `clip_${video_id}_${i}_${taskId}.mp4`);

            if (taskIds.length === 1) {
              clip.clip_url = cloudinaryUpload.secure_url;
            } else {
              clip.clip_urls?.push(cloudinaryUpload.secure_url);
            }
            updatedSomething = true;
          }
        } catch (e: any) {
          console.error(`[${video_id}] Task ${taskId} check failed:`, e.message);
        }
      }
    }

    if (pendingCount === 0) {
      allClipsDone = true;
      break;
    }

    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }

  if (updatedSomething) {
    await supabase.from('video_generation_details').update({ clip_data: clips }).eq('video_id', video_id);
  }

  if (!allClipsDone) {
    console.log(`[${video_id}] 🔄 Kling still pending. Re-invoking poller...`);
    await invokeSelf({ mode: 'kling_poll', video_id }, functionUrl, authToken);
    return;
  }

  // ALL CLIPS READY -> FINALIZE
  const userSettings = details.settings_snapshot;
  const isPreview = userSettings?.is_preview;
  const voiceoverUrl = details.voiceover_url;
  const musicUrl = details.music_url;

  if (isPreview) {
    console.log(`[${video_id}] 🏁 Finalizing PREVIEW video...`);
    await supabase.from('videos').update({
      status: 'ready',
      video_url: clips[0].clip_url,
      thumbnail_url: clips[0]?.first_image_url || null,
      duration_seconds: 5,
      title: `[PREVIEW] ${(details.voiceover_script || '').substring(0, 50)}...`,
      updated_at: new Date().toISOString()
    }).eq('id', video_id);
  } else {
    console.log(`[${video_id}] 🧱 ASSEMBLY: Starting assembly...`);
    await supabase.from('videos').update({ processing_status_text: 'Assembling video...' }).eq('id', video_id);

    // Flatten all URLs from all clips
    const allClipUrls: string[] = [];
    for (const clip of clips) {
      if (clip.clip_url) {
        allClipUrls.push(clip.clip_url);
      } else if (clip.clip_urls) {
        allClipUrls.push(...clip.clip_urls);
      }
    }

    // Assemble (Stages 1: Cloudinary Native Assembly)
    const assemblyUrl = clients.cloudinary.assembleVideo(
      allClipUrls,
      voiceoverUrl || '',
      musicUrl || '',
      allClipUrls.length * 5,
      userSettings?.default_music_volume_db ?? -60
    );

    const stage1Result = await clients.cloudinary.uploadVideoFromUrl(assemblyUrl, `stage1_assembly_${video_id}_${Date.now()}`);
    const currentVideoUrl = stage1Result.secure_url;

    if (userSettings.caption_enabled && userSettings.caption_system === 'zapcap') {
      console.log(`[${video_id}] 🧱 ASSEMBLY: Sending to ZapCap...`);
      await supabase.from('videos').update({
        processing_status_text: 'Generating captions...',
        video_url: currentVideoUrl
      }).eq('id', video_id);

      const zc = await clients.zapcap.createCaptionTask(currentVideoUrl, userSettings?.caption_template_id || '');
      await supabase.from('video_generation_details').update({
        caption_data: {
          zapcap_task_id: zc.taskId,
          zapcap_video_id: zc.videoId,
          corrections_made: false,
          stage1_url: currentVideoUrl
        }
      }).eq('video_id', video_id);

      await invokeSelf({
        mode: 'zapcap_poll',
        video_id,
        zapcap_task_id: zc.taskId,
        zapcap_video_id: zc.videoId,
        stage1_url: currentVideoUrl
      }, functionUrl, authToken);
    } else {
      // Default logo overlay
      let finalVideo = currentVideoUrl;
      if (userSettings.logo_url) {
        try {
          const transformed = clients.cloudinary.addLogoOverlay(currentVideoUrl, userSettings.logo_url, userSettings.logo_position, userSettings.logo_size_percent);
          const stage3 = await clients.cloudinary.uploadVideoFromUrl(transformed, `final_video_${video_id}`);
          finalVideo = stage3.secure_url;
        } catch (e) { console.error('Logo overlay failed', e); }
      }

      await supabase.from('videos').update({
        status: 'ready',
        video_url: finalVideo,
        thumbnail_url: clips[0]?.first_image_url || null,
        duration_seconds: clips.length * 5,
        updated_at: new Date().toISOString()
      }).eq('id', video_id);
    }
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
    const projectUrl = API_ENDPOINTS.supabase.url;
    const serviceKey = API_ENDPOINTS.supabase.serviceRoleKey;
    const functionUrl = projectUrl ? `${projectUrl}/functions/v1/process-video-generation` : passedUrl;
    const token = serviceKey ? `Bearer ${serviceKey}` : authToken;
    await fetch(functionUrl, { method: 'POST', headers: { 'Authorization': token, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (e) { console.error('Invoke self failed', e); }
}

async function initiateClip(
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
    "Empty to Furnished": "Virtually stage this room normally and intuitively. Realistic and aesthetic result.",
    "Furnished to Empty": "Completely remove all furniture, rugs, and decor from this room. Show only the empty architectural shell, clean floors, and bare walls. Professional and clean result.",
    "Labubu": "Add a giant 3D Labubu toy mascot character standing in the center of the room. High detail, matching lighting.",
    "Sketch": "Transform this photo into an artistic pencil sketch / architectural drawing. High contrast, graphite texture.",
    "Low Battery": "Overlay a realistic iPhone 'Low Battery' warning popup (20% remaining) centered on the image."
  };

  const isPreview = data.is_preview === true;

  if (index === 0 && blueprint && blueprint.visual_hook_type === 'motion') {
    const normalizedHook = (data.visual_hook || blueprint.visual_hook_instruction || "").trim();
    const PRESET_KEYS = Object.keys(PRESET_HOOKS);
    const matchedKey = PRESET_KEYS.find(k => k.toLowerCase() === normalizedHook.toLowerCase());
    const rawHook = matchedKey || normalizedHook;
    const mappedInstruction = PRESET_HOOKS[rawHook as keyof typeof PRESET_HOOKS] || rawHook;

    console.log(`[${data.video_id}] 🎨 VISUAL HOOK LOGIC: Raw="${normalizedHook}" Matched="${rawHook}" (Preview: ${isPreview})`);

    try {
      if (rawHook === 'Start with Blur') {
        const blurredUrl = isPreview ? startUrl : await clients.kie.editImage(startUrl, mappedInstruction);
        endUrl = endUrl || startUrl;
        startUrl = blurredUrl;
        usedInstruction = "Blurred start frame transition to clear original";
      } else if (rawHook === 'Agent Fail') {
        console.log(`[${data.video_id}] 🎭 AGENT FAIL: Switch to single-pass logic for more realistic physics...`);
        const prompt1 = "Professional real estate agent standing in the foreground, close to the camera, facing camera, professional business attire, full body, friendly smile, clear face.";
        const optimizedPrompt1 = await clients.google.optimizeImagePrompt(prompt1);
        console.log(`[${data.video_id}] 🎨 Kie Pass 1 (Standing Close): ${optimizedPrompt1}`);
        const standingAgentUrl = isPreview ? startUrl : await clients.kie.editImage(startUrl, optimizedPrompt1);

        // We use the standing agent for both frames (or just as the base) 
        // to let the video AI (Kling) animate the limbs and gravity without morphing artifacts.
        startUrl = standingAgentUrl;
        endUrl = standingAgentUrl;
        usedInstruction = "AGENT_SLIP: character unexpectedly trips and falls to the floor; comical and surprising; high-speed limbs movement; character stays in context then drops";
      } else if (rawHook === 'Empty to Furnished' || rawHook === 'Furnished to Empty') {
        const targetForEdit = endUrl || startUrl;
        console.log(`[${data.video_id}] 🎨 SENDING TO IMAGE EDITOR (Kie.ai): "${mappedInstruction}"`);
        const editedImageUrl = isPreview ? targetForEdit : await clients.kie.editImage(targetForEdit, mappedInstruction);
        endUrl = editedImageUrl;
        usedInstruction = rawHook === 'Empty to Furnished' ? "STAGING_APPEAR: furniture appears naturally in room" : "STAGING_CLEAR: furniture clears naturally from room";
      } else if (rawHook === 'Labubu') {
        const editedImageUrl = isPreview ? startUrl : await clients.kie.editImage(startUrl, mappedInstruction);
        // Apply to START frame as requested by user ("Labubu should be in the start frame")
        startUrl = editedImageUrl;
        // Keep endUrl null (or whatever it was) so we just animate the scene with Labubu present
        usedInstruction = "PROP_REVEAL: Labubu mascot character present in room; maintain identity";
      } else if (rawHook === 'Low Battery') {
        console.log(`[${data.video_id}] 🔋 LOW BATTERY: Applying Cloudinary overlay...`);
        // The user wants a specific "Low Battery" popup overlay on the first frame.
        // Format: l_low_battery_roilxt,w_0.8,o_100/fl_layer_apply,g_center
        const overlayTransform = "l_low_battery_roilxt,w_0.8,o_100/fl_layer_apply,g_center";

        // We inject the transformation after /upload/
        if (startUrl.includes('/upload/')) {
          const parts = startUrl.split('/upload/');
          const transformedStartUrl = `${parts[0]}/upload/${overlayTransform}/${parts[1]}`;
          endUrl = startUrl; // Original clean image as end frame
          startUrl = transformedStartUrl; // Overlay image as start frame
          usedInstruction = "LOW_BATTERY: The low battery warning popup is visible on screen then disappears";
          console.log(`[${data.video_id}] 🔋 LOW BATTERY: Transformed URL: ${startUrl}`);
        } else {
          console.warn(`[${data.video_id}] 🔋 LOW BATTERY: Could not apply overlay, invalid URL format: ${startUrl}`);
          usedInstruction = rawHook;
        }
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
          const editedImageUrl = isPreview ? targetForEdit : await clients.kie.editImage(targetForEdit, mappedInstruction, data.visual_hook);
          endUrl = editedImageUrl;
          usedInstruction = `Image Edit Context: ${rawHook}`;
        }
      }
    } catch (e) {
      console.error(`[${data.video_id}] Visual Hook Failed:`, e);
    }
  }

  // Force 9:16 aspect ratio via Cloudinary transformations
  const force916 = (url: string | null) => {
    if (!url || !url.includes('/upload/')) return url;
    const parts = url.split('/upload/');
    // ar_9:16,c_fill,g_auto,w_720 ensures vertical cropping
    return `${parts[0]}/upload/ar_9:16,c_fill,g_auto,w_720/${parts[1]}`;
  };

  const startUrl916 = force916(startUrl)!;
  const endUrl916 = force916(endUrl);

  const promptSystemInstruction = getCinematicPrompt(usedInstruction);

  const visionAnalysis = await clients.google.analyzeImagesForVideo(
    startUrl916,
    endUrl916,
    promptSystemInstruction
  );

  // DECISION: Correlated or Transition?
  const isCorrelated = visionAnalysis.is_correlated !== false; // Default to true if not specified

  // STANDARD LOGIC: Single task only (save credits)
  let finalPrompt = visionAnalysis.luma_prompt;
  let finalNegative = visionAnalysis.negative_prompt;

  if (isKeyframe && !isCorrelated) {
    console.log(`[${data.video_id}] ⚠️ UNCORRELATED IMAGES DETECTED: Using Flash Warp transition...`);
    const roomA = visionAnalysis.description.split(';')[0]?.trim() || "the current room";
    const roomB = visionAnalysis.description.split(';')[1]?.trim() || "the next space";
    finalPrompt = `Cinematic Flash Warp Transition. Start Frame: ${roomA}. End Frame: ${roomB}. The camera performs an extreme high-speed whip pan; the velocity causes the view to instantly streak into a flat horizontal motion blur; this wall of blur masks the replacement of A with B; zero geometry reconstruction between rooms; fluid motion, luxury quality.`;
    finalNegative = `hallway, new room, turning corner, floating geometry, doorway, portal, morphing faces, melting objects, ${visionAnalysis.negative_prompt}`;
  }

  // STANDARD LOGIC (Single task)
  const taskId = data.is_preview === true ? `preview_${index}` : await clients.kie.createVideoTask(
    finalPrompt,
    startUrl916,
    endUrl916,
    finalNegative
  );

  if (isPreview) {
    console.log(`[${data.video_id}] 🧪 PREVIEW MODE (Dry Run): Skipping Kling video generation...`);
    // Ensure visual hook is explicitly in the prompt even if AI missed it
    let previewLuma = finalPrompt;
    if (usedInstruction && !previewLuma.toLowerCase().includes(usedInstruction.split(':')[0].toLowerCase())) {
      previewLuma += ` ${usedInstruction}`;
    }

    return {
      slot_index: index,
      luma_generation_id: `preview_${index}`,
      kling_task_id: `preview_${index}`,
      luma_prompt: previewLuma,
      clip_url: 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1765287500/clip_7f7e06bb-39d0-4add-b358-ea333ade6a04_0_fmtela_iznuwx.mp4',
      first_image_url: startUrl916,
      second_image_url: endUrl916,
      is_keyframe: !!endUrl916,
      is_correlated: isCorrelated,
      description: visionAnalysis.description,
      mood: visionAnalysis.mood,
    };
  }

  return {
    slot_index: index,
    luma_generation_id: taskId,
    kling_task_id: taskId,
    luma_prompt: finalPrompt,
    clip_url: '',
    first_image_url: startUrl916,
    second_image_url: endUrl916,
    is_keyframe: !!endUrl916,
    is_correlated: isCorrelated,
    description: visionAnalysis.description,
    mood: visionAnalysis.mood,
  };
}

async function finishClip(clipData: ClipData, index: number, data: VideoGenerationRequest, clients: any): Promise<ClipData> {
  // Wait for Kling completion if we have a task ID
  let finalUrl = clipData.clip_url;

  if (!finalUrl && clipData.kling_task_id) {
    console.log(`[${data.video_id}] ⏳ Waiting for Kling Task ${clipData.kling_task_id} (Clip ${index})...`);
    finalUrl = await clients.kie.waitForCompletion(clipData.kling_task_id);
  }

  if (!finalUrl) {
    console.error(`[${data.video_id}] Clip ${index} has no URL!`);
    return clipData;
  }

  // Upload to Cloudinary
  const cloudinaryUpload = await clients.cloudinary.uploadVideo(finalUrl, `clip_${data.video_id}_${index}.mp4`);
  return { ...clipData, clip_url: cloudinaryUpload.secure_url };
}

function getCinematicPrompt(extraInstruction: string = ""): string {
  let hookContext = "";
  if (extraInstruction.includes("AGENT_SLIP")) {
    hookContext = "\n- EXTREME SURPRISE: The person unexpectedly slips and falls vertically. Match this with 'character slips and falls rapidly' in Sentence B. Sudden and reactive limbs.";
  } else if (extraInstruction.includes("STAGING")) {
    hookContext = `\n- RENOVATION: furniture ${extraInstruction.includes('APPEAR') ? 'appears naturally' : 'clears naturally'} in Sentence B.`;
  } else if (extraInstruction.includes("PROP_REVEAL")) {
    hookContext = "\n- MASCOT: Character 'bobs softly' or 'remains stable' in Sentence B.";
  }

  const instructionBlock = extraInstruction ? `\n\nCRITICAL: A mandatory visual hook ("${extraInstruction}") is active. 
DO NOT SACRIFICE PROPERTY DETAILS OR CAMERA MOTION for this hook.
- Sentence A MUST remain 100% focused on PROPERTY SHOWCASING (Camera + Anchors).
- The HOOK ACTION MUST be restricted to Sentence B as an additive layer.${hookContext}` : "";

  return `You generate a compact control prompt for High-Fidelity AI Video Model (Kling Pro) from 1 or 2 property images(keyframes).
Return ONLY the JSON fields: is_keyframe, is_correlated, description, luma_prompt, negative_prompt, mood.${instructionBlock}

ALLOWED CAMERA MOTIONS(choose EXACTLY one token, verbatim)
Static | Move Left | Move Right | Move Up | Move Down | Push In | Pull Out | Zoom In | Zoom Out | Pan Left | Pan Right | Orbit Left | Orbit Right | Crane Up | Crane Down

1) ANALYZE IMAGES
- Room type & scale. Lighting.
- Stable parallax anchors: window wall, balcony doors, columns, beams, skylight, staircase, kitchen island, long sofa, media wall, floor pattern.
- "Center Anchor": Identify the most prominent object/feature in the center of the frame (e.g. "red sofa", "kitchen island", "window").
- Visual hooks present: agent/actor, staging, balloons, mascot, text overlay.

2) DIFFERENCE ANALYSIS (CRITICAL - IF 2 IMAGES PROVIDED)
- Compare Image 1 (Start) vs Image 2 (End).
- DID THE CAMERA MOVE LATERALLY? (e.g. Wall X was on right, now on left) -> USE "Move Left" or "Move Right".
- DID THE CAMERA MOVE FORWARD? (e.g. Objects got larger but centered) -> USE "Push In".
- IGNORE your imagination. DEDUCE motion ONLY from the visible shift in pixels.
- VISUAL CORRELATION & MORPH SAFETY: Check if Image 1 and Image 2 share BASIC VISUAL OVERLAP (e.g. same room, similar furniture, or shared architecture). If they are FUNDAMENTALLY DIFFERENT (e.g. Kitchen vs Backyard), set is_correlated to false. For different angles of the same room, set is_correlated to true.

3) CAMERA MOTION SELECTION(pick ONE)
- FORCE the motion to match your Difference Analysis.
- "Zoom Out" requires safety keywords: "stable geometry preservation" and "gradual lens expansion".

4) COMPOSE luma_prompt AS TWO SHORT SENTENCES
Sentence A(PROPERTY SHOWCASE):
- Start with chosen CAMERA MOTION token, followed by a colon.
- DIRECTIONAL LOGIC (CRITICAL):
  * FOR PUSH IN / PULL OUT: Use "STRAIGHT toward [Center Anchor]" to lock the angle and prevent drift.
  * FOR MOVE/PAN LEFT/RIGHT: Use "PARALLEL to [Side Anchor]" or "ALONG the [Wall]" to prevent crashing into walls.
- NEVER use "STRAIGHT" for lateral moves (Move Left/Right) as it causes wall collisions.
- Add 1-2 architectural anchors: e.g. "alongside window wall", "toward media wall".
- MUST include quality clause: "revealing spatial flow with cinematic parallax" or "showcasing layout with fluid motion".
- ALWAYS conclude Sentence A with stability rule: "seamless geometry preservation; stay strictly within the visible 3D volume; avoid dissolve".

Sentence B(ADDITIVE ACTIONS & HOOKS):
- Actors: use "characters hold still" or describe the specific HOOK ACTION if active (e.g. "character slips and falls rapidly").
- Hooks: e.g., "balloons drift softly", "furniture appears naturally".
- Lighting & Mood: End with one mood word from whitelist.

GEOMETRY SAFETY RULES (CRITICAL):
- LOCK ON VISIBLE ANCHORS: Movement must be relative to objects VISIBLE in the start frame.
- NO IMAGINARY SPACES: NEVER describe entering a hallway or room that is not clearly visible.
- NO WALL CLIPPING: Camera must stay strictly within the visible 3D volume.

PROFESSIONAL EXAMPLES:
✅ "Push In: camera glides smoothly STRAIGHT toward the visible red sofa, showcasing architectural flow with cinematic parallax; seamless geometry preservation; stay strictly within the visible 3D volume; avoid dissolve. Character slips and falls rapidly; bright daylight, upbeat."
✅ "Move Right: camera tracks PARALLEL along the window wall, revealing natural light with fluid motion; seamless geometry preservation; stay strictly within the visible 3D volume; avoid dissolve. Furniture appears naturally; luxury."

5) COMPOSE description(PROPERTY-ONLY, 12-18 words)
- Architectural features only. EXCLUDE people, themes, or edited hooks.
- CRITICAL: IF 2 IMAGES ARE PROVIDED, you MUST describe BOTH rooms, separated by a semi-colon. Example: "Modern marble kitchen; Cozy blue bedroom".

6) GENERATE negative_prompt (ROBUST ANTI-HALLUCINATION)
- Must include: "moving walls, distorted geometry, morphing walls, sliding furniture, floating objects, sliding texture, disintegrating objects, new hallway, entering unseen room, passing through wall, blurry, shaky, low quality".

7) OUTPUT FORMAT(JSON only)
{
  "is_keyframe": boolean,
  "is_correlated": boolean,
  "description": "string",
  "luma_prompt": "string",
  "negative_prompt": "string",
  "mood": "luxury|modern|elegant|cozy|upbeat|calm|sophisticated|contemporary|warm|bright|minimalist|spacious|intimate|professional|stylish|chic|serene|energetic|ambient|classic|urban|trendy"
}`;
}
