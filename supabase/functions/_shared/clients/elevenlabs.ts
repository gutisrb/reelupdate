// ElevenLabs API Client

import { API_KEYS, API_ENDPOINTS } from '../config.ts';
import type { ElevenLabsMusicResponse } from '../types.ts';

export class ElevenLabsClient {
  private apiKey = API_KEYS.ELEVENLABS;

  /**
   * Generate background music based on mood
   */
  async generateMusic(prompt: string): Promise<string> {
    const body = {
      text: prompt,
      duration_seconds: 30, // Adjust based on video length
      prompt_influence: 0.3,
    };

    const response = await fetch(API_ENDPOINTS.elevenlabs.musicCompose, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs music generation failed: ${error}`);
    }

    const data: ElevenLabsMusicResponse = await response.json();

    // Poll for completion if needed
    if (data.status === 'pending') {
      return await this.waitForMusicGeneration(data.music_id);
    }

    if (!data.audio_url) {
      throw new Error('No audio URL returned from ElevenLabs');
    }

    return data.audio_url;
  }

  /**
   * Wait for music generation to complete
   */
  private async waitForMusicGeneration(musicId: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s

      const response = await fetch(API_ENDPOINTS.elevenlabs.getMusicGeneration(musicId), {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check music generation status');
      }

      const data: ElevenLabsMusicResponse = await response.json();

      if (data.status === 'complete' && data.audio_url) {
        return data.audio_url;
      }

      if (data.status === 'failed') {
        throw new Error('ElevenLabs music generation failed');
      }

      attempts++;
    }

    throw new Error('Music generation timed out');
  }

  /**
   * Generate music prompt from video mood/description
   */
  generateMusicPrompt(mood: string, description: string): string {
    // This creates a prompt for ElevenLabs based on the video mood
    // Based on the prompt from your Make.com blueprint
    return `Instrumental ${mood} track, no vocals, modern production, subtle background music suitable for real estate video, mid-tempo 105 BPM, clean mix, warm pads, light percussion`;
  }
}
