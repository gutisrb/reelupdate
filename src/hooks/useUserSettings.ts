import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserSettings {
  user_id: string;
  voice_id: string;
  voice_language_code: string;
  logo_url: string | null;
  logo_position: string;
  logo_size_percent: number;
  caption_template_id: string | null;
  caption_enabled: boolean;
  music_preference: string;
  selected_custom_music_id: string | null;
  default_music_volume_db: number;
  post_description_template: string | null;
  caption_style_type: 'template' | 'custom';
  caption_font_family: string;
  caption_font_size: number;
  caption_font_color: string;
  caption_bg_color: string;
  caption_bg_opacity: number;
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

export const useUserSettings = (user: User | null) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSettings(null);
      return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Settings not found, create default settings
            const defaultSettings = {
              user_id: user.id,
              voice_id: 'en-US-Standard-A',
              voice_language_code: 'en-US',
              logo_url: null,
              logo_position: 'corner_top_right',
              logo_size_percent: 15,
              caption_template_id: null,
              caption_enabled: false,
              music_preference: 'auto_generate',
              selected_custom_music_id: null,
              default_music_volume_db: -60,
              post_description_template: null,
              caption_style_type: 'template' as const,
              caption_font_family: 'Arial',
              caption_font_size: 34,
              caption_font_color: 'FFFFFF',
              caption_bg_color: '000000',
              caption_bg_opacity: 0,
            };

            const { data: newSettings, error: insertError } = await supabase
              .from('user_settings')
              .insert(defaultSettings)
              .select('*')
              .single();

            if (insertError) {
              throw insertError;
            }
            setSettings(newSettings);
          } else {
            throw error;
          }
        } else {
          setSettings(data);
        }
      } catch (err) {
        console.error('Error fetching user settings:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  return { settings, loading, error };
};
