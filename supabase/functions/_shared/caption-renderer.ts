/**
 * Canvas-Based Caption Renderer
 * Renders captions with full CSS-like styling support
 */

// Lazy-load canvas for Deno and polyfill __dirname to avoid ReferenceError in deno.land/x/canvas
let canvasModulePromise: Promise<{ createCanvas: any }> | null = null;

async function getCanvasModule() {
  if (!canvasModulePromise) {
    // Polyfill __dirname for canvas internals that expect Node globals
    if (typeof (globalThis as any).__dirname === 'undefined') {
      (globalThis as any).__dirname = new URL('.', import.meta.url).pathname;
    }
    canvasModulePromise = import("https://deno.land/x/canvas@v1.4.1/mod.ts") as Promise<{ createCanvas: any }>;
  }
  return canvasModulePromise;
}
import type { SRTCue, SRTWord } from './srt-parser.ts';

export interface CaptionStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontColor: string; // hex without #
  bgColor: string;   // hex without #
  bgOpacity: number; // 0-100
  uppercase?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowX?: number;
  shadowY?: number;
  position?: 'top' | 'middle' | 'bottom' | 'auto';
  animation?: 'none' | 'pop' | 'fade' | 'karaoke';
  maxLines?: number;
  emojis?: boolean;
  singleWord?: boolean;
}

export interface CaptionFrame {
  imageData: Uint8Array; // PNG image data
  timestamp: number;     // When to show this frame (seconds)
  duration: number;      // How long to show (seconds)
}

export interface RenderOptions {
  width: number;
  height: number;
  fps: number;
}

const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  width: 1080,
  height: 1920,
  fps: 30,
};

/**
 * Hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16),
  };
}

/**
 * Get rgba string from hex + opacity
 */
function hexToRgba(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity / 100})`;
}

/**
 * Wrap text to fit within maxWidth
 */
function wrapText(
  ctx: any,
  text: string,
  maxWidth: number,
  maxLines: number = 2
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;

      if (lines.length >= maxLines) {
        break; // Stop if we hit max lines
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Calculate position Y coordinate based on position setting
 */
function getPositionY(
  position: string,
  height: number,
  textHeight: number
): number {
  switch (position) {
    case 'top':
      return height * 0.15;
    case 'middle':
      return height * 0.5;
    case 'bottom':
    default:
      return height * 0.85;
  }
}

/**
 * Render a single caption frame
 */
export async function renderCaptionFrame(
  text: string,
  style: CaptionStyle,
  options: RenderOptions = DEFAULT_RENDER_OPTIONS,
  animationProgress: number = 1.0 // 0.0 to 1.0 for animations
): Promise<Uint8Array> {
  const { createCanvas } = await getCanvasModule();
  const canvas = createCanvas(options.width, options.height);
  const ctx = canvas.getContext('2d');

  // Clear canvas (transparent)
  ctx.clearRect(0, 0, options.width, options.height);

  // Apply uppercase if needed
  let displayText = style.uppercase ? text.toUpperCase() : text;

  // Setup font
  const fontWeight = style.fontWeight || 'bold';
  const fontSize = style.fontSize || 34;
  const fontFamily = style.fontFamily || 'Arial';
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Wrap text
  const maxTextWidth = options.width * 0.9; // 90% of width
  const lines = wrapText(ctx, displayText, maxTextWidth, style.maxLines || 2);

  // Calculate total text height
  const lineHeight = fontSize * 1.3;
  const totalTextHeight = lines.length * lineHeight;

  // Position
  const y = getPositionY(
    style.position || 'bottom',
    options.height,
    totalTextHeight
  );

  // Apply animation transformations
  let scale = 1.0;
  let opacity = 1.0;

  if (style.animation === 'pop') {
    // Scale from 0.8 to 1.0
    scale = 0.8 + (0.2 * animationProgress);
  } else if (style.animation === 'fade') {
    // Fade in from 0 to 1
    opacity = animationProgress;
  }

  // Apply scale if needed
  if (scale !== 1.0) {
    ctx.save();
    ctx.translate(options.width / 2, y);
    ctx.scale(scale, scale);
    ctx.translate(-options.width / 2, -y);
  }

  // Apply global opacity for fade
  ctx.globalAlpha = opacity;

  // Render each line
  lines.forEach((line, index) => {
    const lineY = y - (totalTextHeight / 2) + (index * lineHeight) + (lineHeight / 2);

    // Draw background box if needed
    if (style.bgOpacity > 0) {
      const metrics = ctx.measureText(line);
      const padding = 20;
      const boxWidth = metrics.width + (padding * 2);
      const boxHeight = lineHeight + 10;
      const boxX = (options.width - boxWidth) / 2;
      const boxY = lineY - (boxHeight / 2);

      ctx.fillStyle = hexToRgba(style.bgColor || '000000', style.bgOpacity);
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    }

    // Setup shadow
    if (style.shadowBlur && style.shadowBlur > 0) {
      ctx.shadowBlur = style.shadowBlur;
      ctx.shadowOffsetX = style.shadowX || 2;
      ctx.shadowOffsetY = style.shadowY || 2;
      ctx.shadowColor = style.shadowColor ? `#${style.shadowColor}` : '#000000';
    } else {
      ctx.shadowBlur = 0;
    }

    // Draw stroke (outline)
    if (style.strokeWidth && style.strokeWidth > 0) {
      ctx.strokeStyle = style.strokeColor ? `#${style.strokeColor}` : '#000000';
      ctx.lineWidth = style.strokeWidth;
      ctx.strokeText(line, options.width / 2, lineY);
    }

    // Draw main text
    ctx.fillStyle = `#${style.fontColor || 'FFFFFF'}`;
    ctx.fillText(line, options.width / 2, lineY);

    // Reset shadow for next line
    ctx.shadowBlur = 0;
  });

  // Restore context if we applied scale
  if (scale !== 1.0) {
    ctx.restore();
  }

  // Export as PNG
  const buffer = canvas.toBuffer('image/png');
  return new Uint8Array(buffer);
}

/**
 * Render all caption frames for a cue with animation
 */
export async function renderCueFrames(
  cue: SRTCue,
  style: CaptionStyle,
  options: RenderOptions = DEFAULT_RENDER_OPTIONS
): Promise<CaptionFrame[]> {
  const frames: CaptionFrame[] = [];
  const duration = cue.endTime - cue.startTime;

  // If animation is none, render just one frame
  if (!style.animation || style.animation === 'none') {
    const imageData = await renderCaptionFrame(cue.text, style, options, 1.0);
    frames.push({
      imageData,
      timestamp: cue.startTime,
      duration: duration,
    });
    return frames;
  }

  // For animations, render multiple frames
  const animationDuration = style.animation === 'pop' ? 0.2 : 0.3; // seconds
  const animationFrames = Math.ceil(animationDuration * options.fps);

  // Render animation frames
  for (let i = 0; i < animationFrames; i++) {
    const progress = (i + 1) / animationFrames;
    const imageData = await renderCaptionFrame(cue.text, style, options, progress);
    const frameTime = cue.startTime + (i / options.fps);

    frames.push({
      imageData,
      timestamp: frameTime,
      duration: 1 / options.fps,
    });
  }

  // Render static frame for the rest of the duration
  if (duration > animationDuration) {
    const imageData = await renderCaptionFrame(cue.text, style, options, 1.0);
    frames.push({
      imageData,
      timestamp: cue.startTime + animationDuration,
      duration: duration - animationDuration,
    });
  }

  return frames;
}

/**
 * Render karaoke-style captions (single word at a time)
 */
export async function renderKaraokeFrames(
  words: SRTWord[],
  style: CaptionStyle,
  options: RenderOptions = DEFAULT_RENDER_OPTIONS
): Promise<CaptionFrame[]> {
  const frames: CaptionFrame[] = [];

  for (const wordData of words) {
    const duration = wordData.endTime - wordData.startTime;

    // Render animation if enabled
    if (style.animation && style.animation !== 'none') {
      const animationDuration = style.animation === 'pop' ? 0.15 : 0.2;
      const animationFrames = Math.ceil(animationDuration * options.fps);

      for (let i = 0; i < animationFrames; i++) {
        const progress = (i + 1) / animationFrames;
        const imageData = await renderCaptionFrame(
          wordData.word,
          style,
          options,
          progress
        );

        frames.push({
          imageData,
          timestamp: wordData.startTime + (i / options.fps),
          duration: 1 / options.fps,
        });
      }

      // Static frame for remainder
      if (duration > animationDuration) {
        const imageData = await renderCaptionFrame(wordData.word, style, options, 1.0);
        frames.push({
          imageData,
          timestamp: wordData.startTime + animationDuration,
          duration: duration - animationDuration,
        });
      }
    } else {
      // No animation, just render one frame per word
      const imageData = await renderCaptionFrame(wordData.word, style, options, 1.0);
      frames.push({
        imageData,
        timestamp: wordData.startTime,
        duration: duration,
      });
    }
  }

  return frames;
}

/**
 * Main rendering function - processes all cues and returns frames
 */
export async function renderAllCaptions(
  cues: SRTCue[],
  style: CaptionStyle,
  options: RenderOptions = DEFAULT_RENDER_OPTIONS
): Promise<CaptionFrame[]> {
  const allFrames: CaptionFrame[] = [];

  for (const cue of cues) {
    // Apply emojis if enabled
    let processedCue = { ...cue };
    if (style.emojis) {
      const { addEmojis } = await import('./srt-parser.ts');
      processedCue.text = addEmojis(cue.text);
    }

    // Check if karaoke mode
    if (style.singleWord) {
      const { splitCueIntoWords } = await import('./srt-parser.ts');
      const words = splitCueIntoWords(processedCue);
      const frames = await renderKaraokeFrames(words, style, options);
      allFrames.push(...frames);
    } else {
      const frames = await renderCueFrames(processedCue, style, options);
      allFrames.push(...frames);
    }
  }

  return allFrames;
}
