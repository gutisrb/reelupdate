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

    if (!videoId || !userId) {
      throw new Error('Missing required fields: video_id or user_id');
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

    // Return immediately - processing continues asynchronously
    const response = new Response(
      JSON.stringify({
        ok: true,
        video_id: data.video_id,
        message: 'Generation started'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    // Continue processing in the background
    processVideoAsync(
      data,
      supabase,
      { cloudinary, luma, openai, google, elevenlabs }
    ).catch(error => {
      console.error(`[${data.video_id}] Processing failed:`, error);
      // Update video status to failed
      supabase.from('videos').update({
        status: 'error',
        error_text: error.message
      }).eq('id', data.video_id).then();
    });

    return response;

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

  try {
    // ============================================
    // 3. GET USER SETTINGS
    // ============================================
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', data.user_id)
      .single();

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

    // Check if TEST_MODE is enabled (title contains "TEST_MODE")
    const isTestMode = data.property_data.title.toUpperCase().includes('TEST_MODE');

    let clips: ClipData[];

    if (isTestMode) {
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

    } else {
      // ============================================
      // EFFICIENT APPROACH (from Make.com):
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

    // Generate voiceover script
    const visualContext = clips.map(c => c.luma_prompt).join('; ');
    const videoLength = data.image_slots.length * 5; // 5 seconds per clip
    const voiceoverScript = await clients.google.generateVoiceoverScript(
      data.property_data,
      visualContext,
      videoLength
    );

    // Generate TTS audio
    const voiceoverPCM = await clients.google.generateTTS(
      voiceoverScript,
      userSettings.voice_id,
      userSettings.voice_style_instructions
    );

    // Upload voiceover to Cloudinary (now in WAV format with proper headers)
    const voiceoverUpload = await clients.cloudinary.uploadVideo(
      voiceoverPCM,
      `voiceover_${data.video_id}.wav`
    );

    // Generate or select music
    let musicUrl: string;
    let musicSource: string;
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

    // Upload assembled video back to Cloudinary for final processing
    const finalVideoUpload = await clients.cloudinary.uploadVideo(
      assembledVideoUrl,
      `final_${data.video_id}.mp4`
    );

    console.log(`[${data.video_id}] Video assembled: ${finalVideoUpload.secure_url}`);

    // ============================================
    // 7. ADD CAPTIONS (In-House Whisper System)
    // ============================================
    let finalVideoWithCaptions = finalVideoUpload.secure_url;

    if (userSettings.caption_enabled) {
      const captionSystem = userSettings.caption_system || 'whisper';
      console.log(`[${data.video_id}] Generating captions using ${captionSystem} system`);

      if (captionSystem === 'zapcap') {
        // ============================================
        // 7A. ZAPCAP SYSTEM
        // ============================================
        try {
          console.log(`[${data.video_id}] Using ZapCap for captions`);

          // Create ZapCap task
          const taskId = await clients.zapcap.createCaptionTask(
            finalVideoUpload.secure_url,
            captionTemplateId
          );

          console.log(`[${data.video_id}] ZapCap task created: ${taskId}`);

          // Wait for transcription (30 seconds)
          await new Promise(resolve => setTimeout(resolve, 30000));

          // Get transcript
          const transcript = await clients.zapcap.getTranscript(data.video_id, taskId);

          // Correct transcript using voiceover script
          const correctedTranscript = await clients.openai.correctTranscript(
            transcript,
            voiceoverScript
          );

          // Update transcript
          await clients.zapcap.updateTranscript(data.video_id, taskId, correctedTranscript);

          // Approve and get final video
          finalVideoWithCaptions = await clients.zapcap.approveTranscript(data.video_id, taskId);

          console.log(`[${data.video_id}] ZapCap captions added successfully`);

        } catch (e) {
          console.error(`[${data.video_id}] ZapCap caption generation failed:`, e);
          // Continue without captions if they fail
        }

      } else {
        // ============================================
        // 7B. WHISPER SYSTEM (In-House Caption Burning)
        // ============================================
        try {
          console.log(`[${data.video_id}] Using In-House Whisper caption rendering`);

          // Import caption rendering modules
          const { parseSRT } = await import('../_shared/srt-parser.ts');
          const { renderAllCaptions } = await import('../_shared/caption-renderer.ts');
          const { compositeCaptionsOnVideo } = await import('../_shared/clients/caption-compositor.ts');

          // 1. Transcribe voiceover with Whisper
          console.log(`[${data.video_id}] Transcribing voiceover...`);
          let srtContent = await clients.openai.createTranscription(voiceoverUpload.secure_url);

          // 2. Correct transcription against original script (95% → 100% accuracy)
          console.log(`[${data.video_id}] Correcting transcription for grammar/typos...`);
          srtContent = await clients.openai.correctTranscript(srtContent, voiceoverScript);
          console.log(`[${data.video_id}] Transcription corrected to match script perfectly`);

          // 3. Parse SRT content
          console.log(`[${data.video_id}] Parsing SRT file...`);
          const cues = parseSRT(srtContent);
          console.log(`[${data.video_id}] Parsed ${cues.length} caption cues`);

          // 4. Build caption style from user settings
          const captionStyle = {
            fontFamily: userSettings.caption_font_family || 'Arial',
            fontSize: userSettings.caption_font_size || 34,
            fontWeight: userSettings.caption_font_weight || 'bold',
            fontColor: userSettings.caption_font_color || 'FFFFFF',
            bgColor: userSettings.caption_bg_color || '000000',
            bgOpacity: userSettings.caption_bg_opacity || 100,
            uppercase: userSettings.caption_uppercase || false,
            strokeColor: userSettings.caption_stroke_color || '000000',
            strokeWidth: userSettings.caption_stroke_width || 0,
            shadowColor: userSettings.caption_shadow_color || '000000',
            shadowBlur: userSettings.caption_shadow_blur || 0,
            shadowX: userSettings.caption_shadow_x || 2,
            shadowY: userSettings.caption_shadow_y || 2,
            position: (userSettings.caption_position as 'top' | 'middle' | 'bottom' | 'auto') || 'bottom',
            animation: (userSettings.caption_animation as 'none' | 'pop' | 'fade' | 'karaoke') || 'none',
            maxLines: userSettings.caption_max_lines || 2,
            emojis: userSettings.caption_emojis || false,
            singleWord: userSettings.caption_single_word || false,
          };

          console.log(`[${data.video_id}] Caption style:`, JSON.stringify(captionStyle));

          // 5. Render all caption frames
          console.log(`[${data.video_id}] Rendering caption frames with Canvas...`);
          const captionFrames = await renderAllCaptions(cues, captionStyle, {
            width: 1080,
            height: 1920,
            fps: 30,
          });

          console.log(`[${data.video_id}] Rendered ${captionFrames.length} caption frames`);

          // 6. Get the base video public ID from the assembled video URL
          const baseVideoPublicId = finalVideoUpload.public_id;

          // 7. Composite captions onto video
          console.log(`[${data.video_id}] Compositing captions onto video...`);
          finalVideoWithCaptions = await compositeCaptionsOnVideo(
            {
              videoPublicId: baseVideoPublicId,
              captionFrames: captionFrames,
            },
            clients.cloudinary
          );

          console.log(`[${data.video_id}] In-house captions successfully composited!`);

        } catch (e) {
          console.error(`[${data.video_id}] In-house caption rendering failed:`, e);
          // Fall back to video without captions
          finalVideoWithCaptions = finalVideoUpload.secure_url;
          console.log(`[${data.video_id}] Continuing with video without captions`);
        }
      }
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

  console.log(`[${data.video_id}] Clip ${index + 1} ready: ${clipUrl}`);

  // Return updated clip data with clip_url
  return {
    ...clipData,
    clip_url: clipUrl,
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
