// ElevenLabs API Client

import { API_KEYS, API_ENDPOINTS } from '../config.ts';
import type { ElevenLabsMusicResponse } from '../types.ts';

export class ElevenLabsClient {
  private apiKey = API_KEYS.ELEVENLABS;

  /**
   * Generate background music based on mood
   */
  async generateMusic(prompt: string, durationMs: number = 30000): Promise<string> {
    // Exact format from Make.com blueprint
    const body = {
      prompt: prompt,
      instrumental: true,
      music_length_ms: durationMs,
      output_format: 'mp3_44100_128',
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
   * User's custom format: Simple comma-separated descriptors
   */
  generateMusicPrompt(mood: string, description: string): string {
    // Simple single-line format from user's Make.com blueprint
    // Instrumental, elegant, minimal, warm, modern, corporate, mid-tempo, ambient, subtle, professional
    return `Instrumental, ${mood}, minimal, warm, modern, mid-tempo, ambient, subtle, professional`;
  }
}
