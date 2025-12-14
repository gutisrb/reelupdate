# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a real estate video generation application built with React, TypeScript, Vite, and Supabase. The app allows users to create property listing videos by uploading photos and filling in property details, which are then processed through Supabase Edge Functions to generate AI-powered video content using multiple AI services (Luma, OpenAI, Google AI, ElevenLabs, ZapCap).

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool, dev server on port 8080)
- React Router v6 (client-side routing)
- Tailwind CSS + shadcn/ui components (Radix UI primitives)
- React Query (@tanstack/react-query) for server state
- react-dropzone for file uploads
- IndexedDB for draft persistence

**Backend:**
- Supabase (PostgreSQL database, Auth, Edge Functions)
- Deno runtime for Edge Functions
- Cloudinary (image/video storage)

**AI Services:**
- Luma AI (video generation)
- OpenAI GPT (script generation)
- Google AI Gemini (prompt generation, TTS)
- ElevenLabs (voice synthesis)
- ZapCap (caption generation)

## Development Commands

```bash
# Install dependencies
npm i

# Start development server (runs on port 8080, NOT the default 5173)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Utility Scripts

Requires `tsx` and `dotenv` as dev dependencies (already in package.json):

```bash
# Check environment configuration
npx tsx scripts/check-environment.ts

# Generate voice previews (one-time setup)
npx tsx scripts/generate-voice-previews.ts

# Update caption templates in database
npx tsx scripts/update-caption-templates.ts

# Test Cloudinary URL features (text overlays, transformations)
npx tsx scripts/test_cloudinary_features.ts
```

### Working with Supabase

```bash
# Test Edge Functions locally (requires Supabase CLI)
supabase functions serve process-video-generation --env-file .env

# Deploy Edge Functions to Supabase
supabase functions deploy process-video-generation

# Push database migrations
supabase db push
```

## Architecture

### Routing Structure

The app uses React Router with conditional layout rendering based on path (src/App.tsx:28-69). Two distinct routing contexts:

1. **Public/Marketing Routes** (src/App.tsx:56-68):
   - Wrapped with `MarketingNav` and `MarketingFooter`
   - Routes: `/`, `/terms`, `/privacy`, `/app/login`
   - No authentication required

2. **Authenticated App Routes** (src/App.tsx:32-53):
   - Wrapped with `AuthWrapper` (provides `user` and `session`) and `AppShell` (navigation + layout)
   - All `/app/*` routes require authentication except `/app/login`
   - Routes: `/app/galerija` (default), `/app/reel`, `/app/stage`, `/app/docs`, `/app/profile`, `/app/settings`, `/app/assets`
   - `/app/library` redirects to `/app/galerija`
   - AppShell provides top navigation (AppNavigation) and main content area via Outlet

### Global Providers (src/App.tsx:80-95)

Applied to all routes in this order (outermost to innermost):
1. `QueryClientProvider` - React Query (@tanstack/react-query) for server state management
2. `LanguageProvider` - i18n support for Serbian ('sr') and English ('en'), persisted to localStorage
3. `TooltipProvider` - shadcn/ui tooltips (radix-ui)
4. `Toaster` & `Sonner` - Dual toast notification systems (use via `useToast` hook)
5. `ProgressProvider` - Global progress state (0-100) for video processing feedback
6. `WizardProvider` - Multi-step wizard state with IndexedDB persistence (auto-saves every 2s)

### State Management

**WizardContext** (src/contexts/WizardContext.tsx):
- Manages 3-step video creation wizard state
- Stores: form data, image slots (5-6 slots), clip count, current step
- Auto-persists to IndexedDB every 2 seconds (with 50MB size limit check)
- State survives page refreshes
- Key methods: `updateFormData`, `updateSlots`, `updateClipCount`, `setCurrentStep`, `resetWizard`

**ProgressContext** (src/contexts/ProgressContext.tsx):
- Simple global progress state (0-100) for video processing feedback

**LanguageContext** (src/contexts/LanguageContext.tsx):
- Manages app language state: Serbian ('sr') or English ('en')
- Persists language preference to localStorage
- Provides `useLanguage` hook with `language`, `setLanguage`, and `t` function
- Default language is Serbian ('sr')

### Data Persistence

**IndexedDB Storage** (src/lib/wizardStorage.ts):
- Database: `WizardDrafts`, Store: `drafts`
- Serializes wizard data including File objects to ArrayBuffers
- Restores files from IndexedDB on app load
- Handles large image uploads (logs slot/image counts for debugging)

### Supabase Integration

**Client** (src/integrations/supabase/client.ts):
- Auto-generated file - DO NOT edit manually
- Uses localStorage for auth persistence with auto-refresh
- Initialized with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**Database Tables** (src/integrations/supabase/types.ts):
- Auto-generated TypeScript types from Supabase schema - DO NOT edit manually
- Regenerate when database schema changes
- `assets`: Stores generated video clips/images with status tracking
  - Fields: kind, status, src_url, thumb_url, prompt, inputs, posted_to
- `profiles`: User profiles with webhook configuration and credits
  - Fields: org_name, tier, video_credits_remaining, image_credits_remaining, webhook_url, review_first
- `videos`: Complete video projects
  - Fields: title, status, video_url, thumbnail_url, posted_channels_json

### Video Generation Flow

**VideoWizard Component** (src/components/VideoWizard.tsx):
1. **Step 1 (Details)**: Collect property info (title, price, location, beds, baths, etc.)
2. **Step 2 (Photos)**: Upload 5-6 image slots, each supporting 1-2 images for image-to-video or frame-to-frame modes
3. **Step 3 (Preview)**: Review and submit to Supabase Edge Function

**Submission Process**:
- Compresses images before sending (src/lib/compressWebhookImage.ts)
- Sends multipart form data to Supabase Edge Function at `/functions/v1/process-video-generation`
- Includes: video_id, form data, images, grouping metadata, user_id
- Checks user credits before processing
- Resets wizard and navigates to `/app/galerija` on success

### Backend Architecture

**Supabase Edge Functions** (supabase/functions/):
- `process-video-generation/index.ts`: Main video generation orchestration
  - Checks user credits and deducts 1 video credit atomically
  - Creates video record with status 'processing'
  - Returns immediately to frontend (200 OK with video_id)
  - Continues processing asynchronously in background
  - **3-Stage Iterative Baking Pipeline**:
    1. **Assembly Stage**: Generate clips with Luma → Create voiceover → Assemble base video
    2. **Captions Stage**: Transcribe with Whisper → Correct with GPT → Bake captions as Cloudinary text overlays
    3. **Logo Stage**: Add logo overlay → Upload final baked video to Cloudinary as static asset
  - Each stage "bakes" (uploads) the video to Cloudinary, then the next stage uses that URL
  - Updates video status in database throughout pipeline
- `social-auth/index.ts`: OAuth authentication for social media platforms
- `social-callback/index.ts`: OAuth callback handler
- `post-social-content/index.ts`: Posts generated videos to social media
- `transcribe-preview/index.ts`: Preview transcription for testing
- `upload-custom-music/index.ts`: Handles custom music uploads
- Shared clients in `_shared/clients/`:
  - `cloudinary.ts`: Image/video storage and transformations
  - `luma.ts`: AI video generation
  - `openai.ts`: GPT for script generation and caption correction
  - `google.ts`: Google AI (Gemini) for prompts/TTS
  - `elevenlabs.ts`: Voice synthesis
  - `zapcap.ts`: Caption generation (legacy)

**Environment Variables** (.env.example):
- Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- AI Services: `LUMA_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY`, `ELEVENLABS_API_KEY`, `ZAPCAP_API_KEY`
- Storage: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Optional: `VITE_MAKE_VIDEO_URL` (legacy Make.com webhook for fallback)

**Database RPC Functions**:
- `spend_video_credit`: Atomically deducts 1 credit from user profile
- User credits tracked in `profiles.video_credits_remaining` and `profiles.image_credits_remaining`

### Image Slot System

**SlotData Interface** (src/components/ImageSlots.tsx):
```typescript
{
  id: string;
  mode: "image-to-video" | "frame-to-frame";
  images: File[];  // 1-2 images per slot
}
```

- 5 or 6 slots depending on `clipCount` setting
- Each slot represents one video clip in final output
- "image-to-video": Animates single image
- "frame-to-frame": Transitions between two images

### Component Library & Import Paths

**shadcn/ui components** (src/components/ui/):
- Pre-built Radix UI components styled with Tailwind
- All components configured via components.json
- Uses CVA (class-variance-authority) for variant styling
- Import from `@/components/ui/...`

**Import Path Alias:**
- `@/` maps to `src/` (configured in vite.config.ts and tsconfig.json)
- Examples: `@/components/...`, `@/hooks/...`, `@/lib/...`, `@/contexts/...`

### File Upload Handling

- Uses react-dropzone for drag-and-drop
- Supports bulk upload with automatic slot distribution
- Files stored as File objects in wizard state
- Compressed before submission to reduce payload size (4.9MB budget)
- Compression: resizes to max 1280x1280, JPEG quality 0.72 (src/lib/compressWebhookImage.ts)

### Authentication Flow

**AuthWrapper Component** (src/components/AuthWrapper.tsx):
- Wraps all `/app/*` routes (except `/app/login`)
- Uses `supabase.auth.onAuthStateChange` for real-time auth state
- Checks for existing session on mount
- Shows loading state while checking authentication
- Redirects to embedded Auth UI if not authenticated

### Application Pages

**Marketing Pages** (src/pages/):
- `Home.tsx`: Landing page with product overview
- `Login.tsx`: Authentication page (public access)
- `Terms.tsx` & `Privacy.tsx`: Legal pages

**App Pages** (src/pages/app/):
- `Galerija.tsx`: Video library/gallery (main dashboard)
- `GalerijaDetail.tsx`: Individual video detail view
- `Profile.tsx`: User profile management
- `Settings.tsx`: User settings and customization
- `Docs.tsx`: Documentation/help page
- `Assets.tsx`: Asset management (clips/images)

**Studio Pages** (src/pages/):
- `VideoGenerator.tsx`: Wraps VideoWizard for "Reel Studio" (route: `/app/reel`)
- `Furnisher.tsx`: "Stage Studio" for property staging (route: `/app/stage`)

## Common Development Patterns

### Adding a New App Page

1. Create page component in `src/pages/app/`
2. Add route in `src/App.tsx` inside the `<AuthWrapper>` block at src/App.tsx:35-46
3. Update navigation in `src/components/AppNavigation.tsx`

### Fetching User Profile

The `useProfile` hook (src/hooks/useProfile.ts) fetches and auto-creates user profiles:

```typescript
import { useProfile } from '@/hooks/useProfile';

const { profile, loading, error } = useProfile(user);
// Access: profile.video_credits_remaining, profile.webhook_url, profile.org_name, profile.review_first
```

**Note:** If profile doesn't exist, the hook automatically creates one via Supabase insert.

### Using Toast Notifications

```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();
toast({ title: "Success", description: "..." });
```

### Working with Wizard State

```typescript
import { useWizard } from '@/contexts/WizardContext';

const { wizardData, updateSlots, resetWizard } = useWizard();
```

### Using Language/i18n

```typescript
import { useLanguage } from '@/contexts/LanguageContext';

const { language, setLanguage } = useLanguage();
// language is 'sr' (Serbian) or 'en' (English)
// setLanguage('en') to switch languages
```

Components typically store translations as objects and select based on `language`:
```typescript
const translations = {
  sr: { title: "Naslov", submit: "Pošalji" },
  en: { title: "Title", submit: "Submit" }
};
const text = translations[language];
```

### Working with Supabase Edge Functions

**Calling Edge Functions from Frontend**:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const edgeFunctionUrl = `${supabaseUrl}/functions/v1/process-video-generation`;

const res = await fetch(edgeFunctionUrl, {
  method: "POST",
  body: formData,
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
});
```

**Edge Function Structure**:
- Located in `supabase/functions/[function-name]/index.ts`
- Shared utilities in `supabase/functions/_shared/`
- Use Deno runtime (not Node.js)
- Environment variables configured via Supabase CLI or dashboard
- Import from `https://deno.land/` or `https://esm.sh/` URLs

**Deploying Edge Functions**:
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy process-video-generation

# Required environment variables must be set via:
# - Supabase Dashboard (Project Settings > Edge Functions > Manage environment variables)
# - Or via CLI: supabase secrets set KEY=value
```

## Important Constraints

- Development server runs on port 8080 (not default 5173)
- IndexedDB has 50MB auto-save limit for wizard state
- Each image slot supports maximum 2 images
- Total slots: 5 or 6 (controlled by clipCount)
- Image compression budget: 4.9MB total payload (to stay under webhook limits)
- User credits are checked and deducted before video generation starts
- All AI service API keys must be configured in Edge Function environment

## Key Technical Decisions

**Why Supabase Edge Functions instead of Make.com?**
- Better control over workflow logic
- Atomic credit deduction with RPC functions
- Direct integration with Supabase database
- Support for multiple AI providers
- Lower latency for users

**Why IndexedDB for wizard persistence?**
- Allows users to refresh page without losing work
- Handles File objects and large images
- No server storage needed for drafts
- Auto-saves every 2 seconds with size limit check

**Image Compression Strategy**:
- Client-side compression before upload reduces Edge Function payload
- Max dimensions 1280x1280 maintains quality while reducing size
- JPEG quality 0.72 balances quality vs file size
- Budget enforcement prevents webhook failures from oversized payloads

**3-Stage Video Baking Pipeline**:
- Each stage uploads ("bakes") its output to Cloudinary as a static video
- Enables iterative transformations without complex URL chaining
- **Assembly → Captions → Logo** ensures proper layer ordering
- Captions use Cloudinary text overlays (not burned-in video rendering)
- Whisper transcription + GPT correction for high-quality captions
- Final video is a static Cloudinary asset (no on-the-fly transformations)

## Quick Reference

### Key Files to Know
- `src/App.tsx` - Routing and global providers
- `src/contexts/WizardContext.tsx` - Video wizard state management
- `src/components/VideoWizard.tsx` - Main video creation flow
- `src/lib/wizardStorage.ts` - IndexedDB persistence layer
- `src/integrations/supabase/client.ts` - Supabase client (auto-generated)
- `src/integrations/supabase/types.ts` - Database types (auto-generated)
- `supabase/functions/process-video-generation/index.ts` - Main backend logic
- `.env.example` - Required environment variables

### Common Gotchas
- Dev server runs on port 8080, not 5173
- Supabase client and types files are auto-generated, don't edit manually
- Image compression is critical - without it, webhook payloads will exceed limits
- Edge Functions use Deno, not Node.js (different import syntax)
- IndexedDB auto-save has 50MB limit to prevent browser crashes
- User credits are deducted atomically via RPC function, not direct updates
- Auth state is checked on mount and via subscription in AuthWrapper
- Video generation uses 3-stage baking pipeline - each stage produces a static Cloudinary URL
- Captions are Cloudinary text overlays, not burned-in video frames
- Default app language is Serbian ('sr'), switchable to English ('en')
