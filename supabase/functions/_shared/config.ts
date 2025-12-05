// Configuration and constants for Edge Functions

export const API_KEYS = {
  LUMA: Deno.env.get('LUMA_API_KEY') || '',
  OPENAI: Deno.env.get('OPENAI_API_KEY') || '',
  ELEVENLABS: Deno.env.get('ELEVENLABS_API_KEY') || '',
  ZAPCAP: Deno.env.get('ZAPCAP_API_KEY') || '',
  GOOGLE_AI: Deno.env.get('GOOGLE_AI_API_KEY') || '',
  CLOUDINARY_API_KEY: Deno.env.get('CLOUDINARY_API_KEY') || '',
  CLOUDINARY_API_SECRET: Deno.env.get('CLOUDINARY_API_SECRET') || '',
};

export const CLOUDINARY_CONFIG = {
  cloud_name: 'dyarnpqaq',
  upload_preset: 'ml_default',
};

export const VIDEO_GENERATION_CONFIG = {
  luma: {
    model: 'ray-flash-2',
    resolution: '720p',
    duration: '5s',
    aspect_ratio: '9:16',
    negative_prompt: 'extra rooms, distorted',
    poll_interval_ms: 10000, // Poll every 10 seconds
    max_poll_attempts: 60, // Max 10 minutes
  },
  audio: {
    bgm_volume_db: -60,
    voiceover_volume_db: 0,
    default_language: 'sr-RS',
    default_voice_id: 'sr-RS-Standard-A',
  },
  captions: {
    default_template_id: '6255949c-4a52-4255-8a67-39ebccfaa3ef',
    language: 'sr',
    autoApprove: false,
    renderOptions: {
      styleOptions: {
        top: 70,
        fontSize: 34,
      },
    },
    poll_interval_ms: 15000,
    max_poll_attempts: 40,
  },
};

export const API_ENDPOINTS = {
  luma: {
    generations: 'https://api.lumalabs.ai/dream-machine/v1/generations',
    getGeneration: (id: string) => `https://api.lumalabs.ai/dream-machine/v1/generations/${id}`,
  },
  cloudinary: {
    imageUpload: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`,
    videoUpload: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/video/upload`,
  },
  zapcap: {
    createTask: (videoId: string) => `https://api.zapcap.ai/videos/${videoId}/task`,
    getTask: (videoId: string, taskId: string) => `https://api.zapcap.ai/videos/${videoId}/task/${taskId}`,
    getTranscript: (videoId: string, taskId: string) => `https://api.zapcap.ai/videos/${videoId}/task/${taskId}/transcript`,
    updateTranscript: (videoId: string, taskId: string) => `https://api.zapcap.ai/videos/${videoId}/task/${taskId}/transcript`,
    approveTranscript: (videoId: string, taskId: string) => `https://api.zapcap.ai/videos/${videoId}/task/${taskId}/approve-transcript`,
  },
  google: {
    geminiVision: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
    geminiTTSFlash: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent',
    geminiTTSPro: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-tts:generateContent',
  },
  openai: {
    chatCompletions: 'https://api.openai.com/v1/chat/completions',
    audioTranscriptions: 'https://api.openai.com/v1/audio/transcriptions',
  },
  elevenlabs: {
    musicCompose: 'https://api.elevenlabs.io/v1/music/compose',
    getMusicGeneration: (generationId: string) => `https://api.elevenlabs.io/v1/music/generations/${generationId}`,
  },
  supabase: {
    url: Deno.env.get('SUPABASE_URL') || '',
    serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  },
};
