/**
 * SRT Parser and Utilities
 * Parses SRT (SubRip) subtitle files and provides utilities for caption rendering
 */

export interface SRTCue {
  index: number;
  startTime: number; // seconds
  endTime: number;   // seconds
  text: string;
  words?: SRTWord[]; // For karaoke mode
}

export interface SRTWord {
  word: string;
  startTime: number;
  endTime: number;
}

/**
 * Parse timestamp string to seconds
 * Format: 00:00:01,234 or 00:00:01.234
 */
export function parseTimestamp(timestamp: string): number {
  const parts = timestamp.replace(',', '.').split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseFloat(parts[2]);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Parse SRT content into structured cues
 */
export function parseSRT(srtContent: string): SRTCue[] {
  const cues: SRTCue[] = [];

  // Split by double newline (cue separator)
  const blocks = srtContent.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue; // Invalid block

    // Line 1: Index
    const index = parseInt(lines[0], 10);
    if (isNaN(index)) continue;

    // Line 2: Timestamps
    const timeLine = lines[1];
    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})/);
    if (!timeMatch) continue;

    const startTime = parseTimestamp(timeMatch[1]);
    const endTime = parseTimestamp(timeMatch[2]);

    // Line 3+: Text (can be multiple lines)
    const text = lines.slice(2).join(' ').trim();

    cues.push({
      index,
      startTime,
      endTime,
      text,
    });
  }

  return cues;
}

/**
 * Split cue text into words with estimated timing
 * For karaoke mode - distributes time evenly across words
 */
export function splitCueIntoWords(cue: SRTCue): SRTWord[] {
  const words = cue.text.split(/\s+/).filter(w => w.length > 0);
  const duration = cue.endTime - cue.startTime;
  const wordDuration = duration / words.length;

  return words.map((word, index) => ({
    word,
    startTime: cue.startTime + (index * wordDuration),
    endTime: cue.startTime + ((index + 1) * wordDuration),
  }));
}

/**
 * Add emojis to text based on keywords (Serbian language)
 */
export function addEmojis(text: string): string {
  const lowerText = text.toLowerCase();
  let result = text;

  // Property-related
  if (/\b(stan|kuća|dom|nekretnin)\b/.test(lowerText)) {
    result += ' 🏠';
  }

  // View/sight
  if (/\b(pogled|vidik|panoram)\b/.test(lowerText)) {
    result += ' 👀';
  }

  // Luxury/prestige
  if (/\b(luksuz|prestiž|elegancij)\b/.test(lowerText)) {
    result += ' ✨';
  }

  // Price/money
  if (/\b(cena|cenu|evr|din)\b/.test(lowerText)) {
    result += ' 💰';
  }

  // Contact/link
  if (/\b(link|opis|profil|bio|kontakt|poruku)\b/.test(lowerText)) {
    result += ' 📩';
  }

  // Location
  if (/\b(lokacij|adres|grad|centar)\b/.test(lowerText)) {
    result += ' 📍';
  }

  // Modern/new
  if (/\b(nov|modern|renovira)\b/.test(lowerText)) {
    result += ' ✨';
  }

  // Parking
  if (/\b(parking|garaž)\b/.test(lowerText)) {
    result += ' 🚗';
  }

  // Garden/nature
  if (/\b(bašt|dvoriš|park|zelenilo)\b/.test(lowerText)) {
    result += ' 🌳';
  }

  // Heart/love (for "great", "perfect")
  if (/\b(savršen|odličan|perfektno)\b/.test(lowerText)) {
    result += ' ❤️';
  }

  return result.trim();
}

/**
 * Format timestamp for display (optional utility)
 */
export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Get the active cue at a given time
 */
export function getActiveCue(cues: SRTCue[], time: number): SRTCue | null {
  for (const cue of cues) {
    if (time >= cue.startTime && time < cue.endTime) {
      return cue;
    }
  }
  return null;
}

/**
 * Apply uppercase transformation to SRT content
 * Preserves timestamps and structure
 */
export function uppercaseSRT(srtContent: string): string {
  const cues = parseSRT(srtContent);
  const blocks = cues.map(cue => {
    const startTs = formatTimestamp(cue.startTime);
    const endTs = formatTimestamp(cue.endTime);
    return `${cue.index}\n${startTs} --> ${endTs}\n${cue.text.toUpperCase()}`;
  });

  return blocks.join('\n\n') + '\n';
}
