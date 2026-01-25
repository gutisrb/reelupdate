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

    // Setup property data
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
      is_preview: formData.get('is_preview') === 'true',
      skip_video_generation: formData.get('skip_video_generation') === 'true'
    };

    // Initialize Supabase client
    const supabase = createClient(API_ENDPOINTS.supabase.url, API_ENDPOINTS.supabase.serviceRoleKey);
    const clients = initClients();

    // Check credits
    if (!data.skip_video_generation) {
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('video_credits_remaining').eq('id', data.user_id).single();
      if (profileError || !profileData || profileData.video_credits_remaining <= 0) {
        return new Response(JSON.stringify({ error: 'NO_VIDEO_CREDITS' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      await supabase.rpc('spend_video_credit', { p_user: data.user_id });
    } else {
      console.log(`[${data.video_id}] ⏩ Skipping credit deduction (Admin Mode)`);
    }

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

  } catch (error: any) {
    console.error('Request handling error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

// ==========================================
// PHASE 1: START (Heavy Lifting -> Poller)
// ==========================================
async function startVideoGeneration(data: VideoGenerationRequest, supabase: any, clients: any, functionUrl: string, authToken: string) {
  const startTime = Date.now();
  try {
    // GET USER SETTINGS
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

    // BLUEPRINT
    await supabase.from('videos').update({ processing_status_text: 'AI Director is designing strategy...' }).eq('id', data.video_id);

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
        primary: userSettings.caption_font_color,
        secondary: userSettings.caption_bg_color
      }
    };

    console.log(`[${data.video_id}] 🧠 AGENT DIRECTOR: Starting blueprint generation...`);
    const blueprint: VideoBlueprint = await clients.director.generateBlueprint(data.property_data, directorContext);

    if (data.script_hook && data.script_hook.trim().length > 0) {
      blueprint.script_hook = data.script_hook;
    }

    const isPreview = data.is_preview === true;
    let clips: ClipData[] = [];

    if (data.skip_video_generation) {
      console.log(`[${data.video_id}] ⏩ SKIPPING CLIP GENERATION (Audio Only Mode)`);
      clips = data.image_slots.map((_slot, i) => ({
        slot_index: i, luma_generation_id: 'skipped', luma_prompt: `Room ${i}`, clip_url: 'skipped',
        first_image_url: 'skipped', second_image_url: null, is_keyframe: false, description: 'skipped', mood: 'modern'
      }));
      if (data.image_slots.length > 0 && data.image_slots[0].images.length > 0) {
        try {
          const firstImg = data.image_slots[0].images[0];
          const upload = await clients.cloudinary.uploadImage(firstImg.data, firstImg.name);
          clips[0].first_image_url = upload.secure_url;
        } catch (e) { console.error('Thumbnail upload failed', e); }
      }
    } else {
      console.log(`[${data.video_id}] 🎬 CLIPS: Preparing clips...`);
      const slotsToProcess = isPreview ? [data.image_slots[0]] : data.image_slots;
      const clipInitiations = slotsToProcess.map((slot, index) =>
        initiateClip(slot, index, data, clients, index === 0 ? blueprint : null)
      );
      clips = await Promise.all(clipInitiations);
    }

    if (clips.length > 0 && clips[0].first_image_url) {
      await supabase.from('videos').update({ thumbnail_url: clips[0].first_image_url }).eq('id', data.video_id);
    }

    // SCRIPT
    await supabase.from('videos').update({ processing_status_text: 'Writing script...' }).eq('id', data.video_id);
    const visualContext = clips.map(c => c.luma_prompt).join('; ');
    const hookedPropertyData = {
      ...data.property_data,
      extras: `[IMPORTANT: START SCRIPT WITH THIS EXACT HOOK: "${blueprint.script_hook}"] ${data.property_data.extras}`
    };

    const voiceoverScript = await clients.google.generateVoiceoverScript(
      { ...hookedPropertyData, price_mention: data.price_mention },
      visualContext,
      clips.length * 5,
      blueprint.script_hook
    );
    console.log(`[${data.video_id}] 📜 SCRIPT: "${voiceoverScript}"`);

    let voiceoverUploadUrl = '';
    let musicUrl = '';

    if (!isPreview) {
      await supabase.from('videos').update({ processing_status_text: 'Generating voiceover...' }).eq('id', data.video_id);
      const voiceoverPCM = await clients.google.generateTTS(voiceoverScript, userSettings.voice_id, userSettings.voice_style_instructions);
      const voUpload = await clients.cloudinary.uploadVideo(voiceoverPCM, `voiceover_${data.video_id}.wav`);
      voiceoverUploadUrl = voUpload.secure_url;

      await supabase.from('videos').update({ processing_status_text: 'Composing music (Suno)...' }).eq('id', data.video_id);
      const musicPrompt = `Instrumental, modern, real estate showcase, ${clips[0]?.mood || 'luxury'}, ${clips[0]?.description || ''}`;
      musicUrl = await clients.kie.generateMusic(musicPrompt, true);
    }

    // Details payload
    const detailsPayload = {
      video_id: data.video_id,
      clip_data: clips,
      voiceover_script: voiceoverScript,
      voiceover_url: voiceoverUploadUrl,
      music_url: musicUrl,
      music_source: 'auto',
      caption_data: {},
      settings_snapshot: {
        ...userSettings,
        visual_hook: data.visual_hook || blueprint.visual_hook_instruction,
        script_hook: data.script_hook || blueprint.script_hook,
        property_type: data.property_type,
        property_data: data.property_data,
        is_preview: isPreview,
        skip_video_generation: data.skip_video_generation
      },
      strategy_used: blueprint.strategy_name,
      processing_started_at: new Date(startTime).toISOString(),
    };

    await supabase.from('video_generation_details').insert(detailsPayload);

    console.log(`[${data.video_id}] 📡 Handing off to handleKlingPoll...`);
    await invokeSelf({ mode: 'kling_poll', video_id: data.video_id, original_request_data: data }, functionUrl, authToken);

  } catch (error: any) {
    console.error(`[${data.video_id}] ❌ Start Phase Fatal:`, error.message || error);
    await supabase.from('videos').update({
      status: 'failed',
      processing_status_text: `Error: ${error.message || 'Generation failed'}`
    }).eq('id', data.video_id);
  }
}

async function handleKlingPoll(payload: any, functionUrl: string, authToken: string) {
  const { video_id } = payload;
  const supabase = createClient(API_ENDPOINTS.supabase.url, API_ENDPOINTS.supabase.serviceRoleKey);
  const clients = initClients();

  try {
    const { data: details } = await supabase.from('video_generation_details').select('*').eq('video_id', video_id).single();
    if (!details) return;

    const clips: ClipData[] = details.clip_data || [];
    const START_TIME = Date.now();
    const MAX_TIME_MS = 100000;
    let allDone = false;

    while (Date.now() - START_TIME < MAX_TIME_MS) {
      let pending = 0;
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        if (clip.clip_url || (clip.clip_urls?.length === (clip.kling_task_ids?.length || 1) && clip.clip_url !== '')) continue;

        const taskIds = clip.kling_task_ids || (clip.kling_task_id ? [clip.kling_task_id] : []);
        if (taskIds.length === 0) continue;

        pending++;
        for (const taskId of taskIds) {
          if (clip.clip_urls?.some(u => u.includes(taskId))) continue;
          const finalUrl = await clients.kie.waitForCompletionPollingOnce(taskId);
          if (finalUrl) {
            const upload = await clients.cloudinary.uploadVideo(finalUrl, `clip_${video_id}_${i}_${taskId}.mp4`);
            if (taskIds.length === 1) clip.clip_url = upload.secure_url;
            else { clip.clip_urls = clip.clip_urls || []; clip.clip_urls.push(upload.secure_url); }
          }
        }
      }
      if (pending === 0) { allDone = true; break; }
      await new Promise(r => setTimeout(r, 5000));
    }

    await supabase.from('video_generation_details').update({ clip_data: clips }).eq('video_id', video_id);

    if (!allDone) {
      await invokeSelf({ mode: 'kling_poll', video_id }, functionUrl, authToken);
      return;
    }

    // Finalize
    const settings = details.settings_snapshot;
    if (settings.skip_video_generation) {
      const duration = clips.length * 5;
      let audioUrl = details.voiceover_url;
      if (details.music_url && details.voiceover_url) {
        audioUrl = clients.cloudinary.mixAudio(details.voiceover_url, details.music_url, duration, settings.default_music_volume_db);
      }
      await supabase.from('videos').update({
        status: 'ready', video_url: audioUrl, duration_seconds: duration,
        title: `[AUDIO] ${details.voiceover_script.substring(0, 50)}...`, updated_at: new Date().toISOString()
      }).eq('id', video_id);
    } else if (settings.is_preview) {
      await supabase.from('videos').update({
        status: 'ready', video_url: clips[0].clip_url, duration_seconds: 5,
        title: `[PREVIEW] ${details.voiceover_script.substring(0, 50)}...`, updated_at: new Date().toISOString()
      }).eq('id', video_id);
    } else {
      const allUrls = clips.flatMap(c => c.clip_url ? [c.clip_url] : (c.clip_urls || []));
      const assemblyUrl = clients.cloudinary.assembleVideo(allUrls, details.voiceover_url, details.music_url, allUrls.length * 5, settings.default_music_volume_db);
      const upload = await clients.cloudinary.uploadVideoFromUrl(assemblyUrl, `stage1_${video_id}`);

      if (settings.caption_enabled && settings.caption_system === 'zapcap') {
        const zc = await clients.zapcap.createCaptionTask(upload.secure_url, settings.caption_template_id);
        await supabase.from('video_generation_details').update({
          caption_data: { zapcap_task_id: zc.taskId, zapcap_video_id: zc.videoId, corrections_made: false }
        }).eq('video_id', video_id);
        await invokeSelf({ mode: 'zapcap_poll', video_id, zapcap_task_id: zc.taskId, zapcap_video_id: zc.videoId }, functionUrl, authToken);
      } else {
        await supabase.from('videos').update({
          status: 'ready', video_url: upload.secure_url, duration_seconds: allUrls.length * 5,
          updated_at: new Date().toISOString()
        }).eq('id', video_id);
      }
    }
  } catch (error: any) {
    console.error(`[${video_id}] ❌ Kling Poll Fatal:`, error.message || error);
    await supabase.from('videos').update({ status: 'failed', processing_status_text: `Error: ${error.message}` }).eq('id', video_id);
  }
}

async function handleZapCapPoll(payload: any, functionUrl: string, authToken: string) {
  const { video_id, zapcap_task_id, zapcap_video_id } = payload;
  const supabase = createClient(API_ENDPOINTS.supabase.url, API_ENDPOINTS.supabase.serviceRoleKey);
  const clients = initClients();

  try {
    const { data: details } = await supabase.from('video_generation_details').select('*').eq('video_id', video_id).single();
    if (!details) return;

    const voiceoverScript = details.voiceover_script;
    const START_TIME = Date.now();
    let isDone = false;

    while (Date.now() - START_TIME < 50000) {
      const status = await clients.zapcap.getTaskStatus(zapcap_video_id, zapcap_task_id);
      if (status.status === 'failed') throw new Error('ZapCap failed');

      if (status.status === 'completed') {
        const finalUrl = status.downloadUrl || status.video_url;
        const upload = await clients.cloudinary.uploadVideoFromUrl(finalUrl, `final_${video_id}`);
        await supabase.from('videos').update({ status: 'ready', video_url: upload.secure_url, updated_at: new Date().toISOString() }).eq('id', video_id);
        isDone = true; break;
      }
      await new Promise(r => setTimeout(r, 10000));
    }

    if (!isDone) await invokeSelf(payload, functionUrl, authToken);
  } catch (error: any) {
    console.error(`[${video_id}] ❌ ZapCap Poll Fatal:`, error.message || error);
    await supabase.from('videos').update({ status: 'failed', processing_status_text: `Error: ${error.message}` }).eq('id', video_id);
  }
}

async function invokeSelf(payload: any, passedUrl: string, authToken: string) {
  try {
    const projectUrl = API_ENDPOINTS.supabase.url;
    const serviceKey = API_ENDPOINTS.supabase.serviceRoleKey;
    const url = projectUrl ? `${projectUrl}/functions/v1/process-video-generation` : passedUrl;
    const token = serviceKey ? `Bearer ${serviceKey}` : authToken;
    await fetch(url, { method: 'POST', headers: { 'Authorization': token, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (e) { console.error('Invoke self failed', e); }
}

async function initiateClip(slot: any, index: number, data: VideoGenerationRequest, clients: any, blueprint: VideoBlueprint | null): Promise<ClipData> {
  const firstImage = slot.images[0];
  const secondImage = slot.images.length > 1 ? slot.images[1] : null;
  const firstUpload = await clients.cloudinary.uploadImage(firstImage.data, firstImage.name);
  let secondUpload: any = null;
  if (secondImage) secondUpload = await clients.cloudinary.uploadImage(secondImage.data, secondImage.name);

  let startUrl = firstUpload.secure_url;
  let endUrl = secondUpload?.secure_url || null;
  let usedInstruction = '';

  if (index === 0 && blueprint && blueprint.visual_hook_type === 'motion') {
    const hook = (data.visual_hook || blueprint.visual_hook_instruction || "").trim();
    // Simplified hook logic for stability in this reset
    if (hook.toLowerCase().includes('blur')) {
      const blurred = await clients.kie.editImage(startUrl, "gaussian blur");
      endUrl = startUrl; startUrl = blurred; usedInstruction = "Blur transition";
    } else {
      usedInstruction = hook;
    }
  }

  const vision = await clients.google.analyzeImagesForVideo(startUrl, endUrl, getCinematicPrompt(usedInstruction));
  const taskId = await clients.kie.createVideoTask(vision.luma_prompt, startUrl, endUrl, vision.negative_prompt);

  return {
    slot_index: index, luma_generation_id: taskId, kling_task_id: taskId, luma_prompt: vision.luma_prompt,
    clip_url: '', first_image_url: startUrl, second_image_url: endUrl, is_keyframe: !!endUrl,
    is_correlated: vision.is_correlated !== false, description: vision.description, mood: vision.mood
  };
}

function getCinematicPrompt(extra: string = ""): string {
  return `Generate Kling Pro prompt. JSON fields: is_keyframe, is_correlated, description, luma_prompt, negative_prompt, mood. Hook context: ${extra}`;
}
