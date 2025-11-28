// Main Video Generation Edge Function
// Replaces Make.com workflow

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  CloudinaryClient,
  LumaClient,
  OpenAIClient,
  GoogleAIClient,
  ElevenLabsClient,
  ZapCapClient
} from '../_shared/clients/index.ts';
import type { VideoGenerationRequest, UserSettings, ClipData } from '../_shared/types.ts';
import { API_ENDPOINTS } from '../_shared/config.ts';

serve(async (req) => {
  try {
    // Parse incoming request
    const data: VideoGenerationRequest = await req.json();

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
    const zapcap = new ZapCapClient();

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
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (profileData.video_credits_remaining <= 0) {
      return new Response(
        JSON.stringify({ error: 'NO_VIDEO_CREDITS' }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
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
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    // Continue processing in the background
    processVideoAsync(
      data,
      supabase,
      { cloudinary, luma, openai, google, elevenlabs, zapcap }
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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
    // 4. PROCESS CLIPS (with GPT-4o + Luma)
    // ============================================
    console.log(`[${data.video_id}] Processing ${data.image_slots.length} clips`);

    const clipPromises = data.image_slots.map((slot, index) =>
      processClip(slot, index, data, clients)
    );

    const clips: ClipData[] = await Promise.all(clipPromises);

    console.log(`[${data.video_id}] All clips generated`);

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
      userSettings.voice_id
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
      userSettings.default_music_volume_db
    );

    // Upload assembled video back to Cloudinary for final processing
    const finalVideoUpload = await clients.cloudinary.uploadVideo(
      assembledVideoUrl,
      `final_${data.video_id}.mp4`
    );

    console.log(`[${data.video_id}] Video assembled: ${finalVideoUpload.secure_url}`);

    // ============================================
    // 7. ADD CAPTIONS (ZapCap)
    // ============================================
    let finalVideoWithCaptions = finalVideoUpload.secure_url;

    if (userSettings.caption_enabled) {
      console.log(`[${data.video_id}] Adding captions`);

      // Create ZapCap task
      const taskId = await clients.zapcap.createCaptionTask(
        data.video_id,
        captionTemplateId
      );

      // Wait for transcript
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s for transcription

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

      console.log(`[${data.video_id}] Captions added`);
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

  // Parse grouping data
  const grouping = JSON.parse(data.grouping);
  const slotInfo = grouping[index];

  const isKeyframe = slot.images.length > 1;
  const firstImage = slot.images[0];
  const secondImage = isKeyframe ? slot.images[1] : null;

  // Upload images to Cloudinary
  const firstImageUpload = await clients.cloudinary.uploadImage(
    firstImage.data,
    firstImage.name
  );

  let secondImageUpload = null;
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
