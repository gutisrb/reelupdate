# Cloudinary Video Setup Instructions

Your website now uses Cloudinary to host videos for fast, reliable delivery! Follow these simple steps to complete the setup.

## Step 1: Create a Free Cloudinary Account

1. Go to: https://cloudinary.com/users/register_free
2. Sign up with your email (takes 2 minutes)
3. **No credit card required** for the free tier
4. Free tier includes 25GB storage (plenty for your videos!)

## Step 2: Get Your Cloud Name

1. After signing up, go to your Cloudinary Dashboard
2. You'll see your account details at the top
3. Copy your **Cloud Name** (it looks like: `dxyz123abc`)

## Step 3: Add Cloud Name to Your Project

1. In your project folder, find the file `.env.local.example`
2. **Copy** this file and rename the copy to `.env.local`
3. Open `.env.local` and replace `your-cloud-name-here` with your actual Cloud Name
4. Example:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=dxyz123abc
   ```
5. Save the file

## Step 4: Upload Your Videos to Cloudinary

1. Log in to Cloudinary: https://console.cloudinary.com/
2. Click **"Media Library"** in the left sidebar
3. Click the **"Upload"** button (blue button in top right)
4. **Drag and drop** or select your 5 videos:
   - Your hero/motion graphic video
   - Demo video 1
   - Demo video 2
   - Demo video 3
   - Your new 5th video

## Step 5: Rename Videos in Cloudinary

After uploading, you need to rename each video to match what the code expects:

### Hero Video (the main video on your homepage)
1. Find your motion graphic/hero video in Media Library
2. Click on it
3. Click the **pencil icon** to edit
4. Change the **Public ID** to: `hero-video`
5. Save

### Demo Videos (the 3 example videos)
1. Find your first demo video
2. Change Public ID to: `demo-video-1`
3. Save

4. Find your second demo video
5. Change Public ID to: `demo-video-2`
6. Save

7. Find your third demo video
8. Change Public ID to: `demo-video-3`
9. Save

### Your New 5th Video
If you want to add a 5th video to the examples section:
1. Upload it to Cloudinary
2. Change Public ID to: `demo-video-4`
3. Let me know and I'll update the code to show 4 videos

## Step 6: Test It!

1. Make sure your `.env.local` file has the correct Cloud Name
2. Restart your development server:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```
3. Open http://localhost:8080 in your browser
4. Your videos should now load fast from Cloudinary!

## Troubleshooting

### Videos not showing?
- Check that `.env.local` file exists (not `.env.local.example`)
- Verify Cloud Name is correct in `.env.local`
- Verify Public IDs match exactly (case-sensitive):
  - `hero-video`
  - `demo-video-1`
  - `demo-video-2`
  - `demo-video-3`

### Videos load slowly?
- Wait a few minutes after upload (Cloudinary processes videos)
- Check your internet connection

### Need Help?
- Cloudinary Support: https://support.cloudinary.com/
- Email me with screenshots and I'll help!

## Video Naming Reference

| Location | Public ID Required |
|----------|-------------------|
| Hero Section (homepage video) | `hero-video` |
| Example Video 1 | `demo-video-1` |
| Example Video 2 | `demo-video-2` |
| Example Video 3 | `demo-video-3` |

That's it! Your videos are now hosted on Cloudinary's fast CDN. 🎉
