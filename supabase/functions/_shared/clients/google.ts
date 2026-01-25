// Google AI (Gemini) API Client

import { API_KEYS, API_ENDPOINTS } from '../config.ts';
import type { VoiceScriptResponse, GoogleTTSResponse } from '../types.ts';

export class GoogleAIClient {
  private apiKey = API_KEYS.GOOGLE_AI;

  /**
   * Generate voiceover script using Gemini 3.0
   */
  async generateVoiceoverScript(propertyData: any, visualContext: string, videoLength: number = 25, scriptHook?: string, retryCount: number = 0): Promise<string> {
    // ... Word count logic remains the same ...
    const wordCountRange = videoLength >= 30 ? '60–65 reči' : '50–55 reči';
    const hookWordLimit = videoLength >= 30 ? '≤12 reči' : '≤10 reči';

    const prompt = `
    ULOGA: Ti si vrhunski "performance copywriter" za kratke viralne nekretninske videe na Instagramu (Reels/TikTok). Tvoj cilj je zadržati pažnju (retention) i prodati "vajb" nekretnine.

    ULAZNI PODACI (OVO MORAŠ KORISTITI):
    - DETALJI NEKRETNINE: ${JSON.stringify(propertyData)}
    - VISUALNI KONTEKST (ŠTA SE VIDI): "${visualContext}"
    - CILJANA DUŽINA: ${wordCountRange} (Maksimalno ${wordCountRange.split('–')[1]} reči. OVO JE STROGO PRAVILO).
    - SCRIPT HOOK (OBAVEZAN POČETAK AKO POSTOJI): "${scriptHook || ''}"

    PRAVILA JEZIKA I STILA (STROGO):
    1. JEZIK: ISKLJUČIVO SRPSKI (Standardni srpski, EKAVICA).
       - NE KORISTI hrvatske reči (npr. koristi "vazduh" a ne "zrak", "hiljada" a ne "tisuća", "sopstveni" a ne "vlastiti").
       - NE KORISTI bosanske/crnogorske specifičnosti ako nisu standardni srpski.
    2. STIL: Dinamičan, moderan, direktan ("Ti" obraćanje). Bez "poštovani gledaoci". Kao da pričaš prijatelju.
    3. ISTINITOST: KORISTI SAMO PODATKE IZ "ULAZNIH PODATAKA". NE IZMIŠLJAJ BROJEVE, KVADRATURU ILI SOBE KOJE NISU NAVEDENE. Ako podatak fali, fokusiraj se na osećaj/vajb.

    STRUKTURA SKRIPTE:
    1. HOOK (0-3s): Ako je zadat "SCRIPT HOOK", počni njime. Ako ne, smisli nešto udarno vezano za najjači adut nekretnine.
    2. BODY (3-20s): Brzi opis glavnih prostorija (poveži sa vizualima). Fokus na LIFESTYLE benefitima (npr. ne "ima terasu", nego "jutarnja kafa na ovoj terasi...").
    3. CTA (Kraj): Poziv na akciju (npr. "Zaprati za još", "Link u opisu", "Piši za cenu" ako je cena skrivena).

    FORMAT ODGOVORA (JSON):
    Vrati SAMO validan JSON objekat bez markdown backtickova.
    {
      "voice_text": "Tekst koji će spiker pročitati. Bez emotikona, bez opisa scena u zagradi. Samo čisti izgovoreni tekst.",
      "estimated_duration": "procena u sekundama"
    }
    `;

    const body = {
      contents: [{
        parts: [{ text: prompt }],
      }],
      generationConfig: {
        temperature: 0.7, // Lower temperature for more adherence to facts
        responseMimeType: "application/json"
      }
    };

    const safetySettings = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
    ];

    let response = await fetch(
      `${API_ENDPOINTS.google.geminiText}?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, safetySettings }),
      }
    );

    if (response.status === 503) {
      if (retryCount >= 3) throw new Error(`Gemini 503 Overloaded after ${retryCount} retries`);
      console.warn(`[GoogleAIClient] Gemini 503 Overloaded (Script), retrying (${retryCount + 1}/3)...`);
      await new Promise(r => setTimeout(r, 2000 * (retryCount + 1))); // Exponential backoff
      return this.generateVoiceoverScript(propertyData, visualContext, videoLength, scriptHook, retryCount + 1);
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini 3.0 script generation failed: ${error}`);
    }

    let data = await response.json();
    let text = this.safeExtractText(data);

    // One-time retry if content is empty (safety refusal or non-deterministic behavior)
    if (!text) {
      console.warn('[GoogleAIClient] Voiceover script returned no content, retrying with lower temperature...');
      const retryBody = {
        ...body,
        generationConfig: { ...body.generationConfig, temperature: 0.7 }
      };

      response = await fetch(
        `${API_ENDPOINTS.google.geminiText}?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...retryBody, safetySettings }),
        }
      );

      if (response.ok) {
        data = await response.json();
        text = this.safeExtractText(data);
      }
    }

    if (!text) {
      console.error('[GoogleAIClient] Voiceover script structure missing candidates/content:', JSON.stringify(data));
      throw new Error('Gemini 3.0 script generation returned no content after retry. Possible safety block.');
    }

    if (!text) throw new Error('No text returned from Gemini 3.0');

    try {
      const parsed: any = JSON.parse(text);

      // Case 1: Standard object with voice_text (Expected)
      if (parsed?.voice_text) return parsed.voice_text;

      // Case 2: Array (e.g. [{ title: "...", body: "..." }])
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        if (first.body) return first.body;
        if (first.voice_text) return first.voice_text;
        if (first.script) return first.script;
      }

      // Case 3: Flat object with 'body' or 'script' property
      if (parsed?.body) return parsed.body;
      if (parsed?.script) return parsed.script;

      console.warn('[GoogleAIClient] JSON parsed but extraction failed. Returning raw text fallback.');
      return text;
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
    prompt: string,
    retryCount: number = 0
  ): Promise<any> {
    console.log(`[GoogleAIClient] Analyzing images for video with Gemini 3.0...`);

    const imageParts: any[] = [];

    // Fetch and convert first image
    try {
      const resp1 = await fetch(firstImageUrl);
      const blob1 = await resp1.arrayBuffer();
      const base64_1 = this.base64Encode(blob1);
      imageParts.push({ inline_data: { mime_type: "image/jpeg", data: base64_1 } });
    } catch (e) { console.error("[GoogleAIClient] Failed to fetch first image", e); }

    // Fetch and convert second image if exists
    if (secondImageUrl) {
      try {
        const resp2 = await fetch(secondImageUrl);
        const blob2 = await resp2.arrayBuffer();
        const base64_2 = this.base64Encode(blob2);
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

    const safetySettings = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
    ];

    const response = await fetch(
      `${API_ENDPOINTS.google.geminiVision}?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, safetySettings }),
      }
    );

    if (response.status === 503) {
      if (retryCount >= 3) throw new Error(`Gemini 503 Overloaded after ${retryCount} retries`);
      console.warn(`[GoogleAIClient] Gemini 503 Overloaded (Vision), retrying (${retryCount + 1}/3)...`);
      await new Promise(r => setTimeout(r, 2000 * (retryCount + 1)));
      return this.analyzeImagesForVideo(firstImageUrl, secondImageUrl, prompt, retryCount + 1);
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini 3.0 Vision failed: ${error}`);
    }

    let data = await response.json();
    let content = this.safeExtractText(data);

    // One-time retry if content is empty (safety refusal or non-deterministic behavior)
    if (!content) {
      console.warn('[GoogleAIClient] Gemini 3.0 Vision returned no content, retrying with lower temperature (0.3)...');
      const retryBody = {
        ...body,
        generationConfig: { ...body.generationConfig, temperature: 0.3 }
      };

      const retryResponse = await fetch(
        `${API_ENDPOINTS.google.geminiVision}?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...retryBody, safetySettings }),
        }
      );

      if (retryResponse.ok) {
        data = await retryResponse.json();
        content = this.safeExtractText(data);
      }
    }

    if (!content) {
      console.error('[GoogleAIClient] Empty response from Gemini 3.0 Vision after retry', JSON.stringify(data));
      throw new Error('No content returned from Gemini 3.0 Vision after retry');
    }

    try {
      const parsed = JSON.parse(content);
      console.log(`[GoogleAIClient] Vision analysis complete. Prompt: "${parsed.luma_prompt?.substring(0, 50)}..."`);
      return parsed;
    } catch (e) {
      console.error('[GoogleAIClient] Failed to parse vision JSON:', content);
      throw new Error(`Invalid JSON from Gemini Vision: ${content.substring(0, 100)}...`);
    }
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

    const safetySettings = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
    ];

    const response = await fetch(
      `${API_ENDPOINTS.google.geminiText}?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, safetySettings }),
      }
    );

    if (!response.ok) {
      console.warn('Gemini 3.0 prompt optimization failed, using original.');
      return instruction;
    }

    const data = await response.json();
    const text = this.safeExtractText(data);
    return text || instruction;
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

    const safetySettings = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
    ];

    const response = await fetch(
      `${endpoint}?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, safetySettings }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini TTS failed: ${error}`);
    }

    const data: GoogleTTSResponse = await response.json();
    const base64Audio = this.safeExtractInlineData(data);

    if (!base64Audio) {
      console.error('[Gemini TTS] Response contained no audio. Candidates:', JSON.stringify(data.candidates, null, 2));
      // Fallback to 1 second of silence instead of crashing
      console.warn('[Gemini TTS] Returning 1s silent buffer as fallback.');
      return this.createSilentWav(1);
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
   * Create a silent WAV buffer for fallback
   */
  private createSilentWav(durationSeconds: number): ArrayBuffer {
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const numSamples = sampleRate * durationSeconds;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);

    const dataSize = numSamples * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');

    // fmt chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Data is already zero-initialized (silence)

    return buffer;
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
  }, retryCount: number = 0): Promise<any> {
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

    const safetySettings = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
    ];

    let response = await fetch(
      `${API_ENDPOINTS.google.geminiText}?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, safetySettings }),
      }
    );

    if (response.status === 503) {
      if (retryCount >= 3) throw new Error(`Gemini 503 Overloaded after ${retryCount} retries`);
      console.warn(`[GoogleAIClient] Gemini 503 Overloaded (Chat), retrying (${retryCount + 1}/3)...`);
      await new Promise(r => setTimeout(r, 2000 * (retryCount + 1)));
      return this.chat(params, retryCount + 1);
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini 3.0 chat failed: ${error}`);
    }

    let data = await response.json();
    let text = this.safeExtractText(data);

    // One-time retry if content is empty (safety refusal or non-deterministic behavior)
    if (!text) {
      console.warn('[GoogleAIClient] Chat returned no content, retrying with lower temperature...');
      const retryBody = {
        ...body,
        generationConfig: { ...body.generationConfig, temperature: 0.7 }
      };

      response = await fetch(
        `${API_ENDPOINTS.google.geminiText}?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...retryBody, safetySettings }),
        }
      );

      if (response.ok) {
        data = await response.json();
        text = this.safeExtractText(data);
      }
    }

    if (!text) {
      console.error('[GoogleAIClient] Chat response structure missing candidates/content:', JSON.stringify(data));
      throw new Error('Gemini 3.0 chat returned no content after retry. This usually means a safety block or quota limit.');
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
   * Robust base64 encoding that avoids 'Maximum call stack size exceeded'
   */
  private base64Encode(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
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
