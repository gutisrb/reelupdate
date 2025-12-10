// Google AI (Gemini) API Client

import { API_KEYS, API_ENDPOINTS } from '../config.ts';
import type { VoiceScriptResponse, GoogleTTSResponse } from '../types.ts';

export class GoogleAIClient {
  private apiKey = API_KEYS.GOOGLE_AI;

  /**
   * Generate voiceover script using Gemini
   */
  async generateVoiceoverScript(propertyData: any, visualContext: string, videoLength: number = 25): Promise<string> {
    // Full Serbian voiceover prompt from Make.com blueprint
    // Dynamic length based on video duration: 25s = 58-64 words, 30s = 68-74 words
    const wordCountRange = videoLength >= 30 ? '68–74 reči' : '58–64 reči';
    const hookWordLimit = videoLength >= 30 ? '≤14 reči' : '≤12 reči';

    const prompt = `Ti si performance copywriter za kratke nekretninske videoe na Instagramu. Tvoj VO mora zadržati gledanje: agresivan, istinit HOOK u prvoj rečenici; zatim jasan ishod za gledaoca i kratke činjenice koje postoje u ulazu.

VIDEO_LENGTH: ${videoLength} sekundi

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

HOOK STRATEGIJE (biraj jednu koja najbolje odgovara):

1. DIREKTAN POZIV: "Tražite [specifikacija]? Evo ga u [lokacija]."
2. KARAKTERIZACIJA: "Ovaj stan je [jedinstvena karakteristika] na [lokacija]."
3. SUPROTNOST: "Zaboravite [alternativa]—ovaj stan [superiornost]."
4. EMOTIVNA PROJEKCIJA: "Zamislite [scenario] u [lokacija]."
5. TRIGER: "Pre nego što [alternativa], vidite [karakteristika]."
6. STATISTIKA: "Samo [broj]% stanova u [lokacija] ima [feature]."
7. DRAMATIČNA IZJAVA: "[Karakteristika] koja se retko viđa u [lokacija]."
8. URGENTNOST: "Ovaj stan u [lokacija] se ne pojavljuje često."
9. EKSKLUZIVNOST: "Ekskluzivna prilika u [lokacija] – [feature]."
10. PITANJE: "Šta ako vam kažem da [benefit] postoji u [lokacija]?"

STRUKTURA VO (obavezno):

1. **HOOK (${hookWordLimit})**: Prva rečenica. Agresivna, istinita, MORA uhvatiti pažnju. Bez uopštenog marketinga. Poštuj ulaz (ne dodaj ništa što ne postoji).
2. **ISHOD ZA GLEDAOCA (2–4 reči)**: Rečenica koja jasno komunicira zašto je ovaj stan rešenje (npr. "Vaš novi dom u [lokacija]." ili "Početak komfornijeg života.").
3. **ČINJENICE (1–3 bitna detalja)**: Kratko. Samo iz ulaza. Prioritizuj: kvadratura, broj soba, sprat, posebne karakteristike (terasa, garaža, renoviran). Ne nabrajaj sve—samo najjače elemente.
4. **CENA (obavezno)**: "Cena je u opisu."
5. **CTA (call-to-action)**: "Pišite mi za sve detalje." (ili varijacija ako bolje zvuči u kontekstu)

STROGI PRAVILA:

- Jezik: Srpski, **ekavica**, **latinica** (NIKAD ćirilica ili ijekavica).
- Brojevi: Uvek rečima (npr. "pedeset kvadrata", "tri sobe", "drugi sprat").
- Ton: Direktan, siguran, iskren—bez obećanja koja nisu u ulazu. BEZ uopštenog marketinga ("najbolji", "savršen" itd.), osim ako nije doslovno istina.
- Dužina: **${wordCountRange} ukupno** (računajući hook + ishod + činjenice + cena + CTA). Ovo je strogo.
- Bez halucinacija: Nikakve informacije koje nisu u ulazu. Ako nije pomenuto, ne postoji.
- Bez dodatnih komentara: Samo voice_text JSON.

STIL:

- Rečenice: Kratke. Jasne. Udri.
- Izbegavaj "savršen", "idealan", "neverovatno" osim ako je činjenično.
- Prioritizuj ACTION i OUTCOME (šta dobijaju), ne liste karakteristika.
- Prirodan flow — kao da neko stvarno priča, ne čita marketing brošuru.

SELF-CHECK (pre nego što odgovoriš):

✅ Da li je hook AGRESIVAN i SPECIFIČAN za ovaj stan?
✅ Da li je ishod JASAN i relevantan za gledalca?
✅ Da li su činjenice SAMO iz ulaza (bez izmišljanja)?
✅ Da li je ukupan broj reči između ${wordCountRange}?
✅ Da li su svi brojevi REČIMA (a ne ciframa)?
✅ Da li tekst DRŽI PAŽNJU (bez marketinških klišea)?

OUTPUT FORMAT ( Return ONLY a JSON object. No \`\`\`json blocks or additional text )
{
  "voice_text": "[HOOK (${hookWordLimit}) + ishod + 1–3 činjenice + 'cena je u opisu' + CTA; ${wordCountRange}; brojevi rečima; bez halucinacija]"
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

    // Parse JSON response (strip markdown code blocks if present)
    try {
      let cleanText = text.trim();

      // Remove markdown code blocks: ```json ... ``` or ``` ... ```
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\n?/, '').replace(/\n?```$/, '').trim();
      }

      const parsed: VoiceScriptResponse = JSON.parse(cleanText);
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
    const base64Audio = data.candidates[0]?.content?.parts[0]?.inlineData?.data;

    if (!base64Audio) {
      console.error('[Gemini TTS] Response structure:', JSON.stringify(data, null, 2));
      throw new Error('No audio data returned from Gemini TTS');
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
   * Helper to write string to DataView
   */
  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
}
