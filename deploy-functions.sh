#!/bin/bash

# Deploy Edge Functions to Supabase
# This script helps you deploy without needing the full Supabase CLI login flow

echo "🚀 Supabase Edge Functions Deployment Script"
echo "=============================================="
echo ""

# Check if SUPABASE_ACCESS_TOKEN is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ SUPABASE_ACCESS_TOKEN not found in environment"
    echo ""
    echo "To get your access token:"
    echo "1. Go to: https://supabase.com/dashboard/account/tokens"
    echo "2. Click 'Generate New Token'"
    echo "3. Copy the token"
    echo "4. Run this command:"
    echo ""
    echo "   export SUPABASE_ACCESS_TOKEN='your-token-here'"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Check if we have a project ref
if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo "❌ SUPABASE_PROJECT_REF not found"
    echo ""
    echo "Your project ref is in your Supabase URL:"
    echo "https://[PROJECT_REF].supabase.co"
    echo ""
    echo "Set it with:"
    echo "   export SUPABASE_PROJECT_REF='your-project-ref'"
    echo ""
    exit 1
fi

echo "✅ Access token found"
echo "✅ Project ref: $SUPABASE_PROJECT_REF"
echo ""

# Link project
echo "🔗 Linking to Supabase project..."
supabase link --project-ref "$SUPABASE_PROJECT_REF"

if [ $? -ne 0 ]; then
    echo "❌ Failed to link project"
    exit 1
fi

echo "✅ Project linked successfully"
echo ""

# Deploy upload-custom-music function
echo "📦 Deploying upload-custom-music function..."
supabase functions deploy upload-custom-music --no-verify-jwt

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy upload-custom-music"
    exit 1
fi

echo "✅ upload-custom-music deployed successfully"
echo ""

# Deploy process-video-generation function
echo "📦 Deploying process-video-generation function..."
supabase functions deploy process-video-generation --no-verify-jwt

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy process-video-generation"
    exit 1
fi

echo "✅ process-video-generation deployed successfully"
echo ""

echo "🎉 All functions deployed!"
echo ""
echo "Next steps:"
echo "1. Set environment secrets in Supabase Dashboard"
echo "2. Test the functions"
echo ""
echo "To set secrets, go to:"
echo "https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/functions"
echo "Click the gear icon → Manage secrets"
