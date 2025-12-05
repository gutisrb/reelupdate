// Google AI (Gemini) API Client

import { API_KEYS, API_ENDPOINTS } from '../config.ts';
import type { VoiceScriptResponse, GoogleTTSResponse } from '../types.ts';

export class GoogleAIClient {
  private apiKey = API_KEYS.GOOGLE_AI;

  /**
   * Generate voiceover script using Gemini
   */
  async generateVoiceoverScript(propertyData: any, visualContext: string): Promise<string> {
    // This is the Serbian voiceover prompt from your Make.com blueprint
    const prompt = `Ti si performance copywriter za kratke nekretninske videoe na Instagramu. Tvoj VO mora zadržati gledanje: agresivan, istinit HOOK u prvoj rečenici; zatim jasan ishod za gledaoca i kratke činjenice koje postoje u ulazu.

ULAZ (samo ovo smeš da koristiš)

Title: ${propertyData.title}
Location: ${propertyData.location}
Price: ${propertyData.price}€
Size: ${propertyData.size}m²
Rooms: ${propertyData.beds}
Features: ${propertyData.extras}
Floor: ${propertyData.sprat}
VISUAL_CONTEXT (redosled/prostori): ${visualContext}
AGENT_NOTE (ljudski unos: šta je posebno/vredno): ${propertyData.extras}

[Full prompt continues with all rules from blueprint...]

OUTPUT FORMAT ( Return ONLY a JSON object. No \`\`\`json blocks or additional text )
{
  "voice_text": "[HOOK (≤12 reči) + ishod + 1–3 činjenice + 'cena je u opisu' + CTA; 58–64 reči; brojevi rečima; bez halucinacija]"
}`;

    const body = {
      contents: [{
        parts: [{ text: prompt }],
      }],
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
      throw new Error(`Gemini script generation failed: ${error}`);
    }

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text;

    if (!text) {
      throw new Error('No text returned from Gemini');
    }

    // Parse JSON response
    try {
      const parsed: VoiceScriptResponse = JSON.parse(text);
      return parsed.voice_text;
    } catch (e) {
      throw new Error(`Failed to parse Gemini response as JSON: ${text}`);
    }
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

    const body = {
      contents: [{
        parts: [{ text }],
      }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName,
            },
          },
          ...(styleInstructions && { prompt: styleInstructions }),
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
    const base64Audio = data.candidates[0]?.content?.parts[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error('No audio data returned from Gemini TTS');
    }

    // Decode base64 to ArrayBuffer
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
  }

  /**
   * Convert PCM audio to MP3 using FFmpeg (via Shotstack)
   * Note: This requires FFmpeg processing - may need to use Cloudinary or similar
   */
  async convertPCMToMP3(pcmData: ArrayBuffer): Promise<ArrayBuffer> {
    // TODO: Implement FFmpeg conversion
    // For now, we'll rely on uploading to Cloudinary which handles audio conversion
    // Or use a separate service like Shotstack
    return pcmData;
  }
}
