// Google AI (Gemini) API Client

import { API_KEYS, API_ENDPOINTS } from '../config.ts';
import type { VoiceScriptResponse, GoogleTTSResponse } from '../types.ts';

export class GoogleAIClient {
  private apiKey = API_KEYS.GOOGLE_AI;

  /**
   * Generate voiceover script using Gemini 3.0
   */
  async generateVoiceoverScript(propertyData: any, visualContext: string, videoLength: number = 25, scriptHook?: string): Promise<string> {
    // ... Word count logic remains the same ...
    const wordCountRange = videoLength >= 30 ? '80–85 reči' : '70–75 reči';
    const hookWordLimit = videoLength >= 30 ? '≤14 reči' : '≤12 reči';

    const prompt = `Ti si performance copywriter za kratke nekretninske videoe na Instagramu. Tvoj VO mora zadržati gledanje... [Full prompt content]`;

    const body = {
      contents: [{
        parts: [{ text: prompt }],
      }],
      generationConfig: {
        temperature: 1.0,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(
      `${API_ENDPOINTS.google.geminiText}?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini 3.0 script generation failed: ${error}`);
    }

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text;

    if (!text) throw new Error('No text returned from Gemini 3.0');

    try {
      const parsed: VoiceScriptResponse = JSON.parse(text);
      return parsed.voice_text;
    } catch (e) {
      // Fallback for non-JSON responses if any
      return text;
    }
  }

  /**
   * Ported from OpenAI: Analyze images for video generation using Gemini 3.0 (Multimodal)
   */
  async analyzeImagesForVideo(
    firstImageUrl: string,
    secondImageUrl: string | null,
    prompt: string
  ): Promise<any> {
    console.log(`[GoogleAIClient] Analyzing images for video with Gemini 3.0...`);

    const imageParts: any[] = [];

    // Fetch and convert first image
    try {
      const resp1 = await fetch(firstImageUrl);
      const blob1 = await resp1.arrayBuffer();
      const base64_1 = btoa(String.fromCharCode(...new Uint8Array(blob1)));
      imageParts.push({ inline_data: { mime_type: "image/jpeg", data: base64_1 } });
    } catch (e) { console.error("[GoogleAIClient] Failed to fetch first image", e); }

    // Fetch and convert second image if exists
    if (secondImageUrl) {
      try {
        const resp2 = await fetch(secondImageUrl);
        const blob2 = await resp2.arrayBuffer();
        const base64_2 = btoa(String.fromCharCode(...new Uint8Array(blob2)));
        imageParts.push({ inline_data: { mime_type: "image/jpeg", data: base64_2 } });
      } catch (e) { console.error("[GoogleAIClient] Failed to fetch second image", e); }
    }

    const body = {
      contents: [{
        parts: [
          { text: prompt },
          ...imageParts
        ],
      }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(
      `${API_ENDPOINTS.google.geminiVision}?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini 3.0 Vision failed: ${error}`);
    }

    const data = await response.json();
    const content = this.safeExtractText(data);

    if (!content) {
      console.error('[GoogleAIClient] Empty response from Gemini 3.0 Vision', JSON.stringify(data));
      throw new Error('No content returned from Gemini 3.0 Vision');
    }

    const parsed = JSON.parse(content);
    console.log(`[GoogleAIClient] Vision analysis complete. Prompt: "${parsed.luma_prompt?.substring(0, 50)}..."`);
    return parsed;
  }

  /**
   * Ported from OpenAI: Optimize image editing instruction for Nano Banana
   */
  async optimizeImagePrompt(instruction: string): Promise<string> {
    const SYSTEM_PROMPT = `You rewrite a user instruction into ONE clear, robust English command for the image-editing model google/nano-banana-edit.
Rules:
- Output ONE line of plain English.
- FOCUS on the "Insert..." text structure: "Insert the main subject from image 2 into image 1 [placement description]."
- Use "main subject" or the specific object name if the user provides it.
- Ensure the instruction explicitly states WHERE to place it.
- REMOVE technical terms like "match perspective", "lens", "focal length", "scale", or "lighting".`;

    const body = {
      contents: [{
        parts: [{ text: `${SYSTEM_PROMPT}\n\nUser Instruction: ${instruction}` }],
      }],
      generationConfig: {
        temperature: 1.0,
        maxOutputTokens: 300
      }
    };

    const response = await fetch(
      `${API_ENDPOINTS.google.geminiText}?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      console.warn('Gemini 3.0 prompt optimization failed, using original.');
      return instruction;
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || instruction;
  }

  /**
   * Generate TTS audio using Gemini TTS
   */
  async generateTTS(text: string, voiceId: string, styleInstructions?: string): Promise<ArrayBuffer> {
    // Determine model and voice name from voiceId (e.g. "Zephyr-flash" -> model: Flash, voice: Zephyr)
    let endpoint = API_ENDPOINTS.google.geminiTTSFlash; // Default to Flash
    let voiceName = voiceId;

    if (voiceId.endsWith('-pro')) {
      endpoint = API_ENDPOINTS.google.geminiTTSPro;
      voiceName = voiceId.replace('-pro', '');
    } else if (voiceId.endsWith('-flash')) {
      endpoint = API_ENDPOINTS.google.geminiTTSFlash;
      voiceName = voiceId.replace('-flash', '');
    }

    // Gemini TTS style instructions are prepended to the text (from Make.com blueprint line 4097)
    // Format: "[Style instructions]: [text]"
    // Example: "Speak with warm, confident delivery in a sophisticated professional tone: [voiceover text]"
    const textWithStyle = styleInstructions
      ? `${styleInstructions}: ${text}`
      : text;

    const body = {
      contents: [{
        parts: [{ text: textWithStyle }],
      }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName,
            },
          },
        },
      },
    };

    const response = await fetch(
      `${endpoint}?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini TTS failed: ${error}`);
    }

    const data: GoogleTTSResponse = await response.json();
    const base64Audio = this.safeExtractInlineData(data);

    if (!base64Audio) {
      console.error('[Gemini TTS] Response structure:', JSON.stringify(data, null, 2));
      throw new Error('No audio data returned from Gemini TTS. Possible safety block?');
    }

    console.log(`[Gemini TTS] Base64 audio length: ${base64Audio.length} chars`);

    // Decode base64 to ArrayBuffer
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`[Gemini TTS] Decoded audio: ${bytes.length} bytes`);

    // Wrap PCM data in WAV container so Cloudinary recognizes it
    const wavBuffer = this.wrapPCMInWAV(bytes.buffer);
    console.log(`[Gemini TTS] WAV file size: ${wavBuffer.byteLength} bytes`);

    return wavBuffer;
  }

  /**
   * Wrap raw PCM audio data in WAV file format
   * Gemini TTS returns LINEAR16 PCM at 24kHz mono
   */
  private wrapPCMInWAV(pcmData: ArrayBuffer): ArrayBuffer {
    const pcmBytes = new Uint8Array(pcmData);
    const sampleRate = 24000; // Gemini TTS default
    const numChannels = 1; // Mono
    const bitsPerSample = 16; // LINEAR16
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmBytes.length;
    const fileSize = 36 + dataSize; // WAV header is 44 bytes, minus 8 for RIFF header

    // Create WAV file buffer
    const wavBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(wavBuffer);

    // Write WAV header
    // RIFF header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize, true);
    this.writeString(view, 8, 'WAVE');

    // fmt chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (1 = PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Copy PCM data
    const wavBytes = new Uint8Array(wavBuffer);
    wavBytes.set(pcmBytes, 44);

    return wavBuffer;
  }

  /**
   * General purpose chat completion for Gemini 3.0 Pro/Flash
   */
  async chat(params: {
    messages: { role: string; content: string }[];
    temperature?: number;
    responseMimeType?: string;
  }): Promise<any> {
    const body = {
      contents: params.messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      generationConfig: {
        temperature: params.temperature ?? 1.0,
        responseMimeType: params.responseMimeType
      }
    };

    const response = await fetch(
      `${API_ENDPOINTS.google.geminiText}?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini 3.0 chat failed: ${error}`);
    }

    const data = await response.json();
    const text = this.safeExtractText(data);

    if (!text) {
      console.error('[GoogleAIClient] Chat response structure missing candidates/content:', JSON.stringify(data));
      throw new Error('Gemini 3.0 chat returned no content. This usually means a safety block or quota limit.');
    }

    // Return in a structure similar to OpenAI for compatibility if needed, 
    // or just return the raw text if expected by the caller.
    return {
      choices: [{
        message: {
          content: text
        }
      }]
    };
  }

  /**
   * Safe extraction of text from Gemini response structure
   */
  private safeExtractText(data: any): string | null {
    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return null;
    }
    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Safe extraction of inline audio data from Gemini response structure
   */
  private safeExtractInlineData(data: any): string | null {
    if (!data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
      return null;
    }
    return data.candidates[0].content.parts[0].inlineData.data;
  }

  /**
   * Helper to write string to DataView
   */
  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
}
