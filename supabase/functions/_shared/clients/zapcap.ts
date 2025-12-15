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
  async getTranscript(videoId: string, taskId: string): Promise<{ text: string; raw: any[] }> {
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

    // Handle direct array response (Primary case based on logs)
    if (Array.isArray(data)) {
      return {
        text: data.map((w: any) => w.text || w.word).join(' '),
        raw: data
      };
    }

    // Handle object response (Legacy/Fallback)
    if (data && data.transcript && Array.isArray(data.transcript)) {
      return {
        text: data.transcript.map((w: any) => w.text || w.word).join(' '),
        raw: data.transcript
      };
    }

    throw new Error(`Invalid ZapCap transcript response: ${JSON.stringify(data)}`);
  }

  /**
   * Update transcript with corrections
   */
  async updateTranscript(
    videoId: string,
    taskId: string,
    correctedTranscript: string,
    originalItems: any[] = []
  ): Promise<void> {

    // 1. Calculate time boundaries from original items if available
    let startTime = 0;
    let endTime = 0;

    if (originalItems && originalItems.length > 0) {
      startTime = originalItems[0].start_time || 0;
      endTime = originalItems[originalItems.length - 1].end_time || 0;
    }

    // prevent invalid duration
    if (endTime <= startTime) {
      endTime = startTime + 5; // Fallback 5s duration
    }

    const totalDuration = endTime - startTime;

    // 2. Prepare new words
    const words = correctedTranscript.split(/\s+/).filter(w => w.length > 0);
    const durationPerWord = totalDuration / words.length;

    // 3. Generate new items with interpolated timestamps
    const body = words.map((word, index) => {
      const wordStart = startTime + (index * durationPerWord);
      const wordEnd = wordStart + durationPerWord;

      return {
        type: 'word',
        text: word,
        start_time: Number(wordStart.toFixed(3)),
        end_time: Number(wordEnd.toFixed(3)),
      };
    });

    console.log(`[ZapCap] Updating transcript with ${body.length} words (Time: ${startTime.toFixed(2)} -> ${endTime.toFixed(2)})`);

    const response = await fetch(API_ENDPOINTS.zapcap.updateTranscript(videoId, taskId), {
      method: 'PUT',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update transcript: ${error}`);
    }
  }

  /**
   * Approve transcript and finalize video
   */
  async approveTranscript(videoId: string, taskId: string): Promise<void> {
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

    // Approval triggers rendering, but returns no data (204 or empty info).
    // We must poll for completion separately.
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
