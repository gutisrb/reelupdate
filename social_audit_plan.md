# Social Posting Audit & App Review Preparation (UPDATED)

## 🎯 Goal
Verify Meta (Instagram) posting and prepare the necessary elements for TikTok App Review.

## 📋 Critical Fixes Found
- **Schema Mismatch**: The `social_connections` table is missing columns for `instagram_business_id`, `facebook_page_id`, and `page_access_token`. These are required for the "Direct Post" logic to work via the Instagram Content Publishing API.

## 📋 Audit Tasks

### 1. Meta (Instagram) Integration
- [x] Review `social-post` Edge Function for Instagram logic.
- [ ] **Database Fix**: Run the new migration `20260123000002_add_meta_integration_columns.sql`.
- [ ] Verify Facebook Page and Instagram Account linking requirements.
- [x] Add a "Test Post" button in settings (Already present in `SocialConnections.tsx`).

### 2. TikTok App Review
- [x] **Screencast Script**: Created in `tiktok_app_review_guide.md`.
- [x] **Technical Verification**: Scopes `video.publish` and `video.upload` are correctly requested.
- [x] **Site Verification**: `public/tiktok6b...txt` is present.

## 🛠 Proposed Changes

### [Database]
#### [NEW] [20260123000002_add_meta_integration_columns.sql](file:///Users/johhn/reelupdate-1/supabase/migrations/20260123000002_add_meta_integration_columns.sql)
- Adds `instagram_business_id`, `facebook_page_id`, and `page_access_token` columns.

### [Supabase Functions]
#### [DONE] [social-post](file:///Users/johhn/reelupdate-1/supabase/functions/social-post/index.ts)
- Updated to allow beta tiers and added status polling for Reels processing.

## 🧪 Verification Flow
1. Run the new migration in Supabase.
2. Connect Instagram via Settings.
3. Trigger a test post.
4. If successful, record the TikTok screencast following the new guide.
