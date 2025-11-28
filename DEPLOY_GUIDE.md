# Edge Functions Deployment Guide

## Your Project Info:
- **Project Ref**: `nhbsvtcuehbttqtcgpoc`
- **Supabase URL**: `https://nhbsvtcuehbttqtcgpoc.supabase.co`

---

## Quick Deploy (2 steps):

### Step 1: Get Your Access Token

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click **"Generate New Token"**
3. Give it a name like "CLI Deployment"
4. **Copy the token** (you'll need it for the next step)

---

### Step 2: Run the Deployment Script

Open a **new terminal window** and run:

```bash
# Set your access token (paste the token you copied)
export SUPABASE_ACCESS_TOKEN='paste-your-token-here'

# Set your project ref
export SUPABASE_PROJECT_REF='nhbsvtcuehbttqtcgpoc'

# Navigate to project directory
cd /Users/johhn/Documents/flowforge-init

# Run deployment script
./deploy-functions.sh
```

**That's it!** The script will:
1. Link to your Supabase project
2. Deploy `upload-custom-music` function
3. Deploy `process-video-generation` function

---

## Alternative: Manual Deployment via Dashboard

If the CLI approach doesn't work, you can deploy via the Supabase Dashboard:

### For `upload-custom-music`:

1. Go to: https://supabase.com/dashboard/project/nhbsvtcuehbttqtcgpoc/functions
2. Click **"Create a new function"**
3. Name: `upload-custom-music`
4. **Copy the entire contents** of:
   ```
   supabase/functions/upload-custom-music/index.ts
   ```
5. **Paste** into the editor
6. Click **"Deploy function"**

### For `process-video-generation`:

1. In the same Functions page
2. Find existing `process-video-generation` function (or create new)
3. Click **"Edit"**
4. **Copy the entire contents** of:
   ```
   supabase/functions/process-video-generation/index.ts
   ```
5. **Paste** into the editor (replace existing code)
6. Click **"Deploy function"**

---

## After Deployment: Set Environment Secrets

1. Go to: https://supabase.com/dashboard/project/nhbsvtcuehbttqtcgpoc/functions
2. Click the **gear icon** (⚙️) → **"Manage secrets"**
3. Add these 8 secrets (get values from your `.env` file):

```
LUMA_API_KEY
OPENAI_API_KEY
GOOGLE_AI_API_KEY
ELEVENLABS_API_KEY
ZAPCAP_API_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

4. Click **"Add"** or **"Save"**

---

## Verify Deployment

After deploying, you should see both functions listed at:
https://supabase.com/dashboard/project/nhbsvtcuehbttqtcgpoc/functions

- ✅ `upload-custom-music`
- ✅ `process-video-generation`

Each should show status: **Deployed** (green)

---

## Troubleshooting

**"Command not found: supabase"**
- The CLI was just installed. Try opening a new terminal window.

**"Failed to link project"**
- Make sure `SUPABASE_ACCESS_TOKEN` is set correctly
- Check the token hasn't expired

**"Deployment failed"**
- Check for syntax errors in the function code
- Try deploying via Dashboard instead

**"Function not found when testing"**
- Wait 1-2 minutes after deployment
- Check function logs in Dashboard

---

## Next Step After Deployment:

Run the database migration! See `QUICK_START.md` Step 1.
