// Shared TypeScript types for Edge Functions

export interface PropertyData {
  title: string;
  price: string;
  location: string;
  size: string;
  beds: string;
  baths: string;
  sprat: string;
  extras: string;
}

export interface ImageSlot {
  id: string;
  mode: 'image-to-video' | 'frame-to-frame';
  images: { data: ArrayBuffer; name: string; mime: string }[];
}

export interface VideoGenerationRequest {
  video_id: string;
  user_id: string;
  property_data: PropertyData;
  image_slots: ImageSlot[];
  grouping: string; // JSON string of slot metadata
  slot_mode_info: string;
  total_images: number;
  caption_video_url?: string; // Browser-rendered caption overlay video
  logo_size_percent?: number;
}

export interface UserSettings {
  voice_id: string;
  voice_language_code: string;
  voice_style_instructions?: string;
  logo_url: string | null;
  logo_position: string;
  logo_size_percent: number;
  caption_template_id: string | null;
  caption_enabled: boolean;
  music_preference: 'auto_generate' | 'library_pick' | 'custom';
  selected_custom_music_id: string | null;
  default_music_volume_db: number;
  post_description_template: string | null;
  caption_system?: 'zapcap' | 'whisper';
  caption_style_type?: 'template' | 'custom';
  caption_font_family?: string;
  caption_font_size?: number;
  caption_font_color?: string;
  caption_bg_color?: string;
  caption_bg_opacity?: number;
  caption_font_weight?: string;
  caption_uppercase?: boolean;
  caption_stroke_color?: string;
  caption_stroke_width?: number;
  caption_shadow_color?: string;
  caption_shadow_blur?: number;
  caption_shadow_x?: number;
  caption_shadow_y?: number;
  caption_position?: string;
  caption_animation?: string;
  caption_max_lines?: number;
  caption_emojis?: boolean;
  caption_single_word?: boolean;
}

export interface ClipData {
  slot_index: number;
  luma_generation_id: string;
  luma_prompt: string;
  clip_url: string;
  first_image_url: string;
  second_image_url: string | null;
  is_keyframe: boolean;
  description?: string;
  mood?: string;
}

export interface AudioData {
  voiceover_script: string;
  voiceover_url: string;
  music_url: string;
  music_source: 'auto_generated' | 'library' | 'custom';
}

export interface CaptionData {
  zapcap_task_id: string;
  transcript: string;
  corrections_made: boolean;
  final_url: string;
}

export interface LumaGenerationResponse {
  id: string;
  state: 'queued' | 'dreaming' | 'completed' | 'failed';
  assets?: {
    video?: string;
  };
  failure_reason?: string;
}

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  duration?: number;
}

export interface GPT4VisionResponse {
  is_keyframe: boolean;
  description: string;
  luma_prompt: string;
  mood: string;
}

export interface VoiceScriptResponse {
  voice_text: string;
}

export interface GoogleTTSResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        inlineData: {
          data: string; // base64 PCM audio
        };
      }>;
    };
  }>;
}

export interface ElevenLabsMusicResponse {
  music_id: string;
  status: 'pending' | 'complete' | 'failed';
  audio_url?: string;
}

export interface ZapCapTaskResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  downloadUrl?: string;
}

export interface ZapCapTranscriptResponse {
  transcript: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}
