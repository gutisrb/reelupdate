# Social Integration Configuration Checklist

To ensure your app review and testing go smoothly, please verify that these **Secrets** are set in your Supabase Dashboard (**Settings -> Edge Functions -> Manage Secrets**).

## 1. Environment Variables (Secrets)
Ensure these keys are present and match your developer dashboards:

| Secret Name | Value Description | Purpose |
| :--- | :--- | :--- |
| `APP_URL` | `https://reelupdate.vercel.app` | Redirects users back to your app after auth. |
| `TIKTOK_CLIENT_KEY` | *From TikTok Dashboard* | TikTok OAuth & Posting |
| `TIKTOK_CLIENT_SECRET` | *From TikTok Dashboard* | TikTok OAuth & Posting |
| `INSTAGRAM_CLIENT_ID` | *Your FB App ID* | Meta OAuth & IG Posting |
| `INSTAGRAM_CLIENT_SECRET` | *Your FB App Secret* | Meta OAuth & IG Posting |

## 2. TikTok Review Checklist
- [x] **Site Verification**: `public/tiktok6bYCiktntlIs0iCiHoacNMN08VBwuIKA.txt` is already in your repository.
- [ ] **Domain Verification**: In TikTok Dashboard under **Content Posting API**, click **Verify** to confirm the text file is reachable at `https://reelupdate.vercel.app/tiktok6bYCiktntlIs0iCiHoacNMN08VBwuIKA.txt`.
- [ ] **Redirect URIs**: Ensure `https://nhbsvtcuehbttqtcgpoc.supabase.co/functions/v1/social-callback` is added to **both** Login Kit and Content Posting API sections in TikTok.
- [ ] **Demo Video**: Record the screencast using the script in `tiktok_app_review_guide.md`.

## 3. Meta (Instagram) Testing Checklist
- [ ] **Account Type**: Your Instagram account **must** be a Business or Creator account.
- [ ] **FB Page Link**: Your Instagram account **must** be linked to a Facebook Page that you manage.
- [ ] **App Mode**: In Meta Developers Dashboard, ensure your App is in **Live** mode (or add your FB account as a **Tester**/Developer).
- [ ] **Direct Post**: Verify that **Instagram Content Publishing** is enabled in your Meta App products.

> [!IMPORTANT]
> When testing the "Test Post" on Instagram, it may take up to **10-15 seconds** for the success message to appear, as our system now polls Meta to ensure the video is fully processed before finalizing the post.
