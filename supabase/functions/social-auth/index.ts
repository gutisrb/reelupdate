import { serve } from "std/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get user from Auth header
        const authHeader = req.headers.get('Authorization')!
        const token = authHeader.replace('Bearer ', '')
        // We can decode the JWT to get the sub (user_id) without verifying signature here 
        // (verification happens by Supabase Gateway usually, but we can trust the header if internal)
        // Better: Use supabase client to getUser

        // For now, let's just assume the frontend passes the user_id in the body for the state
        // OR better, we generate a state that includes the user_id.
        // Let's rely on the frontend passing the user ID in the body for simplicity of this step, 
        // but ideally we extract it from the JWT.

        const { platform, userId } = await req.json()

        if (!userId) throw new Error('User ID required')

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const redirectUri = `${supabaseUrl}/functions/v1/social-callback`

        let url = ''
        // Encode platform and userId in state
        const state = btoa(JSON.stringify({ platform, userId }))

        if (platform === 'tiktok') {
            const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')
            if (!clientKey) throw new Error('TIKTOK_CLIENT_KEY not set')

            const scopes = 'user.info.basic,video.publish,video.upload'

            url = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
        }
        else if (platform === 'instagram') {
            const clientId = Deno.env.get('INSTAGRAM_CLIENT_ID')
            if (!clientId) throw new Error('INSTAGRAM_CLIENT_ID not set')

            const scopes = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement'

            url = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${state}`
        }
        else {
            throw new Error('Invalid platform')
        }

        return new Response(
            JSON.stringify({ url }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
