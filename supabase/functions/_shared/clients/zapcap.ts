// ZapCap API Client

import { API_KEYS, VIDEO_GENERATION_CONFIG, API_ENDPOINTS } from '../config.ts';
import type { ZapCapTaskResponse, ZapCapTranscriptResponse } from '../types.ts';

export class ZapCapClient {
  private apiKey = API_KEYS.ZAPCAP;
  private config = VIDEO_GENERATION_CONFIG.captions;

  /**
   * Create caption task for a video (2-step process)
   */
  async createCaptionTask(
    videoUrl: string,
    templateId: string
  ): Promise<{ taskId: string; videoId: string }> {
    // Step 1: Create video in ZapCap from URL
    const createVideoResponse = await fetch(API_ENDPOINTS.zapcap.createVideo, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: videoUrl }),  // ✅ Correct format: {"url": "..."}
    });

    if (!createVideoResponse.ok) {
      const error = await createVideoResponse.text();
      throw new Error(`ZapCap video creation failed: ${error}`);
    }

    const videoData = await createVideoResponse.json();
    const zapCapVideoId = videoData.id;  // Get video ID from ZapCap

    // Step 2: Create caption task for the video
    const createTaskBody = {
      templateId,
      autoApprove: this.config.autoApprove,
      language: this.config.language,
      renderOptions: this.config.renderOptions,
    };

    const createTaskResponse = await fetch(API_ENDPOINTS.zapcap.createTask(zapCapVideoId), {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createTaskBody),
    });

    if (!createTaskResponse.ok) {
      const error = await createTaskResponse.text();
      throw new Error(`ZapCap task creation failed: ${error}`);
    }

    const taskData: ZapCapTaskResponse = await createTaskResponse.json();
    return {
      taskId: taskData.taskId,
      videoId: zapCapVideoId
    };
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

    const data = await response.json();
    console.log(`[ZapCap] convertTranscript response for ${videoId}:`, JSON.stringify(data));

    if (!data || !data.transcript || !Array.isArray(data.transcript)) {
      throw new Error(`Invalid ZapCap transcript response: ${JSON.stringify(data)}`);
    }

    return data.transcript.map((w: any) => w.word).join(' ');
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
