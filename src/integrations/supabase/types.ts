export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            user_settings: {
                Row: {
                    user_id: string
                    created_at: string
                    updated_at: string
                    voice_id: string
                    voice_language_code: string
                    logo_url: string | null
                    logo_position: string
                    logo_size_percent: number
                    caption_template_id: string | null
                    caption_enabled: boolean
                    music_preference: string
                    selected_custom_music_id: string | null
                    default_music_volume_db: number
                    post_description_template: string | null
                    caption_style_type: 'template' | 'custom'
                    caption_font_family: string
                    caption_font_size: number
                    caption_font_color: string
                    caption_bg_color: string
                    caption_bg_opacity: number
                }
                Insert: {
                    user_id: string
                    created_at?: string
                    updated_at?: string
                    voice_id?: string
                    voice_language_code?: string
                    logo_url?: string | null
                    logo_position?: string
                    logo_size_percent?: number
                    caption_template_id?: string | null
                    caption_enabled?: boolean
                    music_preference?: string
                    selected_custom_music_id?: string | null
                    default_music_volume_db?: number
                    post_description_template?: string | null
                    caption_style_type?: 'template' | 'custom'
                    caption_font_family?: string
                    caption_font_size?: number
                    caption_font_color?: string
                    caption_bg_color?: string
                    caption_bg_opacity?: number
                }
                Update: {
                    user_id?: string
                    created_at?: string
                    updated_at?: string
                    voice_id?: string
                    voice_language_code?: string
                    logo_url?: string | null
                    logo_position?: string
                    logo_size_percent?: number
                    caption_template_id?: string | null
                    caption_enabled?: boolean
                    music_preference?: string
                    selected_custom_music_id?: string | null
                    default_music_volume_db?: number
                    post_description_template?: string | null
                    caption_style_type?: 'template' | 'custom'
                    caption_font_family?: string
                    caption_font_size?: number
                    caption_font_color?: string
                    caption_bg_color?: string
                    caption_bg_opacity?: number
                }
            }
            caption_templates: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    zapcap_template_id: string
                    preview_image_url: string | null
                    style_description: string
                    active: boolean
                    sort_order: number
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    zapcap_template_id: string
                    preview_image_url?: string | null
                    style_description: string
                    active?: boolean
                    sort_order?: number
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    zapcap_template_id?: string
                    preview_image_url?: string | null
                    style_description?: string
                    active?: boolean
                    sort_order?: number
                }
            }
            profiles: {
                Row: {
                    id: string
                    updated_at: string | null
                    username: string | null
                    full_name: string | null
                    avatar_url: string | null
                    website: string | null
                    org_name: string | null
                    video_credits_remaining: number
                }
                Insert: {
                    id: string
                    updated_at?: string | null
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    website?: string | null
                    org_name?: string | null
                    video_credits_remaining?: number
                }
                Update: {
                    id?: string
                    updated_at?: string | null
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    website?: string | null
                    org_name?: string | null
                    video_credits_remaining?: number
                }
            }
        }
    }
}
