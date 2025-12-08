import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { userId, platform, videoUrl, caption } = await req.json()

        if (!userId || !platform || !videoUrl) {
            throw new Error('Missing required fields: userId, platform, videoUrl')
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Fetch connection
        const { data: connection, error: connError } = await supabase
            .from('social_connections')
            .select('*')
            .eq('user_id', userId)
            .eq('platform', platform)
            .single()

        if (connError || !connection) {
            throw new Error(`No connection found for ${platform}`)
        }

        // TODO: Check for token expiration and refresh if needed
        const accessToken = connection.access_token

        let result = {}

        if (platform === 'tiktok') {
            // TikTok Video Publish API
            // 1. Init
            const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json; charset=UTF-8'
                },
                body: JSON.stringify({
                    post_info: {
                        title: caption || "Check out this property!",
                        privacy_level: "PUBLIC_TO_EVERYONE",
                        disable_duet: false,
                        disable_comment: false,
                        disable_stitch: false,
                        video_cover_timestamp_ms: 1000
                    },
                    source_info: {
                        source: "PULL_FROM_URL", // If TikTok supports this, otherwise FILE_UPLOAD
                        video_url: videoUrl // NOTE: TikTok might require FILE_UPLOAD for most cases. PULL_FROM_URL is restricted.
                        // If PULL_FROM_URL is not available, we need to download the video and upload it as binary.
                        // For this MVP/Demo, we will TRY PULL_FROM_URL. If it fails, we might need to mock or implement binary upload.
                    }
                })
            })

            const initData = await initRes.json()

            if (initData.error && initData.error.code !== 'ok') {
                // Fallback or Error
                console.error('TikTok Init Error:', initData)
                // For DEMO purposes, if we fail here, we might want to return a mock success if the user just wants to record the UI flow.
                // But let's try to be real.
                throw new Error(`TikTok API Error: ${JSON.stringify(initData.error)}`)
            }

            result = initData
        }
        else if (platform === 'instagram') {
            // Instagram Graph API
            // 1. Create Container
            const containerRes = await fetch(`https://graph.facebook.com/v18.0/${connection.platform_user_id}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    media_type: 'REELS',
                    video_url: videoUrl,
                    caption: caption || "Check out this property!",
                    access_token: accessToken
                })
            })

            const containerData = await containerRes.json()
            if (containerData.error) throw new Error(`IG Container Error: ${containerData.error.message}`)

            // 2. Publish Container
            const publishRes = await fetch(`https://graph.facebook.com/v18.0/${connection.platform_user_id}/media_publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creation_id: containerData.id,
                    access_token: accessToken
                })
            })

            const publishData = await publishRes.json()
            if (publishData.error) throw new Error(`IG Publish Error: ${publishData.error.message}`)

            result = publishData
        }

        return new Response(
            JSON.stringify({ success: true, data: result }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )

    } catch (error) {
        console.error('Error in post-social-content:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            },
        )
    }
})
