// Cloudinary API Client

import { API_KEYS, CLOUDINARY_CONFIG } from '../config.ts';
import type { CloudinaryUploadResponse } from '../types.ts';

export class CloudinaryClient {
  private cloudName = CLOUDINARY_CONFIG.cloud_name;
  private uploadPreset = CLOUDINARY_CONFIG.upload_preset;

  /**
   * Upload image to Cloudinary
   */
  async uploadImage(imageData: ArrayBuffer, filename: string): Promise<CloudinaryUploadResponse> {
    const formData = new FormData();
    const blob = new Blob([imageData]);
    formData.append('file', blob, filename);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('resource_type', 'auto');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudinary image upload failed: ${error}`);
    }

    return await response.json();
  }

  /**
   * Upload video/audio to Cloudinary
   */
  async uploadVideo(videoData: ArrayBuffer | string, filename: string): Promise<CloudinaryUploadResponse> {
    const formData = new FormData();

    if (typeof videoData === 'string') {
      // If it's a URL, use fetch to get the data
      const videoResponse = await fetch(videoData);
      const blob = await videoResponse.blob();
      formData.append('file', blob, filename);
    } else {
      const blob = new Blob([videoData]);
      formData.append('file', blob, filename);
    }

    formData.append('upload_preset', this.uploadPreset);
    formData.append('resource_type', 'video');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudinary video upload failed: ${error}`);
    }

    return await response.json();
  }

  /**
   * Upload raw file (e.g., SRT) to Cloudinary
   */
  async uploadRaw(data: string, filename: string): Promise<CloudinaryUploadResponse> {
    const formData = new FormData();
    const blob = new Blob([data], { type: 'text/plain' });
    formData.append('file', blob, filename);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('resource_type', 'raw');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/raw/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudinary raw upload failed: ${error}`);
    }

    return await response.json();
  }

  /**
   * Assemble final video with clips + audio layers + optional subtitles
   */
  assembleVideo(
    clipUrls: string[],
    voiceoverUrl: string,
    musicUrl: string,
    totalDuration: number,
    musicVolume: number = -60,
    subtitlePublicId?: string,
    subtitleStyle?: {
      fontFamily?: string;
      fontSize?: number;
      fontWeight?: string;
      color?: string;
      backgroundColor?: string;
      opacity?: number;
      strokeColor?: string;
      strokeWidth?: number;
      shadowColor?: string;
      shadowBlur?: number;
      position?: string;
    }
  ): string {
    // Extract public IDs from Cloudinary URLs
    const clipPublicIds = clipUrls.map(url => this.extractPublicId(url));
    const voicePublicId = this.extractPublicId(voiceoverUrl);
    const musicPublicId = this.extractPublicId(musicUrl);

    if (clipPublicIds.length === 0) {
      throw new Error('No clips provided for video assembly');
    }

    // Build transformation array
    const transformations: string[] = [];

    // Start with first clip as base
    const baseClipId = clipPublicIds[0];

    // Concatenate additional clips using fl_splice
    for (let i = 1; i < clipPublicIds.length; i++) {
      transformations.push(
        `l_video:${clipPublicIds[i]}`,
        'fl_splice',
        'fl_layer_apply'
      );
    }

    // Add background music layer
    const musicVolumePercent = Math.max(1, Math.min(100, Math.round(Math.pow(10, musicVolume / 20) * 100)));

    transformations.push(
      `l_video:${musicPublicId}`,
      'fl_layer_apply',
      `e_volume:${musicVolumePercent}`,
      'fl_splice',
      `e_loop:${Math.ceil(totalDuration / 30)}`
    );

    // Add voiceover layer (full volume)
    transformations.push(
      `l_video:${voicePublicId}`,
      'fl_layer_apply',
      'e_volume:100',
      'fl_splice'
    );

    // Add subtitles if provided
    if (subtitlePublicId) {
      // Default styles
      const font = subtitleStyle?.fontFamily || 'Arial';
      const size = subtitleStyle?.fontSize || 20;
      const weight = subtitleStyle?.fontWeight || '';

      // Construct font string: font_size_weight
      // e.g. Arial_20_bold
      let fontString = `${font}_${size}`;
      if (weight && weight !== 'normal') {
        fontString += `_${weight}`;
      }

      // Construct subtitle transformation
      let subtitleLayer = `l_subtitles:${fontString}:${subtitlePublicId}`;

      // Add style modifiers
      const styleModifiers = [];

      // Font Color
      const color = subtitleStyle?.color ? `co_rgb:${subtitleStyle.color}` : 'co_white';
      styleModifiers.push(color);

      // Background Color & Opacity
      if (subtitleStyle?.backgroundColor) {
        // Cloudinary background opacity is handled via alpha channel in hex or separate opacity param?
        // Usually b_rgb:RRGGBB works. For opacity, we might need b_rgb:RRGGBBAA or o_opacity on the layer.
        // Let's use b_rgb:RRGGBB and o_opacity if provided, but o_ affects text too.
        // Better: b_rgb:RRGGBB
        // If opacity is 0, we don't set background.
        if (subtitleStyle.opacity !== undefined && subtitleStyle.opacity > 0) {
          styleModifiers.push(`b_rgb:${subtitleStyle.backgroundColor}`);
          // Note: Cloudinary doesn't easily support separate background opacity for text background box in l_subtitles 
          // without using specific text_box modes which are complex. 
          // For now, we apply solid background if opacity > 0.
        }
      }

      // Stroke (Border)
      if (subtitleStyle?.strokeWidth && subtitleStyle.strokeWidth > 0) {
        const strokeColor = subtitleStyle.strokeColor || '000000';
        styleModifiers.push(`bo_${subtitleStyle.strokeWidth}px_solid_rgb:${strokeColor}`);
      }

      // Shadow
      if (subtitleStyle?.shadowBlur && subtitleStyle.shadowBlur > 0) {
        // e_shadow:strength
        styleModifiers.push(`e_shadow:${subtitleStyle.shadowBlur * 5}`); // Scale blur to strength roughly
        if (subtitleStyle.shadowColor) {
          styleModifiers.push(`co_rgb:${subtitleStyle.shadowColor}`); // Shadow color usually takes current color, tricky to override
        }
      }

      // Position (Gravity)
      if (subtitleStyle?.position) {
        switch (subtitleStyle.position) {
          case 'top':
            styleModifiers.push('g_north', 'y_50');
            break;
          case 'bottom':
            styleModifiers.push('g_south', 'y_50');
            break;
          case 'middle':
            styleModifiers.push('g_center');
            break;
          default: // auto or custom
            styleModifiers.push('g_south', 'y_50'); // Default to bottom
        }
      } else {
        styleModifiers.push('g_south', 'y_50');
      }

      // Apply the layer
      transformations.push(
        subtitleLayer,
        ...styleModifiers,
        'fl_layer_apply'
      );
    }

    // Additional settings
    transformations.push(
      'f_mp4',           // Force MP4 format
      'vc_h264',         // Use H.264 codec for compatibility
      'q_auto:good',     // Auto quality (good preset)
      'ac_none'          // No audio codec changes
    );

    // Build final URL
    const transformationString = transformations.join('/');
    return `https://res.cloudinary.com/${this.cloudName}/video/upload/${transformationString}/${baseClipId}.mp4`;
  }

  /**
   * Extract Cloudinary public ID from URL
   * Handles various Cloudinary URL formats
   */
  private extractPublicId(url: string): string {
    if (!url) return '';

    // If it's already just an ID (no URL), return as-is
    if (!url.includes('cloudinary.com') && !url.includes('/')) {
      return url;
    }

    try {
      // Example URLs:
      // https://res.cloudinary.com/cloud/video/upload/v1234/abc123.mp4
      // https://res.cloudinary.com/cloud/video/upload/abc123.mp4
      // https://res.cloudinary.com/cloud/video/upload/folder/abc123.mp4
      // https://res.cloudinary.com/cloud/video/upload/v1234/folder/subfolder/abc123.mp4

      // Split by '/upload/' and take everything after
      const parts = url.split('/upload/');
      if (parts.length < 2) return url;

      let pathAfterUpload = parts[1];

      // Remove version (v1234567)
      pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');

      // Remove file extension
      pathAfterUpload = pathAfterUpload.replace(/\.\w+$/, '');

      // Remove any transformation parameters (anything with underscores like w_500)
      // but keep the path
      const segments = pathAfterUpload.split('/');
      const cleanSegments = segments.filter(seg =>
        !seg.match(/^[a-z]_[\w,]+$/) // Filter out transformation params like w_500, q_auto, etc.
      );

      return cleanSegments.join('/');
    } catch (e) {
      console.error('Error extracting public ID from URL:', url, e);
      return url;
    }
  }
}
