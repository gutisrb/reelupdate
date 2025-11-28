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
}
