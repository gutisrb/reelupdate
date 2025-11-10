// Make.com webhook configuration
// Image generation webhooks (shared across all users)
export const MAKE_CREATE_URL = import.meta.env.VITE_MAKE_CREATE_URL;
export const MAKE_STATUS_URL = import.meta.env.VITE_MAKE_STATUS_URL;

// Video generation webhook (Reel Studio)
export const MAKE_VIDEO_URL = import.meta.env.VITE_MAKE_VIDEO_URL;

// Legacy aliases (kept for backward compatibility)
export const WEBHOOK_URL = MAKE_CREATE_URL;
export const STATUS_URL = MAKE_STATUS_URL;

// API Key for webhook authentication (if needed)
export const MAKE_API_KEY = import.meta.env.VITE_MAKE_API_KEY;

// NOTE: Video generation can also be fetched per-user from Supabase profiles.webhook_url
// This allows each client to have their own custom webhook endpoint
// If profiles.webhook_url exists, it will override MAKE_VIDEO_URL

// Validate required environment variables
if (!MAKE_CREATE_URL || !MAKE_STATUS_URL) {
  console.warn('Missing Make.com environment variables. Image generation features may not work.');
}

if (!MAKE_VIDEO_URL) {
  console.warn('Missing VITE_MAKE_VIDEO_URL. Video generation will use profile webhook_url or fail.');
}
