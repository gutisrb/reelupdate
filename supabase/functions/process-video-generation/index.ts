// Main Video Generation Edge Function
// Replaces Make.com workflow

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  CloudinaryClient,
  LumaClient,
  OpenAIClient,
  GoogleAIClient,
  ElevenLabsClient
} from '../_shared/clients/index.ts';
import type { VideoGenerationRequest, UserSettings, ClipData } from '../_shared/types.ts';
import { API_ENDPOINTS } from '../_shared/config.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse incoming request (FormData from frontend)
    const formData = await req.formData();

    // Extract fields from FormData
    const videoId = formData.get('video_id') as string;
    const userId = formData.get('user_id') as string;
    const groupingStr = formData.get('grouping') as string;
    const captionVideoUrl = formData.get('caption_video_url') as string | null;

    if (!videoId || !userId) {
      throw new Error('Missing required fields: video_id or user_id');
    }

    // Log caption video URL if provided
    if (captionVideoUrl) {
      console.log(`[${videoId}] Caption video URL provided from browser: ${captionVideoUrl}`);
    }

    // Build property_data from individual fields
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

    // Extract images from FormData (they're named image_0, image_1, etc.)
    const totalImages = parseInt(formData.get('total_images') as string || '0');
    const images: any[] = [];

    for (let i = 0; i < totalImages; i++) {
      const imageFile = formData.get(`image_${i}`) as File;
      if (imageFile) {
        const arrayBuffer = await imageFile.arrayBuffer();
        images.push({
          data: arrayBuffer,
          name: imageFile.name,
        });
      }
    }

    // Build image_slots from grouping info
    const imageSlots: any[] = [];
    for (const group of grouping) {
      if (group.type === 'frame-to-frame') {
        // Two images for this slot
        imageSlots.push({
          mode: 'frame-to-frame',
          images: [
            images[group.first_index],
            images[group.second_index],
          ].filter(Boolean),
        });
      } else if (group.type === 'single') {
        // Single image
        imageSlots.push({
          mode: 'image-to-video',
          images: [images[group.index]].filter(Boolean),
        });
      }
    }

    // Build VideoGenerationRequest object
    const data: VideoGenerationRequest = {
      video_id: videoId,
      user_id: userId,
      property_data: propertyData,
      image_slots: imageSlots,
      grouping: groupingStr,
      slot_mode_info: groupingStr, // Same as grouping for compatibility
      total_images: totalImages,
      caption_video_url: captionVideoUrl || undefined, // Browser-rendered caption overlay
    };

    // Initialize Supabase client
    const supabase = createClient(
      API_ENDPOINTS.supabase.url,
      API_ENDPOINTS.supabase.serviceRoleKey
    );

    // Initialize API clients
    const cloudinary = new CloudinaryClient();
    const luma = new LumaClient();
    const openai = new OpenAIClient();
    const google = new GoogleAIClient();
    const elevenlabs = new ElevenLabsClient();

    console.log(`[${data.video_id}] Starting video generation`);

    // ============================================
    // 1. CHECK USER CREDITS
    // ============================================
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('video_credits_remaining')
      .eq('id', data.user_id)
      .single();

    if (profileError || !profileData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profileData.video_credits_remaining <= 0) {
      return new Response(
        JSON.stringify({ error: 'NO_VIDEO_CREDITS' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // 2. DEDUCT CREDIT & CREATE VIDEO RECORD
    // ============================================
    const { error: creditError } = await supabase.rpc('spend_video_credit', {
      p_user: data.user_id
    });

    if (creditError) {
      throw new Error(`Failed to deduct credit: ${creditError.message}`);
    }

    const { error: videoError } = await supabase
      .from('videos')
      .insert({
        id: data.video_id,
        user_id: data.user_id,
        type: 'video',
        status: 'processing',
        title: data.property_data.title,
        thumbnail_url: null,
        video_url: null,
        duration_seconds: null,
      });

    if (videoError) {
      console.error(`Failed to create video record: ${videoError.message}`);
    }

    // Process synchronously to avoid EarlyDrop (background tasks can be terminated)
    console.log(`[${data.video_id}] DEBUG: About to call processVideoAsync`);
    try {
      await processVideoAsync(
        data,
        supabase,
        { cloudinary, luma, openai, google, elevenlabs }
      );
      console.log(`[${data.video_id}] DEBUG: processVideoAsync completed successfully`);
    } catch (error) {
      console.error(`[${data.video_id}] Processing failed:`, error);
      console.error(`[${data.video_id}] ERROR stack:`, (error as any)?.stack);
      console.error(`[${data.video_id}] ERROR name:`, (error as any)?.name);
      console.error(`[${data.video_id}] ERROR message:`, (error as any)?.message);

      // Update video status to error
      await supabase.from('videos').update({
        status: 'error',
        error_text: (error as any)?.message || 'Unknown error'
      }).eq('id', data.video_id);

      return new Response(
        JSON.stringify({ ok: false, error: (error as any)?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Completed
    return new Response(
      JSON.stringify({
        ok: true,
        video_id: data.video_id,
        message: 'Generation completed',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Request handling error:', error);
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Process video generation asynchronously
 */
async function processVideoAsync(
  data: VideoGenerationRequest,
  supabase: any,
  clients: any
) {
  const startTime = Date.now();
  console.log(`[${data.video_id}] Processing started`);
  console.log(`[${data.video_id}] DEBUG: processVideoAsync called`);
  console.log(`[${data.video_id}] DEBUG: data.video_id = ${data.video_id}`);
  console.log(`[${data.video_id}] DEBUG: data.user_id = ${data.user_id}`);
  console.log(`[${data.video_id}] DEBUG: data.property_data.title = ${data.property_data.title}`);

  try {
    console.log(`[${data.video_id}] DEBUG: Inside try block`);

    // ============================================
    // 3. GET USER SETTINGS
    // ============================================
    console.log(`[${data.video_id}] DEBUG: Fetching user settings...`);
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', data.user_id)
      .single();

    console.log(`[${data.video_id}] DEBUG: User settings fetched:`, settings ? 'found' : 'not found');

    const userSettings: UserSettings = settings || {
      voice_id: 'sr-RS-Standard-A',
      voice_language_code: 'sr-RS',
      logo_url: null,
      logo_position: 'corner_top_right',
      logo_size_percent: 15,
      caption_template_id: null,
      caption_enabled: true,
      music_preference: 'auto_generate',
      default_music_volume_db: -60,
      post_description_template: null,
      caption_system: 'whisper',
      caption_style_type: 'template',
      caption_font_family: 'Arial',
      caption_font_size: 34,
      caption_font_color: 'FFFFFF',
      caption_bg_color: '000000',
      caption_bg_opacity: 100,
    };

    // Get caption template ID
    let captionTemplateId = userSettings.caption_template_id;
    if (!captionTemplateId) {
      // Get default template
      const { data: defaultTemplate } = await supabase
        .from('caption_templates')
        .select('zapcap_template_id')
        .eq('active', true)
        .order('sort_order')
        .limit(1)
        .single();

      captionTemplateId = defaultTemplate?.zapcap_template_id || '6255949c-4a52-4255-8a67-39ebccfaa3ef';
    }

    // ============================================
    // 4. PROCESS CLIPS (with GPT-4o + Luma) or TEST_MODE
    // ============================================
    console.log(`[${data.video_id}] DEBUG: About to check TEST_MODE`);

    // Check if TEST_MODE is enabled (title contains "TEST_MODE")
    const isTestMode = data.property_data.title.toUpperCase().includes('TEST_MODE');
    console.log(`[${data.video_id}] DEBUG: isTestMode = ${isTestMode}`);

    let clips: ClipData[];

    if (isTestMode) {
      // ============================================
      // TEST_MODE: Use placeholder clips to save AI costs
      // ============================================
      console.log(`[${data.video_id}] ⚡ TEST_MODE ENABLED - Using placeholder clips`);

      // Placeholder clip URLs (no AI processing)
      const placeholderClips = [
        'https://res.cloudinary.com/dyarnpqaq/video/upload/v1765287500/clip_7f7e06bb-39d0-4add-b358-ea333ade6a04_0_fmtela_iznuwx.mp4',
        'https://res.cloudinary.com/dyarnpqaq/video/upload/v1765287500/clip_7f7e06bb-39d0-4add-b358-ea333ade6a04_1_s65doc_kxkxv4.mp4',
        'https://res.cloudinary.com/dyarnpqaq/video/upload/v1765287500/clip_7f7e06bb-39d0-4add-b358-ea333ade6a04_2_qgb0vb_axic0c.mp4',
        'https://res.cloudinary.com/dyarnpqaq/video/upload/v1765287500/clip_7f7e06bb-39d0-4add-b358-ea333ade6a04_3_re2ma1_xy4odo.mp4',
        'https://res.cloudinary.com/dyarnpqaq/video/upload/v1765287500/clip_7f7e06bb-39d0-4add-b358-ea333ade6a04_4_eoizxe_jvrhvl.mp4',
      ];

      clips = data.image_slots.map((_slot, index) => ({
        slot_index: index,
        luma_generation_id: 'test_mode_placeholder',
        luma_prompt: 'TEST MODE: Placeholder clip for testing',
        clip_url: placeholderClips[index % placeholderClips.length],
        first_image_url: '',
        second_image_url: null,
        is_keyframe: false,
        description: 'Test mode placeholder',
        mood: 'modern',
      }));

      console.log(`[${data.video_id}] ⚡ Using ${clips.length} placeholder clips (saved AI costs)`);
      console.log(`[${data.video_id}] TEST_MODE will continue through full pipeline (voiceover, music, assembly, captions)`);

    } else {
      // ============================================
      // REGULAR MODE: EFFICIENT APPROACH (from Make.com):
      // 1. Prepare all clips in parallel (upload images + GPT-4o + START Luma, don't wait)
      // 2. Generate audio in parallel with Luma rendering
      // 3. Wait for all Luma completions
      // ============================================

      console.log(`[${data.video_id}] Step 1: Preparing ${data.image_slots.length} clips (upload + GPT-4o + start Luma)...`);

      // Step 1: Upload images, GPT-4o analysis, and START Luma generations (in parallel)
      const clipPreparations = data.image_slots.map((slot, index) =>
        prepareClip(slot, index, data, clients)
      );

      const preparedClips = await Promise.all(clipPreparations);

      console.log(`[${data.video_id}] Step 1 complete: All Luma generations started (rendering in background)`);
      console.log(`[${data.video_id}] Luma generation IDs:`, preparedClips.map(c => c.luma_generation_id).join(', '));

      // Store prepared clips for later completion
      clips = preparedClips;
    }

    // ============================================
    // 5. GENERATE AUDIO (Voiceover + Music) - IN PARALLEL WITH LUMA RENDERING
    // ============================================
    console.log(`[${data.video_id}] Step 2: Generating audio (while Luma renders in background)...`);
    console.log(`[${data.video_id}] DEBUG: clips.length = ${clips.length}`);

    let voiceoverScript: string;
    let voiceoverUpload: any;
    let musicUrl: string;
    let musicSource: string;

    if (isTestMode) {
      // TEST_MODE: Use placeholder audio to save credits
      console.log(`[${data.video_id}] TEST_MODE: Using placeholder music and voiceover (saving AI credits)`);

      voiceoverScript = 'TEST_MODE placeholder voiceover script';
      voiceoverUpload = {
        secure_url: 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1765407043/cwl0mqzkwc3xf7iesmgl.wav',
        public_id: 'cwl0mqzkwc3xf7iesmgl',
      };

      musicUrl = 'https://res.cloudinary.com/dyarnpqaq/video/upload/v1765440325/music_1765440324652.mp3';
      musicSource = 'test_mode_placeholder';

    } else {
      // REGULAR MODE: Generate real audio
      console.log(`[${data.video_id}] DEBUG: About to generate voiceover script`);

      // Generate voiceover script
      const visualContext = clips.map(c => c.luma_prompt).join('; ');
      const videoLength = data.image_slots.length * 5; // 5 seconds per clip
      console.log(`[${data.video_id}] DEBUG: videoLength = ${videoLength}s, visualContext length = ${visualContext.length} chars`);

      voiceoverScript = await clients.google.generateVoiceoverScript(
        data.property_data,
        visualContext,
        videoLength
      );
      console.log(`[${data.video_id}] DEBUG: Voiceover script generated: ${voiceoverScript.length} chars`);

      // Generate TTS audio
      const voiceoverPCM = await clients.google.generateTTS(
        voiceoverScript,
        userSettings.voice_id,
        userSettings.voice_style_instructions
      );

      // Upload voiceover to Cloudinary (now in WAV format with proper headers)
      voiceoverUpload = await clients.cloudinary.uploadVideo(
        voiceoverPCM,
        `voiceover_${data.video_id}.wav`
      );

      // Generate or select music
      const musicDurationMs = data.image_slots.length * 5 * 1000; // Convert seconds to milliseconds

      if (userSettings.music_preference === 'custom') {
      // Use custom uploaded music
      const { data: musicData } = await supabase
        .from('custom_music_uploads')
        .select('cloudinary_url, title')
        .eq('id', userSettings.selected_custom_music_id)
        .single();

      if (musicData && musicData.cloudinary_url) {
        musicUrl = musicData.cloudinary_url;
        musicSource = 'custom_upload';
        console.log(`[${data.video_id}] Using custom music: ${musicData.title || 'Untitled'}`);
      } else {
        // Fallback to generated if custom music not found
        console.log(`[${data.video_id}] Custom music not found, falling back to generated`);
        const musicPrompt = clients.elevenlabs.generateMusicPrompt(
          clips[0]?.mood || 'modern',
          clips[0]?.description || ''
        );
        musicUrl = await clients.elevenlabs.generateMusic(musicPrompt, musicDurationMs);
        musicSource = 'auto_generated';
      }
    } else if (userSettings.music_preference === 'library_pick') {
      // Get music from library
      const { data: libraryMusic } = await supabase
        .from('music_library')
        .select('cloudinary_url')
        .eq('active', true)
        .limit(1)
        .single();

      if (libraryMusic) {
        musicUrl = libraryMusic.cloudinary_url;
        musicSource = 'library';
      } else {
        // Fallback to generated
        const musicPrompt = clients.elevenlabs.generateMusicPrompt(
          clips[0]?.mood || 'modern',
          clips[0]?.description || ''
        );
        musicUrl = await clients.elevenlabs.generateMusic(musicPrompt, musicDurationMs);
        musicSource = 'auto_generated';
      }
    } else {
      // Auto-generate music (default)
      const musicPrompt = clients.elevenlabs.generateMusicPrompt(
        clips[0]?.mood || 'modern',
        clips[0]?.description || ''
      );
      musicUrl = await clients.elevenlabs.generateMusic(musicPrompt, musicDurationMs);
      musicSource = 'auto_generated';
      }
    }

    console.log(`[${data.video_id}] Step 2 complete: Audio generated (source: ${musicSource})`);

    // ============================================
    // 5B. WAIT FOR LUMA COMPLETIONS (if not TEST_MODE)
    // ============================================
    if (!isTestMode) {
      console.log(`[${data.video_id}] Step 3: Waiting for all Luma generations to complete...`);

      const completionPromises = clips.map((clip, index) =>
        finishClip(clip, index, data, clients)
      );

      clips = await Promise.all(completionPromises);

      console.log(`[${data.video_id}] Step 3 complete: All ${clips.length} clips ready`);
    }

    // ============================================
    // 6. ASSEMBLE VIDEO
    // ============================================
    console.log(`[${data.video_id}] Step 4: Assembling video...`);

    const clipUrls = clips.map(c => c.clip_url);
    const totalDuration = clips.length * 5; // 5 seconds per clip

    // Assemble video with Cloudinary transformations (returns transformation URL)
    // NOTE: This returns a transformation URL, NOT an actual video file
    // Cloudinary will process the transformation on-demand when the URL is accessed
    const baseClipPublicId = clients.cloudinary['extractPublicId'](clipUrls[0]);

    const assembledVideoUrl = clients.cloudinary.assembleVideo(
      clipUrls,
      voiceoverUpload.secure_url,
      musicUrl,
      totalDuration,
      userSettings.default_music_volume_db,
      userSettings.logo_url || undefined,
      userSettings.logo_position || 'corner_top_right',
      userSettings.logo_size_percent || 15
    );

    console.log(`[${data.video_id}] Video assembly transformation URL: ${assembledVideoUrl}`);
    console.log(`[${data.video_id}] DEBUG: Full assembled URL length: ${assembledVideoUrl.length} chars`);
    console.log(`[${data.video_id}] DEBUG: Base clip public_id: ${baseClipPublicId}`);

    // ============================================
    // 7. ADD CAPTIONS (Browser-Rendered Caption Overlay)
    // ============================================
    let finalVideoWithCaptions = assembledVideoUrl;

    // Check if caption video was provided from browser
    if (data.caption_video_url) {
      console.log(`[${data.video_id}] Adding browser-rendered caption overlay...`);

      try {
        // Extract public_id from caption video URL
        const captionPublicId = clients.cloudinary['extractPublicId'](data.caption_video_url);
        console.log(`[${data.video_id}] Caption video public_id: ${captionPublicId}`);

        // Extract existing transformation from assembled URL
        const cloudName = clients.cloudinary['cloudName'];
        const urlParts = assembledVideoUrl.split('/upload/');
        console.log(`[${data.video_id}] DEBUG: URL parts after split: ${urlParts.length} parts`);
        console.log(`[${data.video_id}] DEBUG: Part 0 (before /upload/): ${urlParts[0]}`);
        console.log(`[${data.video_id}] DEBUG: Part 1 (after /upload/): ${urlParts[1].substring(0, 200)}...`);

        const existingTransformation = urlParts[1].split(`/${baseClipPublicId}`)[0];
        console.log(`[${data.video_id}] DEBUG: Existing transformation: ${existingTransformation}`);

        // Add caption overlay to existing transformation
        const transformationWithCaptions = `${existingTransformation}/l_video:${captionPublicId},fl_layer_apply`;
        console.log(`[${data.video_id}] DEBUG: Transformation with captions: ${transformationWithCaptions.substring(0, 200)}...`);

        finalVideoWithCaptions = `https://res.cloudinary.com/${cloudName}/video/upload/${transformationWithCaptions}/${baseClipPublicId}.mp4`;

        console.log(`[${data.video_id}] Caption overlay added successfully`);
        console.log(`[${data.video_id}] Final video URL: ${finalVideoWithCaptions}`);
      } catch (e) {
        console.error(`[${data.video_id}] Failed to add caption overlay:`, e);
        // Continue without captions
        console.log(`[${data.video_id}] Continuing with video without captions`);
      }
    } else {
      console.log(`[${data.video_id}] No caption video provided, skipping captions`);
    }

    // ============================================
    // 8. UPDATE DATABASE
    // ============================================
    const endTime = Date.now();
    const processingTime = Math.floor((endTime - startTime) / 1000);

    const { error: videoUpdateError } = await supabase.from('videos').update({
      status: 'ready',
      video_url: finalVideoWithCaptions,
      thumbnail_url: clips[0]?.first_image_url || null,
      duration_seconds: totalDuration,
      updated_at: new Date().toISOString(),
    }).eq('id', data.video_id);

    if (videoUpdateError) {
      console.error(`[${data.video_id}] Failed to update videos row: ${videoUpdateError.message}`);
      throw new Error(`Failed to update videos row: ${videoUpdateError.message}`);
    }

    const { error: detailsError } = await supabase.from('video_generation_details').insert({
      video_id: data.video_id,
      clip_data: clips,
      voiceover_script: voiceoverScript,
      voiceover_url: voiceoverUpload.secure_url,
      music_url: musicUrl,
      music_source: musicSource,
      caption_data: {
        template_id: captionTemplateId,
        transcript: voiceoverScript,
      },
      settings_snapshot: userSettings,
      processing_started_at: new Date(startTime).toISOString(),
      processing_completed_at: new Date(endTime).toISOString(),
      total_processing_time_seconds: processingTime,
    });

    if (detailsError) {
      console.error(`[${data.video_id}] Failed to insert video_generation_details: ${detailsError.message}`);
      throw new Error(`Failed to insert video_generation_details: ${detailsError.message}`);
    }

    console.log(`[${data.video_id}] Processing completed in ${processingTime}s`);

  } catch (error) {
    console.error(`[${data.video_id}] Error:`, error);
    console.error(`[${data.video_id}] Error stack:`, (error as any)?.stack);

    // Make sure error is recorded in database
    try {
      await supabase.from('videos').update({
        status: 'failed',
        error_text: `${(error as any)?.message || 'Unknown error'}\n\nStack: ${(error as any)?.stack || 'No stack trace'}`
      }).eq('id', data.video_id);
    } catch (dbError) {
      console.error(`[${data.video_id}] Failed to update error in database:`, dbError);
    }

    throw error;
  }
}

/**
 * STEP 1: Prepare clip (upload images, GPT-4o analysis, START Luma - don't wait)
 * Returns clip data with luma_generation_id but NO clip_url yet
 */
async function prepareClip(
  slot: any,
  index: number,
  data: VideoGenerationRequest,
  clients: any
): Promise<ClipData> {
  console.log(`[${data.video_id}] Preparing clip ${index + 1} (upload + GPT-4o + start Luma)...`);

  const isKeyframe = slot.images.length > 1;
  const firstImage = slot.images[0];
  const secondImage = isKeyframe ? slot.images[1] : null;

  // Upload images to Cloudinary
  const firstImageUpload = await clients.cloudinary.uploadImage(
    firstImage.data,
    firstImage.name
  );

  let secondImageUpload: any = null;
  if (secondImage) {
    secondImageUpload = await clients.cloudinary.uploadImage(
      secondImage.data,
      secondImage.name
    );
  }

  // Analyze images with GPT-4o Vision (using prompt from blueprint)
  const visionAnalysis = await clients.openai.analyzeImagesForVideo(
    firstImageUpload.secure_url,
    secondImageUpload?.secure_url || null,
    getGPT4VisionPrompt() // Full prompt from blueprint
  );

  // START Luma generation (don't wait for completion)
  const lumaGeneration = await clients.luma.createGeneration(
    visionAnalysis.luma_prompt,
    firstImageUpload.secure_url,
    secondImageUpload?.secure_url
  );

  console.log(`[${data.video_id}] Clip ${index + 1} prepared - Luma ID: ${lumaGeneration.id}`);

  // Return clip data WITHOUT clip_url (will be filled in finishClip)
  return {
    slot_index: index,
    luma_generation_id: lumaGeneration.id,
    luma_prompt: visionAnalysis.luma_prompt,
    clip_url: '', // Will be filled by finishClip()
    first_image_url: firstImageUpload.secure_url,
    second_image_url: secondImageUpload?.secure_url || null,
    is_keyframe: isKeyframe,
    description: visionAnalysis.description,
    mood: visionAnalysis.mood,
  };
}

/**
 * STEP 3: Wait for Luma generation to complete and get clip URL
 */
async function finishClip(
  clipData: ClipData,
  index: number,
  data: VideoGenerationRequest,
  clients: any
): Promise<ClipData> {
  console.log(`[${data.video_id}] Waiting for clip ${index + 1} (Luma ID: ${clipData.luma_generation_id})...`);

  // Wait for Luma completion
  const clipUrl = await clients.luma.waitForCompletion(clipData.luma_generation_id);

  console.log(`[${data.video_id}] Clip ${index + 1} ready from Luma: ${clipUrl}`);

  // Upload Luma clip to Cloudinary for permanent storage
  // (Luma URLs are temporary and expire - Cloudinary URLs are permanent)
  console.log(`[${data.video_id}] Uploading clip ${index + 1} to Cloudinary...`);
  const cloudinaryUpload = await clients.cloudinary.uploadVideo(
    clipUrl,
    `clip_${data.video_id}_${index}.mp4`
  );
  console.log(`[${data.video_id}] Clip ${index + 1} uploaded to Cloudinary: ${cloudinaryUpload.secure_url}`);

  // Return updated clip data with Cloudinary URL (not Luma URL)
  return {
    ...clipData,
    clip_url: cloudinaryUpload.secure_url,
  };
}

/**
 * Get GPT-4o Vision prompt for video analysis
 * (Full prompt from Make.com blueprint)
 */
function getGPT4VisionPrompt(): string {
  return `You generate a compact control prompt for Luma Dream Machine from 1 or 2 property images (keyframes).
Return ONLY the JSON fields: is_keyframe, description, luma_prompt, mood.

ALLOWED CAMERA MOTIONS (choose EXACTLY one token, verbatim)
Static | Move Left | Move Right | Move Up | Move Down | Push In | Pull Out | Zoom In | Zoom Out | Pan Left | Pan Right | Orbit Left | Orbit Right | Crane Up | Crane Down

1) ANALYZE IMAGES (do not output this analysis)
- Room type & scale (tight / medium / wide). Lighting (bright daylight / warm indoor / mixed / evening).
- Stable parallax anchors: window wall, balcony doors, columns, beams, skylight, staircase, kitchen island, long sofa, media wall, floor pattern.
- Edits/themes/hooks actually visible: balloons/confetti/seasonal decor; mascot/large toy; signage/text overlay; 3D room "cube on white"; added furniture; renovation deltas.
- Actors/people: none | only frame 1 | only frame 2 | present in both (note if positions differ).
- Frame relation: ONE_IMAGE | SAME_SPACE | ADJACENT_VIEW | DIFFERENT_ROOM | CUBE_START.

2) CAMERA MOTION SELECTION (pick ONE from the list)
- Prefer Push In / Move Left / Move Right / Pan Left / Pan Right for tight interiors.
- Allow Orbit / Crane / Pull Out only in large/open spaces or exteriors.
- If any actors visible, downshift to Push In / Move / Pan (avoid Orbit/Crane/Pull Out/Zoom).
- Use Static only if artifacts demand it.

PROFESSIONAL CAMERA LANGUAGE REQUIREMENT:
When composing luma_prompt, ALWAYS use professional cinematography descriptors:
- Movement quality: "glides smoothly", "sweeps gradually", "tracks steadily", "dollies fluidly", "pans gracefully"
- Reveal verbs: "revealing", "showcasing", "highlighting", "unveiling" (NEVER "explore", "past" alone)
- Motion quality: "with cinematic parallax", "with fluid motion", "with smooth acceleration"
- Easing: "starts gently and accelerates" or "eases into motion" when space allows

3) COMPOSE luma_prompt AS TWO SHORT SENTENCES (total 20–30 words)
Sentence A (professional cinematography + space):
- Start with the chosen CAMERA MOTION token (exact text), followed by a colon.
- Add professional movement descriptor: "camera glides smoothly", "camera sweeps gradually", "camera tracks steadily", "camera dollies fluidly"
- Add 1–2 spatial anchors using cinematic language:
  - Use "gliding alongside" (NOT "past" or "along" alone)
  - Use "sweeping across" or "tracking through" (NOT bare prepositions)
  - Use "revealing [feature]" or "showcasing [detail]" (NOT "exploring")
  - Examples: "camera glides smoothly alongside window wall, revealing dining area"
              "camera tracks steadily from media wall, showcasing architectural flow"
              "camera sweeps gradually across living space, highlighting natural light"
- Add motion quality descriptor: "with cinematic parallax", "with fluid spatial flow", "with smooth acceleration"
- Add ONE relation clause:
  – ONE_IMAGE: "smoothly revealing [architectural feature]" or "gradually showcasing [spatial detail]"
  – SAME_SPACE: "fluid transition with cinematic parallax; seamless geometry preservation; avoid dissolve"
  – ADJACENT_VIEW: "professional camera movement connecting views; maintain spatial continuity; avoid dissolve"
  – DIFFERENT_ROOM: "smooth cinematic transition into second space; professional match-cut; no dissolve"
  – CUBE_START: "cinematic push from exterior into interior; smooth acceleration; maintain motion flow"

Sentence B (include ONLY what applies; keep compact):
- Actors:
  – only frame 1 → "character remains first frame only; exits naturally; no rapid motion."
  – only frame 2 → "character enters naturally in second frame; minimal motion."
  – in both → "characters hold still (blinks okay); no rapid movement; maintain identity."
  – none → "no people."
- Hooks/themes/props (ONLY IF SALIENT): mention category-level only (e.g., "balloons", "seasonal decor", "signage") when visually central or ≳15% of frame; otherwise do NOT mention.
  – Use ONE simple verb: drift / settle / appear / clear / pop softly.
- Small decor (frames, plants, small plush/toys, table items): remain static and SHOULD NOT be mentioned.
- Furnishing change: choose ONE → "furniture appears naturally" OR "furniture clears naturally."
- End Sentence B with lighting and ONE mood word (from the whitelist below).

PROFESSIONAL CAMERA EXAMPLES (use this language style):
✅ "Move Right: camera glides smoothly alongside media wall, revealing dining area with cinematic parallax; seamless spatial transition. No people. Bright daylight, cozy."
✅ "Push In: camera dollies forward steadily toward window, showcasing panoramic views with smooth acceleration. No people. Natural lighting, elegant."
✅ "Pan Left: camera sweeps gradually across living space, highlighting architectural features with fluid motion. No people. Warm lighting, sophisticated."
✅ "Static: camera holds steady at window wall, smoothly revealing seating arrangement in natural light. No people. Bright lighting, spacious."

❌ AVOID these (sounds like walking/handheld):
❌ "Move Right past media wall and dining table"
❌ "explore seating arrangement"
❌ "along window wall" (without "gliding" or "smoothly")
❌ "over geometric floor" (without smooth descriptor)

4) COMPOSE description (STRICT PROPERTY-ONLY, 12–18 words)
- Include ONLY architectural/permanent features and natural lighting: layout & room type; windows/doors/balcony; beams/coffers/skylight; built-ins/cabinetry/media wall; fixed kitchen/bath items; flooring material/pattern; view; lighting as observed.
- EXCLUDE everything movable or likely edited: people/actors; balloons/confetti/themes; loose furniture/decor; rugs; plants; tableware; toys; signage/text overlays; staged props.
- If two images, favor features present in BOTH; if unsure a feature is permanent, omit it.
- Friendly marketing tone.

5) FINAL SELF-CHECK BEFORE OUTPUT
- luma_prompt begins with a valid motion token followed by colon; total ≤ 30 words.
- luma_prompt includes PROFESSIONAL CAMERA LANGUAGE: "glides/sweeps/tracks/dollies/smoothly/gradually/fluidly"
- luma_prompt uses CINEMATIC REVEAL VERBS: "revealing/showcasing/highlighting" (NOT "past/explore/along" alone)
- Movement includes quality descriptor: "with cinematic parallax", "with fluid motion", "with smooth acceleration"
- If is_keyframe = true and "avoid dissolve" is missing, add it to Sentence A.
- If any actors detected and motion is Orbit/Crane/Pull Out/Zoom, downgrade to Push In.
- luma_prompt contains no tiny-prop nouns; use category-level only when salient (≥15% frame).
- description contains NO people/props/themes/staging words (property-only).
- NO WALKING LANGUAGE: verify no "past", "explore", or bare "along"/"over" without smooth descriptors

6) OUTPUT FORMAT ( Return ONLY a JSON object. No \`\`\`json blocks or additional text )
{
  "is_keyframe": boolean,
  "description": "property-only, 12–18 words",
  "luma_prompt": "two sentences, 20–30 words, using professional cinematography language",
  "mood": "luxury|modern|elegant|cozy|upbeat|calm|sophisticated|contemporary|warm|bright|minimalist|spacious|intimate|professional|stylish|chic|serene|energetic|ambient|classic|urban|trendy"
}`;
}
