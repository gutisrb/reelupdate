/**
 * Browser-Based Caption Video Renderer
 * Renders captions as a transparent video overlay using Canvas + MediaRecorder
 * Same styling approach as CaptionCustomizer preview
 */

export interface CaptionSettings {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  bgColor: string;
  bgOpacity: number;
  fontWeight?: string;
  uppercase?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowX?: number;
  shadowY?: number;
  position?: string;
  animation?: string;
  maxLines?: number;
  emojis?: boolean;
  singleWord?: boolean;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

/**
 * Render captions as a video file (WebM) using Canvas + MediaRecorder
 *
 * @param transcript - Array of caption segments with timing
 * @param settings - Caption styling settings (from user profile)
 * @param duration - Total video duration in seconds
 * @param width - Video width (default: 1080)
 * @param height - Video height (default: 1920)
 * @param fps - Frame rate (default: 30)
 * @returns Promise<Blob> - Caption video as WebM blob
 */
export async function renderCaptionVideo(
  transcript: TranscriptSegment[],
  settings: CaptionSettings,
  duration: number,
  width: number = 1080,
  height: number = 1920,
  fps: number = 30
): Promise<Blob> {
  console.log('[Caption Renderer] Starting browser-based caption rendering...');
  console.log(`[Caption Renderer] Duration: ${duration}s, Size: ${width}x${height}, FPS: ${fps}`);
  console.log(`[Caption Renderer] Transcript segments: ${transcript.length}`);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: true });

  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }

  // Start capturing canvas as video stream
  const stream = canvas.captureStream(fps);

  // Create MediaRecorder to record the stream
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  console.log(`[Caption Renderer] Using MIME type: ${mimeType}`);

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
  });

  const chunks: Blob[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  // Start recording
  recorder.start();
  console.log('[Caption Renderer] Recording started');

  // Animation loop - render captions frame by frame
  const frameInterval = 1000 / fps; // ms per frame
  let currentTime = 0;
  let frameCount = 0;

  return new Promise((resolve, reject) => {
    const renderFrame = () => {
      // Clear canvas with transparent background
      ctx.clearRect(0, 0, width, height);

      // Find current caption segment
      const currentSegment = transcript.find(
        (seg) => currentTime >= seg.start && currentTime < seg.end
      );

      if (currentSegment) {
        // Render caption using same logic as preview
        renderCaption(ctx, currentSegment.text, settings, width, height, currentTime - currentSegment.start);
      }

      frameCount++;
      currentTime += frameInterval / 1000; // Convert to seconds

      // Check if we've reached the end
      if (currentTime >= duration) {
        console.log(`[Caption Renderer] Finished rendering ${frameCount} frames`);

        // Stop recording
        recorder.stop();

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          console.log(`[Caption Renderer] Video blob created: ${blob.size} bytes`);
          resolve(blob);
        };
      } else {
        // Continue to next frame
        setTimeout(renderFrame, frameInterval);
      }
    };

    // Handle recording errors
    recorder.onerror = (event) => {
      console.error('[Caption Renderer] Recording error:', event);
      reject(new Error('MediaRecorder error'));
    };

    // Start rendering
    renderFrame();
  });
}

/**
 * Render a single caption on canvas (same approach as CaptionCustomizer preview)
 */
function renderCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  settings: CaptionSettings,
  width: number,
  height: number,
  timeInSegment: number
): void {
  // Apply uppercase if needed
  let displayText = settings.uppercase ? text.toUpperCase() : text;

  // Add emojis if enabled
  if (settings.emojis) {
    displayText = addEmojis(displayText);
  }

  // Handle single word mode (karaoke)
  if (settings.singleWord) {
    const words = displayText.split(' ');
    // For simplicity, show first word (proper karaoke would need word-level timing)
    displayText = words[0] || '';
  }

  // Setup font
  const fontSize = settings.fontSize || 34;
  const fontWeight = settings.fontWeight || 'normal';
  const fontFamily = settings.fontFamily || 'Arial';

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Calculate position
  let y = height * 0.85; // Default: bottom
  if (settings.position === 'top') y = height * 0.15;
  if (settings.position === 'middle') y = height * 0.5;

  const x = width / 2;

  // Handle animation (fade/pop)
  let opacity = 1.0;
  let scale = 1.0;

  if (settings.animation === 'fade') {
    // Fade in over 0.15s
    const fadeInDuration = 0.15;
    if (timeInSegment < fadeInDuration) {
      opacity = timeInSegment / fadeInDuration;
    }
  } else if (settings.animation === 'pop') {
    // Pop (scale) over 0.1s
    const popDuration = 0.1;
    if (timeInSegment < popDuration) {
      scale = 0.8 + (0.2 * (timeInSegment / popDuration));
    }
  }

  ctx.globalAlpha = opacity;

  // Apply scale if needed
  if (scale !== 1.0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.translate(-x, -y);
  }

  // Draw background box if needed
  if (settings.bgOpacity > 0) {
    const metrics = ctx.measureText(displayText);
    const padding = 20;
    const boxWidth = metrics.width + (padding * 2);
    const boxHeight = fontSize * 1.5;
    const boxX = x - (boxWidth / 2);
    const boxY = y - (boxHeight / 2);

    const bgHex = settings.bgColor || '000000';
    const r = parseInt(bgHex.slice(0, 2), 16);
    const g = parseInt(bgHex.slice(2, 4), 16);
    const b = parseInt(bgHex.slice(4, 6), 16);

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${settings.bgOpacity / 100})`;
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  }

  // Apply shadow
  if (settings.shadowBlur && settings.shadowBlur > 0) {
    ctx.shadowBlur = settings.shadowBlur;
    ctx.shadowOffsetX = settings.shadowX || 2;
    ctx.shadowOffsetY = settings.shadowY || 2;
    const shadowHex = settings.shadowColor || '000000';
    ctx.shadowColor = `#${shadowHex}`;
  }

  // Draw stroke (outline)
  if (settings.strokeWidth && settings.strokeWidth > 0) {
    const strokeHex = settings.strokeColor || '000000';
    ctx.strokeStyle = `#${strokeHex}`;
    ctx.lineWidth = settings.strokeWidth;
    ctx.strokeText(displayText, x, y);
  }

  // Draw main text
  const fontColorHex = settings.fontColor || 'FFFFFF';
  ctx.fillStyle = `#${fontColorHex}`;
  ctx.fillText(displayText, x, y);

  // Reset shadow
  ctx.shadowBlur = 0;

  // Restore context if we applied scale
  if (scale !== 1.0) {
    ctx.restore();
  }

  ctx.globalAlpha = 1.0;
}

/**
 * Add emojis to Serbian text (same logic as CaptionCustomizer)
 */
function addEmojis(text: string): string {
  const lowerText = text.toLowerCase();
  let result = text;

  if (lowerText.includes('stan') || lowerText.includes('dom') || lowerText.includes('kuća')) {
    result += ' 🏠';
  }
  if (lowerText.includes('pogled') || lowerText.includes('vidik')) {
    result += ' 👀';
  }
  if (lowerText.includes('link') || lowerText.includes('opis') || lowerText.includes('profil')) {
    result += ' 🔗';
  }
  if (lowerText.includes('luksuz') || lowerText.includes('prestiž')) {
    result += ' ✨';
  }
  if (lowerText.includes('cena')) {
    result += ' 💰';
  }
  if (lowerText.includes('poruku') || lowerText.includes('kontakt')) {
    result += ' 📩';
  }

  return result;
}
