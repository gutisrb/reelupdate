
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

        // 3. Check User's Subscription Tier (autoposting requires Professional+)
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: profile, error: profileError } = await adminClient
            .from('profiles')
            .select('subscription_tier')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) throw new Error('Could not fetch user profile')

        // Validate tier allows autoposting
        const autopostingTiers = ['professional', 'agency', 'enterprise', 'beta_user', 'manual']
        if (!autopostingTiers.includes(profile.subscription_tier)) {
            return new Response(JSON.stringify({
                error: `Autoposting requires Professional tier or higher. Your current tier is '${profile.subscription_tier}'.`
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            })
        }

        // 4. Get Connection Tokens
        const { data: connection, error: connError } = await adminClient
            .from('social_connections')
            .select('*')
            .eq('id', connection_id)
            .eq('user_id', user.id) // Ensure ownership
            .single()

        if (connError || !connection) throw new Error('Connection not found')

        let result = {}

        // 5. Platform Specific Logic
        if (platform === 'tiktok') {
            result = await postToTikTok(connection, video_url, caption)
        } else if (platform === 'instagram') {
            result = await postToInstagram(connection, video_url, caption)
        } else if (platform === 'facebook') {
            result = await postToFacebook(connection, video_url, caption)
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
    const pageAccessToken = connection.page_access_token || connection.access_token
    const igUserId = connection.instagram_business_id || connection.platform_user_id

    if (!igUserId) {
        throw new Error('Instagram Business account not found. Please reconnect your Instagram account.')
    }

    // 1. Create Media Container
    const containerUrl = `https://graph.facebook.com/v21.0/${igUserId}/media`
    const params = new URLSearchParams({
        media_type: 'REELS',
        video_url: videoUrl,
        caption: caption,
        access_token: pageAccessToken
    })

    const containerRes = await fetch(`${containerUrl}?${params.toString()}`, { method: 'POST' })
    const containerData = await containerRes.json()

    if (containerData.error) {
        throw new Error(`Instagram Container Error: ${containerData.error.message}`)
    }

    const creationId = containerData.id

    // 2. Poll for Processing Status
    // Instagram requires the media to be finished processing before publishing.
    let isReady = false
    let attempts = 0
    const maxAttempts = 12 // 60 seconds total (5s intervals)

    while (!isReady && attempts < maxAttempts) {
        attempts++
        // Wait 5 seconds between polls
        await new Promise(resolve => setTimeout(resolve, 5000))

        const statusRes = await fetch(`https://graph.facebook.com/v21.0/${creationId}?fields=status_code&access_token=${pageAccessToken}`)
        const statusData = await statusRes.json()

        if (statusData.status_code === 'FINISHED') {
            isReady = true
        } else if (statusData.status_code === 'ERROR') {
            throw new Error('Instagram media processing failed.')
        }
    }

    if (!isReady) {
        return {
            success: false,
            pending: true,
            creation_id: creationId,
            message: 'Media is still processing. Please check your Instagram account in a minute.'
        }
    }

    // 3. Publish the Container
    const publishUrl = `https://graph.facebook.com/v21.0/${igUserId}/media_publish?creation_id=${creationId}&access_token=${pageAccessToken}`
    const publishRes = await fetch(publishUrl, { method: 'POST' })
    const publishData = await publishRes.json()

    if (publishData.error) {
        throw new Error(`Instagram Publish Error: ${publishData.error.message}`)
    }

    return { success: true, platform: 'instagram', data: publishData }
}

// --- Facebook Logic ---
async function postToFacebook(connection: any, videoUrl: string, caption: string) {
    // Use page access token and Facebook Page ID
    const pageAccessToken = connection.page_access_token || connection.access_token
    const pageId = connection.facebook_page_id || connection.platform_user_id

    if (!pageId) {
        throw new Error('Facebook Page not found. Please reconnect your Facebook account.')
    }

    // Upload video to Facebook Page
    // POST /{page-id}/videos
    const uploadUrl = `https://graph.facebook.com/v21.0/${pageId}/videos`

    const params = new URLSearchParams({
        access_token: pageAccessToken,
        description: caption,
        file_url: videoUrl
    })

    const response = await fetch(`${uploadUrl}?${params.toString()}`, {
        method: 'POST'
    })

    const data = await response.json()

    if (data.error) {
        throw new Error(`Facebook Post Error: ${data.error.message}`)
    }

    return { success: true, platform: 'facebook', data }
}
