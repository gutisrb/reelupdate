// OpenAI API Client

import { API_KEYS, API_ENDPOINTS } from '../config.ts';
import type { GPT4VisionResponse } from '../types.ts';

export class OpenAIClient {
  private apiKey = API_KEYS.OPENAI;

  /**
   * Analyze images with GPT-4o Vision and generate Luma prompt
   */
  async analyzeImagesForVideo(
    firstImageUrl: string,
    secondImageUrl: string | null,
    prompt: string
  ): Promise<GPT4VisionResponse> {
    const images = [
      { type: 'image_url', image_url: { url: firstImageUrl } },
    ];

    if (secondImageUrl) {
      images.push({ type: 'image_url', image_url: { url: secondImageUrl } });
    }

    const body = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...images,
          ],
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
      top_p: 0.5,
    };

    const response = await fetch(API_ENDPOINTS.openai.chatCompletions, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API failed: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    // Parse JSON response
    try {
      return JSON.parse(content);
    } catch (e) {
      throw new Error(`Failed to parse OpenAI response as JSON: ${content}`);
    }
  }

  /**
   * Correct transcript using GPT
   */
  async correctTranscript(
    transcript: string,
    voiceoverScript: string
  ): Promise<string> {
    const prompt = `You are correcting a transcription by comparing it to the original script.

Original voiceover script:
${voiceoverScript}

Transcription to correct:
${transcript}

Return ONLY the corrected transcript with proper Serbian punctuation and capitalization. Make minimal changes - only fix obvious transcription errors.`;

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    };

    const response = await fetch(API_ENDPOINTS.openai.chatCompletions, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI transcript correction failed: ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || transcript;
  }

  /**
   * Transcribe audio using Whisper
   */
  async createTranscription(audioUrl: string): Promise<string> {
    // Fetch audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio for transcription: ${audioResponse.statusText}`);
    }
    const audioBlob = await audioResponse.blob();

    // Prepare FormData
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp3');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word'); // Request word-level timestamps if needed, or segment level

    const response = await fetch(API_ENDPOINTS.openai.audioTranscriptions, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI transcription failed: ${error}`);
    }

    const data = await response.json();
    return this.jsonToSrt(data);
  }

  /**
   * Convert Whisper JSON response to SRT format
   */
  private jsonToSrt(data: any): string {
    if (!data.segments) {
      return '';
    }

    return data.segments.map((segment: any, index: number) => {
      const start = this.formatTime(segment.start);
      const end = this.formatTime(segment.end);
      const text = segment.text.trim();
      return `${index + 1}\n${start} --> ${end}\n${text}\n`;
    }).join('\n');
  }

  private formatTime(seconds: number): string {
    const date = new Date(0);
    date.setMilliseconds(seconds * 1000);
    const isoString = date.toISOString();
    // Extract HH:mm:ss,ms from ISO string (1970-01-01T00:00:00.000Z)
    // We need 00:00:00,000 format
    return isoString.substring(11, 23).replace('.', ',');
  }
}
