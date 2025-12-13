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

    // Extract public_id from filename (remove extension)
    const publicId = filename.replace(/\.[^/.]+$/, '');

    formData.append('file', blob, filename);
    formData.append('public_id', publicId);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('resource_type', 'auto');

    console.log(`[Cloudinary] Uploading image with public_id: ${publicId}`);

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

    const result = await response.json();
    console.log(`[Cloudinary] Image upload successful, returned public_id: ${result.public_id}`);

    return result;
  }

  /**
   * Upload video/audio to Cloudinary
   */
  async uploadVideo(videoData: ArrayBuffer | string, filename: string): Promise<CloudinaryUploadResponse> {
    const formData = new FormData();

    // Extract public_id from filename (remove extension)
    const publicId = filename.replace(/\.[^/.]+$/, '');

    if (typeof videoData === 'string') {
      // Fetch the URL (this triggers Cloudinary to process transformation URLs)
      console.log(`[Cloudinary] Fetching video from URL: ${videoData}`);
      const videoResponse = await fetch(videoData);
      if (!videoResponse.ok) {
        const errorText = await videoResponse.text();
        throw new Error(`Cloudinary upload aborted: failed to fetch URL (${videoResponse.status}): ${errorText}`);
      }
      const blob = await videoResponse.blob();
      console.log(`[Cloudinary] uploadVideo(url) blob size: ${blob.size} bytes`);
      if (blob.size === 0) {
        throw new Error('Cloudinary upload aborted: fetched URL returned empty file');
      }
      formData.append('file', blob, filename);
    } else {
      // Cloudinary sometimes rejects raw blobs from Deno as "Empty file".
      // Send as a base64 data URI to guarantee payload delivery.
      const bytes = videoData instanceof Uint8Array ? videoData : new Uint8Array(videoData);
      console.log(`[Cloudinary] uploadVideo(buffer) byte length: ${bytes.length}`);
      if (bytes.length === 0) {
        throw new Error('Cloudinary upload aborted: zero-length buffer');
      }
      const mimeType = this.getMimeTypeFromFilename(filename);
      const base64 = this.arrayBufferToBase64(bytes);
      console.log(`[Cloudinary] uploadVideo base64 length: ${base64.length}`);
      formData.append('file', `data:${mimeType};base64,${base64}`);
    }

    // Force Cloudinary to use our filename as public_id (without extension)
    formData.append('public_id', publicId);
    console.log(`[Cloudinary] Uploading with public_id: ${publicId}`);

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

    const result = await response.json();
    console.log(`[Cloudinary] Upload successful, returned public_id: ${result.public_id}`);

    return result;
  }

  /**
   * Upload video from a remote URL directly (Cloudinary fetches it).
   * This is efficient for "baking" transformation URLs into static assets.
   */
  async uploadVideoFromUrl(videoUrl: string, publicId: string): Promise<CloudinaryUploadResponse> {
    const formData = new FormData();

    formData.append('file', videoUrl);
    formData.append('public_id', publicId);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('resource_type', 'video');

    console.log(`[Cloudinary] Triggering remote upload (baking) for public_id: ${publicId}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudinary remote video upload failed: ${error}`);
    }

    const result = await response.json();
    console.log(`[Cloudinary] Remote upload successful, new public_id: ${result.public_id}`);

    return result;
  }

  /**
   * Convert ArrayBuffer/Uint8Array to base64 string
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.length; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  /**
   * Derive MIME type from filename extension for audio/video
   */
  private getMimeTypeFromFilename(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.mp3')) return 'audio/mpeg';
    if (lower.endsWith('.wav')) return 'audio/wav';
    if (lower.endsWith('.m4a')) return 'audio/mp4';
    if (lower.endsWith('.aac')) return 'audio/aac';
    if (lower.endsWith('.ogg')) return 'audio/ogg';
    if (lower.endsWith('.mp4')) return 'video/mp4';
    if (lower.endsWith('.mov')) return 'video/quicktime';
    return 'video/mp4';
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

    // Extract public_id from filename (remove extension)
    const publicId = filename.replace(/\.[^/.]+$/, '');

    formData.append('file', blob, filename);
    formData.append('public_id', publicId);
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

    const result = await response.json();
    console.log(`[Cloudinary] ${resourceType} upload successful, returned public_id: ${result.public_id}`);

    return result;
  }

  /**
   * Assemble final video with clips + audio layers
   * NOTE: Logo and captions should be added AFTER assembly for proper layering
   */
  assembleVideo(
    clipUrls: string[],
    voiceoverUrl: string,
    musicUrl: string,
    totalDuration: number,
    musicVolume: number = -60
  ): string {
    // Extract public IDs from Cloudinary URLs
    const clipPublicIds = clipUrls.map(url => this.extractPublicId(url));
    const voicePublicId = this.extractPublicId(voiceoverUrl);
    const musicPublicId = this.extractPublicId(musicUrl);

    console.log(`[Cloudinary] Extracted public IDs:`);
    console.log(`[Cloudinary]   Clips: ${clipPublicIds.join(', ')}`);
    console.log(`[Cloudinary]   Voiceover: ${voicePublicId}`);
    console.log(`[Cloudinary]   Music: ${musicPublicId}`);

    if (clipPublicIds.length === 0) {
      throw new Error('No clips provided for video assembly');
    }

    // Build transformation array mirroring the known-working pattern
    const transformations: string[] = [];

    // Start with first clip as base
    const baseClipId = clipPublicIds[0];

    // Normalize aspect ratio and size on base
    transformations.push('ar_9:16,c_fill,w_1080,h_1920,ac_none');

    // Concatenate additional clips using fl_splice with consistent sizing
    for (let i = 1; i < clipPublicIds.length; i++) {
      transformations.push(
        `l_video:${clipPublicIds[i]},ar_9:16,c_fill,w_1080,h_1920,fl_splice,ac_none`,
        'fl_layer_apply'
      );
    }

    // Add background music layer
    // Use large loop count (999) to ensure music plays for entire duration
    // Cloudinary accepts dB notation directly (e.g., -60) for volume
    transformations.push(
      `l_audio:${musicPublicId},so_0,du_${totalDuration},e_loop:999,e_volume:${musicVolume}`,
      'fl_layer_apply'
    );

    // Add voiceover layer (no volume adjustment - keep original level)
    transformations.push(
      `l_audio:${voicePublicId},so_0,du_${totalDuration}`,
      'fl_layer_apply'
    );

    // Final volume adjustment (apply to combined audio)
    // This boosts the overall audio level after mixing music and voiceover
    transformations.push('e_volume:20');

    // Additional settings
    transformations.push(
      'f_mp4',           // Force MP4 format
      'vc_h264',         // Use H.264 codec for compatibility
      'q_auto:good'      // Auto quality (good preset)
      // Note: ac_none removed from here - only use in splice operations
    );

    // Build final URL
    console.log(`[Cloudinary] DEBUG: Total transformations: ${transformations.length}`);
    console.log(`[Cloudinary] DEBUG: Transformations array:`, JSON.stringify(transformations, null, 2));
    const transformationString = transformations.join('/');
    console.log(`[Cloudinary] DEBUG: Transformation string length: ${transformationString.length} chars`);
    console.log(`[Cloudinary] DEBUG: First 500 chars: ${transformationString.substring(0, 500)}`);
    return `https://res.cloudinary.com/${this.cloudName}/video/upload/${transformationString}/${baseClipId}.mp4`;
  }

  /**
   * Add logo overlay to an existing Cloudinary video URL
   * This should be called AFTER video assembly for proper layering
   */
  addLogoOverlay(
    videoUrl: string,
    logoUrl: string,
    logoPosition: string = 'corner_top_right',
    logoSizePercent: number = 15
  ): string {
    if (!logoUrl || !logoUrl.includes('cloudinary.com')) {
      console.log('[Cloudinary] No valid logo URL provided, skipping logo overlay');
      return videoUrl;
    }

    const logoPublicId = this.extractPublicId(logoUrl);
    console.log(`[Cloudinary] Adding logo overlay to final video: ${logoPublicId}`);
    console.log(`[Cloudinary] Logo position: ${logoPosition}, size: ${logoSizePercent}%`);

    // Determine gravity based on position setting
    let gravity = 'north_east'; // Default: top-right
    let xOffset = 20; // Reduced from 30 for tighter corner
    let yOffset = 20; // Reduced from 50 for tighter corner

    const pos = String(logoPosition).toLowerCase(); // Ensure string comparison
    console.log(`[Cloudinary] Debug: Parsing position '${pos}'`);

    if (pos.includes('top') && pos.includes('left')) {
      gravity = 'north_west';
    } else if (pos.includes('top') && pos.includes('right')) {
      gravity = 'north_east';
    } else if (pos.includes('bottom') && pos.includes('left')) {
      gravity = 'south_west';
      yOffset = 40; // Slightly higher from bottom for safe area
    } else if (pos.includes('bottom') && pos.includes('right')) {
      gravity = 'south_east';
      yOffset = 40; // Slightly higher from bottom for safe area
    } else if (pos.includes('center') || pos.includes('middle')) {
      gravity = 'center';
      xOffset = 0;
      yOffset = 0;
    }

    // Calculate logo width based on percentage of video width (1080px)
    const logoWidth = Math.round(1080 * logoSizePercent / 100);

    // Convert slashes to colons for Cloudinary folder paths
    const logoPublicIdForTransform = logoPublicId.replace(/\//g, ':');

    // Build logo transformation (applied to base video)
    // Format: l_image:public_id,g_gravity,x_offset,y_offset,w_width,o_opacity/fl_layer_apply
    const logoTransformation = `l_image:${logoPublicIdForTransform},g_${gravity},x_${xOffset},y_${yOffset},w_${logoWidth},o_80/fl_layer_apply`;

    console.log(`[Cloudinary] Logo transformation final: ${logoTransformation}`);

    // Insert logo transformation BEFORE the final format flags (f_mp4/vc_h264/q_auto)
    // This ensures logo is added to the video content, not just the container
    const urlWithLogo = videoUrl.replace(
      /\/(f_mp4|vc_h264|q_auto)/,
      `/${logoTransformation}/$1`
    );

    console.log(`[Cloudinary] Logo overlay added successfully`);
    return urlWithLogo;
  }

  /**
   * Extract Cloudinary public ID from URL
   * Handles various Cloudinary URL formats
   */
  public extractPublicId(url: string): string {
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

  /**
   * Extract public ID from a full Cloudinary URL more strictly:
   * - takes the portion after /upload/
   * - strips version and file extension
   * - ignores any transformation segments
   */
  public extractPublicIdFromCloudinaryUrl(url: string): string {
    try {
      const [, afterUpload] = url.split('/upload/');
      if (!afterUpload) return url;

      const parts = afterUpload.split('/');
      // The public ID is the last segment after transformations
      const last = parts[parts.length - 1];
      // Remove extension
      const withoutExt = last.replace(/\.[^/.]+$/, '');
      return withoutExt;
    } catch {
      return this.extractPublicId(url);
    }
  }
}
