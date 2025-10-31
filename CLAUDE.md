# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a real estate video generation application built with React, TypeScript, Vite, and Supabase. The app allows users to create property listing videos by uploading photos and filling in property details, which are then processed through Make.com webhooks to generate AI-powered video content.

## Development Commands

```bash
# Install dependencies
npm i

# Start development server (runs on port 8080)
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

## Architecture

### Routing Structure

The app has two distinct routing contexts:

1. **Public/Marketing Routes** (`/`):
   - Wrapped with `MarketingNav` and `MarketingFooter`
   - Routes: `/`, `/terms`, `/privacy`, `/app/login`

2. **Authenticated App Routes** (`/app/*`):
   - Wrapped with `AuthWrapper` and `AppShell` (authenticated layout)
   - All routes require authentication except `/app/login`
   - Routes: `/app/galerija`, `/app/reel`, `/app/stage`, `/app/docs`, `/app/profile`, `/app/assets`
   - Routing logic in src/App.tsx:27-52

### Global Providers (src/App.tsx)

Applied to all routes in this order (outermost to innermost):
1. `QueryClientProvider` - React Query for server state
2. `TooltipProvider` - shadcn/ui tooltips
3. `Toaster` & `Sonner` - Toast notifications
4. `ProgressProvider` - Global progress state for video processing
5. `WizardProvider` - Multi-step wizard state with IndexedDB persistence

### State Management

**WizardContext** (src/contexts/WizardContext.tsx):
- Manages 3-step video creation wizard state
- Stores: form data, image slots (5-6 slots), clip count, current step
- Auto-persists to IndexedDB every 2 seconds (with 50MB size limit check)
- State survives page refreshes
- Key methods: `updateFormData`, `updateSlots`, `updateClipCount`, `setCurrentStep`, `resetWizard`

**ProgressContext** (src/contexts/ProgressContext.tsx):
- Simple global progress state (0-100) for video processing feedback

### Data Persistence

**IndexedDB Storage** (src/lib/wizardStorage.ts):
- Database: `WizardDrafts`, Store: `drafts`
- Serializes wizard data including File objects to ArrayBuffers
- Restores files from IndexedDB on app load
- Handles large image uploads (logs slot/image counts for debugging)

### Supabase Integration

**Client** (src/integrations/supabase/client.ts):
- Auto-generated file - do not edit manually
- Uses localStorage for auth persistence with auto-refresh

**Database Tables** (src/integrations/supabase/types.ts):
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
3. **Step 3 (Preview)**: Review and submit to Make.com webhook

**Submission Process**:
- Compresses images before sending (src/lib/compressWebhookImage.ts)
- Sends multipart form data to Make.com webhook (MAKE_VIDEO_URL)
- Includes: video_id, form data, images, grouping metadata, user_id
- Resets wizard and navigates to `/app/galerija` on success

### Make.com Integration

**Webhook Configuration** (src/config/make.ts):
- `MAKE_VIDEO_URL`: Video creation endpoint
- `MAKE_CREATE_URL` / `WEBHOOK_URL`: Legacy creation endpoint
- `MAKE_STATUS_URL` / `STATUS_URL`: Status polling endpoint
- `MAKE_API_KEY`: Simple API key for webhook authentication

**Note**: These are currently hardcoded. Consider moving to environment variables for different environments.

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

### Component Library

Uses shadcn/ui components (src/components/ui/):
- All components configured via components.json
- Styled with Tailwind CSS and CVA (class-variance-authority)
- Import path alias: `@/` maps to `src/`

### File Upload Handling

- Uses react-dropzone for drag-and-drop
- Supports bulk upload with automatic slot distribution
- Files stored as File objects in wizard state
- Compressed before webhook submission to reduce payload size

## Common Development Patterns

### Adding a New App Page

1. Create page component in `src/pages/app/`
2. Add route in `src/App.tsx` inside the `<AuthWrapper>` block at src/App.tsx:35-46
3. Update navigation in `src/components/AppNavigation.tsx`

### Fetching User Profile

```typescript
import { useProfile } from '@/hooks/useProfile';

const { profile, loading } = useProfile(user);
// profile.video_credits_remaining, profile.webhook_url, etc.
```

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

## Important Constraints

- Development server runs on port 8080 (not default 5173)
- IndexedDB has 50MB auto-save limit for wizard state
- Each image slot supports maximum 2 images
- Total slots: 5 or 6 (controlled by clipCount)
- Make.com webhooks expect specific multipart form data structure with compressed images
