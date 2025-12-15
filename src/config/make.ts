// Make.com webhook configuration - MIGRATED TO SUPABASE EDGE FUNCTIONS
// The frontend still calls these "Make" URLs, but they now point to our internal API.

const SUPABASE_PROJECT_URL = 'https://nhbsvtcuehbttqtcgpoc.supabase.co'; // Hardcoded for reliability or use env
const FUNCTION_URL = `${SUPABASE_PROJECT_URL}/functions/v1/process-furnishing`;

export const MAKE_CREATE_URL = FUNCTION_URL; // POST
export const MAKE_STATUS_URL = FUNCTION_URL; // GET

// Video generation webhook (Reel Studio) - Left Unchanged for now as it wasn't part of this task
export const MAKE_VIDEO_URL = import.meta.env.VITE_MAKE_VIDEO_URL;
export const WEBHOOK_URL = MAKE_CREATE_URL;
export const STATUS_URL = MAKE_STATUS_URL;
export const MAKE_API_KEY = import.meta.env.VITE_MAKE_API_KEY;

// Validation
if (!MAKE_VIDEO_URL) {
  console.warn('Missing VITE_MAKE_VIDEO_URL.');
}

