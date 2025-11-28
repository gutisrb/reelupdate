// ZapCap API Client

import { API_KEYS, VIDEO_GENERATION_CONFIG, API_ENDPOINTS } from '../config.ts';
import type { ZapCapTaskResponse, ZapCapTranscriptResponse } from '../types.ts';

export class ZapCapClient {
  private apiKey = API_KEYS.ZAPCAP;
  private config = VIDEO_GENERATION_CONFIG.captions;

  /**
   * Create caption task for a video
   */
  async createCaptionTask(
    videoId: string,
    templateId: string
  ): Promise<string> {
    const body = {
      templateId,
      autoApprove: this.config.autoApprove,
      language: this.config.language,
      renderOptions: this.config.renderOptions,
    };

    const response = await fetch(API_ENDPOINTS.zapcap.createTask(videoId), {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ZapCap task creation failed: ${error}`);
    }

    const data: ZapCapTaskResponse = await response.json();
    return data.taskId;
  }

  /**
   * Get task status
   */
  async getTaskStatus(videoId: string, taskId: string): Promise<ZapCapTaskResponse> {
    const response = await fetch(API_ENDPOINTS.zapcap.getTask(videoId, taskId), {
      method: 'GET',
      headers: {
        'x-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get ZapCap task: ${error}`);
    }

    return await response.json();
  }

  /**
   * Get transcript
   */
  async getTranscript(videoId: string, taskId: string): Promise<string> {
    const response = await fetch(API_ENDPOINTS.zapcap.getTranscript(videoId, taskId), {
      method: 'GET',
      headers: {
        'x-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get transcript: ${error}`);
    }

    const data: ZapCapTranscriptResponse = await response.json();
    return data.transcript.map(w => w.word).join(' ');
  }

  /**
   * Update transcript with corrections
   */
  async updateTranscript(videoId: string, taskId: string, correctedTranscript: string): Promise<void> {
    const response = await fetch(API_ENDPOINTS.zapcap.updateTranscript(videoId, taskId), {
      method: 'PUT',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript: correctedTranscript }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update transcript: ${error}`);
    }
  }

  /**
   * Approve transcript and finalize video
   */
  async approveTranscript(videoId: string, taskId: string): Promise<string> {
    const response = await fetch(API_ENDPOINTS.zapcap.approveTranscript(videoId, taskId), {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to approve transcript: ${error}`);
    }

    const data: ZapCapTaskResponse = await response.json();

    if (!data.video_url) {
      throw new Error('No video URL returned after approval');
    }

    return data.video_url;
  }

  /**
   * Poll until captions are complete
   */
  async waitForCompletion(videoId: string, taskId: string): Promise<string> {
    let attempts = 0;

    while (attempts < this.config.max_poll_attempts) {
      const task = await this.getTaskStatus(videoId, taskId);

      if (task.status === 'completed' && task.video_url) {
        return task.video_url;
      }

      if (task.status === 'failed') {
        throw new Error('ZapCap task failed');
      }

      await new Promise(resolve => setTimeout(resolve, this.config.poll_interval_ms));
      attempts++;
    }

    throw new Error(`ZapCap task timed out after ${this.config.max_poll_attempts} attempts`);
  }
}
