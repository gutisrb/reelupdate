# TikTok App Review Preparation Guide

TikTok requires a video screencast (demo video) to prove how your app uses their APIs before they approve it for public use.

## 🎥 Screencast Script (End-to-End Flow)
You need to record a video (max 50MB, mp4) showing these exact steps:

1.  **Start at the Login Page**:
    - Show the `https://reelupdate.vercel.app/app/login` page.
    - Click "Continue with TikTok" (or navigate to Settings and click "Connect TikTok").
2.  **TikTok Consent Screen**:
    - The screen must clearly show **Reel Estate** requesting permissions.
    - Important: The viewer must see the scopes: "Read profile info", "Post to TikTok", and "Upload to TikTok".
3.  **App Interface**:
    - After redirecting back, show the "Connected as @username" status in your Settings.
4.  **Core Feature & Posting**:
    - Navigate to your Video Generator.
    - Select a property/photos and generate a reel.
    - Once the reel is ready, click the **"Post to TikTok"** button.
5.  **TikTok App/Site Confirmation**:
    - Show the success message in ReelUpdate.
    - (Optional but recommended) Go to TikTok (web or app) and show the video appearing in your "Drafts" or as a "Private" video (to prove it worked).

> [!TIP]
> TikTok is very strict about the **App Icon** and **Description**. Make sure they match exactly between your TikTok Developer Dashboard and your website.

## 📋 TikTok Dashboard Checklist
Based on your screenshots, ensure these are finalized:

- **App Icon**: Ensure it's 1024x1024 and matches your brand logo.
- **Category**: "Photo & Video" is correct.
- **Description**: "Automated AI social media videos for Real Estate agencies" is good.
- **Scopes**: You have `user.info.basic`, `video.publish`, and `video.upload`. This is correct for "Direct Post".
- **Redirect URI**: `https://nhbsvtcuehbttqtcgpoc.supabase.co/functions/v1/social-callback` is correctly set.

## 🧪 Testing Meta (Instagram)
Before you record for TikTok, verify your Meta setup:

1.  Go to your app's **Settings -> Social Accounts**.
2.  Click **Connect Instagram**. (Ensure you use a Facebook account that manages a Page which is linked to an Instagram Business/Creator account).
3.  Once connected, click the **"Test Post"** button.
4.  If it fails, look at the toast message—it will now tell you if your account tier needs updated (though I've enabled it for `beta_user` and `manual`).

---

### Need a Sample Video for the Screencast?
If you haven't generated a video yet, I can provide a sample hosted URL to simulate the final step if needed, but TikTok prefers seeing the actual app flow.
