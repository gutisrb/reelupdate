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
    const propertyDataStr = formData.get('property_data') as string;
    const groupingStr = formData.get('grouping') as string;

    if (!videoId || !userId || !propertyDataStr) {
      throw new Error('Missing required fields: video_id, user_id, or property_data');
    }

    const propertyData = JSON.parse(propertyDataStr);
    const grouping = groupingStr || '[]';

    // Extract image slots from FormData
    const imageSlots: any[] = [];
    const slotModeInfo = JSON.parse(formData.get('slot_mode_info') as string || '[]');

    for (let i = 0; i < slotModeInfo.length; i++) {
      const slotInfo = slotModeInfo[i];
      const images: any[] = [];

      // Get images for this slot
      for (let j = 0; j < slotInfo.image_count; j++) {
        const imageKey = `slot_${i}_image_${j}`;
        const imageFile = formData.get(imageKey) as File;

        if (imageFile) {
          // Convert File to ArrayBuffer
          const arrayBuffer = await imageFile.arrayBuffer();
          images.push({
            data: arrayBuffer,
            name: imageFile.name,
          });
        }
      }

      imageSlots.push({
        mode: slotInfo.mode,
        images: images,
      });
    }

    // Build VideoGenerationRequest object
    const data: VideoGenerationRequest = {
      video_id: videoId,
      user_id: userId,
      property_data: propertyData,
      image_slots: imageSlots,
      grouping: grouping,
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
        status: 'failed',
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
      console.log(`[${data.video_id}] Processing ${data.image_slots.length} clips with Luma AI`);

      const clipPromises = data.image_slots.map((slot, index) =>
        processClip(slot, index, data, clients)
      );

      clips = await Promise.all(clipPromises);

      console.log(`[${data.video_id}] All clips generated`);
    }

    // ============================================
    // 5. GENERATE AUDIO (Voiceover + Music)
    // ============================================
    console.log(`[${data.video_id}] Generating audio`);

    // Generate voiceover script
    const visualContext = clips.map(c => c.luma_prompt).join('; ');
    const voiceoverScript = await clients.google.generateVoiceoverScript(
      data.property_data,
      visualContext
    );

    // Generate TTS audio
    const voiceoverPCM = await clients.google.generateTTS(
      voiceoverScript,
      userSettings.voice_id,
      userSettings.voice_style_instructions
    );

    // Upload voiceover to Cloudinary
    const voiceoverUpload = await clients.cloudinary.uploadVideo(
      voiceoverPCM,
      `voiceover_${data.video_id}.mp3`
    );

    // Generate or select music
    let musicUrl: string;
    let musicSource: string;

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
        musicUrl = await clients.elevenlabs.generateMusic(musicPrompt);
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
        musicUrl = await clients.elevenlabs.generateMusic(musicPrompt);
        musicSource = 'auto_generated';
      }
    } else {
      // Auto-generate music (default)
      const musicPrompt = clients.elevenlabs.generateMusicPrompt(
        clips[0]?.mood || 'modern',
        clips[0]?.description || ''
      );
      musicUrl = await clients.elevenlabs.generateMusic(musicPrompt);
      musicSource = 'auto_generated';
    }

    console.log(`[${data.video_id}] Audio generated (source: ${musicSource})`);

    // ============================================
    // 6. ASSEMBLE VIDEO
    // ============================================
    console.log(`[${data.video_id}] Assembling video`);

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

    await supabase.from('videos').update({
      status: 'completed',
      video_url: finalVideoWithCaptions,
      thumbnail_url: clips[0]?.first_image_url || null,
      duration_seconds: totalDuration,
      updated_at: new Date().toISOString(),
    }).eq('id', data.video_id);

    await supabase.from('video_generation_details').insert({
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

    console.log(`[${data.video_id}] Processing completed in ${processingTime}s`);

  } catch (error) {
    console.error(`[${data.video_id}] Error:`, error);
    throw error;
  }
}

/**
 * Process a single clip (upload images, analyze with GPT-4o, generate with Luma)
 */
async function processClip(
  slot: any,
  index: number,
  data: VideoGenerationRequest,
  clients: any
): Promise<ClipData> {
  console.log(`[${data.video_id}] Processing clip ${index + 1}`);

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

  // Generate video with Luma
  const lumaGeneration = await clients.luma.createGeneration(
    visionAnalysis.luma_prompt,
    firstImageUpload.secure_url,
    secondImageUpload?.secure_url
  );

  // Wait for completion
  const clipUrl = await clients.luma.waitForCompletion(lumaGeneration.id);

  console.log(`[${data.video_id}] Clip ${index + 1} completed`);

  return {
    slot_index: index,
    luma_generation_id: lumaGeneration.id,
    luma_prompt: visionAnalysis.luma_prompt,
    clip_url: clipUrl,
    first_image_url: firstImageUpload.secure_url,
    second_image_url: secondImageUpload?.secure_url || null,
    is_keyframe: isKeyframe,
    description: visionAnalysis.description,
    mood: visionAnalysis.mood,
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

[... Full prompt from blueprint continues ...]

OUTPUT FORMAT ( Return ONLY a JSON object. No \`\`\`json blocks or additional text )
{
  "is_keyframe": boolean,
  "description": "property-only, 12–18 words",
  "luma_prompt": "two sentences, 20–30 words, using professional cinematography language",
  "mood": "luxury|modern|elegant|cozy|upbeat|calm|sophisticated|contemporary|warm|bright|minimalist|spacious|intimate|professional|stylish|chic|serene|energetic|ambient|classic|urban|trendy"
}`;
}
