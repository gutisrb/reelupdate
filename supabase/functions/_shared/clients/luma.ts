// Luma AI Dream Machine Client

import { API_KEYS, VIDEO_GENERATION_CONFIG, API_ENDPOINTS } from '../config.ts';
import type { LumaGenerationResponse } from '../types.ts';

export class LumaClient {
  private apiKey = API_KEYS.LUMA;
  private config = VIDEO_GENERATION_CONFIG.luma;

  /**
   * Create a new video generation
   */
  async createGeneration(
    prompt: string,
    firstImageUrl: string,
    secondImageUrl?: string
  ): Promise<LumaGenerationResponse> {
    const body: any = {
      prompt,
      negative_prompt: this.config.negative_prompt,
      model: this.config.model,
      resolution: this.config.resolution,
      duration: this.config.duration,
      aspect_ratio: this.config.aspect_ratio,
      keyframes: {
        frame0: { type: 'image', url: firstImageUrl },
      },
    };

    // Add second keyframe if provided (frame-to-frame mode)
    if (secondImageUrl) {
      body.keyframes.frame1 = { type: 'image', url: secondImageUrl };
    }

    const response = await fetch(API_ENDPOINTS.luma.generations, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Luma generation failed: ${error}`);
    }

    return await response.json();
  }

  /**
   * Get generation status
   */
  async getGeneration(generationId: string): Promise<LumaGenerationResponse> {
    const response = await fetch(API_ENDPOINTS.luma.getGeneration(generationId), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get Luma generation: ${error}`);
    }

    return await response.json();
  }

  /**
   * Poll until generation is complete
   */
  async waitForCompletion(generationId: string): Promise<string> {
    let attempts = 0;

    while (attempts < this.config.max_poll_attempts) {
      const generation = await this.getGeneration(generationId);

      if (generation.state === 'completed' && generation.assets?.video) {
        return generation.assets.video;
      }

      if (generation.state === 'failed') {
        throw new Error(`Luma generation failed: ${generation.failure_reason || 'Unknown error'}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, this.config.poll_interval_ms));
      attempts++;
    }

    throw new Error(`Luma generation timed out after ${this.config.max_poll_attempts} attempts`);
  }
}
