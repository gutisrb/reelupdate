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
   * Upload from buffer (Uint8Array or ArrayBuffer)
   * Generic upload method for any resource type
   */
  async uploadFromBuffer(
    buffer: Uint8Array | ArrayBuffer,
    filename: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
  ): Promise<CloudinaryUploadResponse> {
    const formData = new FormData();
    const blob = new Blob([buffer]);
    formData.append('file', blob, filename);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('resource_type', resourceType);

    const endpoint = resourceType === 'image' ? 'image' : resourceType === 'video' ? 'video' : 'raw';
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/${endpoint}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudinary ${resourceType} upload failed: ${error}`);
    }

    return await response.json();
  }

  /**
   * Assemble final video with clips + audio layers
   * NOTE: Subtitle parameters are deprecated - use in-house caption rendering instead
   */
  assembleVideo(
    clipUrls: string[],
    voiceoverUrl: string,
    musicUrl: string,
    totalDuration: number,
    musicVolume: number = -60,
    /** @deprecated Use in-house caption rendering via caption-compositor.ts */
    subtitlePublicId?: string,
    /** @deprecated Use in-house caption rendering via caption-compositor.ts */
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

    // NOTE: Subtitle overlay code removed - now handled by in-house caption rendering
    // See caption-compositor.ts for the new caption compositing system
    // The old Cloudinary l_subtitles transformation had limited styling support

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
