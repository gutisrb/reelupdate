
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Get User from Supabase Auth
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        // 2. Parse Input
        const { connection_id, video_url, caption, platform } = await req.json()
        if (!connection_id || !video_url || !platform) throw new Error('Missing required fields')

        // 3. Get Connection Tokens
        // We use the service_role key to read the tokens (security critical)
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: connection, error: connError } = await adminClient
            .from('social_connections')
            .select('*')
            .eq('id', connection_id)
            .eq('user_id', user.id) // Ensure ownership
            .single()

        if (connError || !connection) throw new Error('Connection not found')

        let result = {}

        // 4. Platform Specific Logic
        if (platform === 'tiktok') {
            result = await postToTikTok(connection, video_url, caption)
        } else if (platform === 'instagram') {
            result = await postToInstagram(connection, video_url, caption)
        } else {
            throw new Error('Unsupported platform')
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

// --- TikTok Logic ---
async function postToTikTok(connection: any, videoUrl: string, caption: string) {
    const accessToken = connection.access_token
    // TODO: Handle token refresh if expired (TikTok tokens expire quickly!)

    // 1. Init Post
    // https://developers.tiktok.com/doc/content-posting-api-reference-direct-post/
    const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
            post_info: {
                title: caption,
                privacy_level: 'SELF_ONLY', // Default to private for safety/review
                disable_duet: false,
                disable_comment: false,
                disable_stitch: false,
                video_cover_timestamp_ms: 1000
            },
            source_info: {
                source: 'PULL_FROM_URL', // Much easier if we have a public URL
                video_url: videoUrl
            }
        })
    })

    const initData = await initRes.json()
    if (initData.error && initData.error.code !== 'ok') {
        throw new Error(`TikTok Init Error: ${JSON.stringify(initData.error)}`)
    }

    // With PULL_FROM_URL, we are done! We just return the publish ID.
    return { success: true, platform: 'tiktok', data: initData.data }
}

// --- Instagram Logic ---
async function postToInstagram(connection: any, videoUrl: string, caption: string) {
    // Facebook Page ID linked to the IG account is needed usually? 
    // Actually for IG Graph API, we post to the IG User ID.
    // POST https://graph.facebook.com/v21.0/{ig-user-id}/media

    const accessToken = connection.access_token
    const igUserId = connection.platform_user_id

    // 1. Create Media Container
    const containerUrl = `https://graph.facebook.com/v21.0/${igUserId}/media?media_type=REELS&video_url=${encodeURIComponent(videoUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`

    const containerRes = await fetch(containerUrl, { method: 'POST' })
    const containerData = await containerRes.json()

    if (containerData.error) {
        throw new Error(`Instagram Container Error: ${containerData.error.message}`)
    }

    const creationId = containerData.id

    // 2. Wait for Processing (Naive wait, ideally we poll)
    // Instagram videos take time to process. 
    // We'll try to publish immediately, if it fails, the frontend might need to retry or we sleep here.
    // Rate limit-wise sleeping in edge function is bad, but let's try a small delay.
    // A better approach is usually webhooks or polling status. 
    // For MVP/Screencast, let's just return the 'Pending' status or try to publish.

    // Let's try to publish.
    const publishUrl = `https://graph.facebook.com/v21.0/${igUserId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`
    const publishRes = await fetch(publishUrl, { method: 'POST' })
    const publishData = await publishRes.json()

    if (publishData.error) {
        // If error is "Media is not ready", we should tell user.
        return { success: false, pending: true, creation_id: creationId, message: 'Media processing, try publishing creation_id later', error: publishData.error }
    }

    return { success: true, platform: 'instagram', data: publishData }
}
