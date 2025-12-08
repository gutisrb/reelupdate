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
        if (req.method === 'OPTIONS') {
            return new Response('ok', { headers: corsHeaders })
        }

        try {
            const { platform, userId } = await req.json()

            if (!userId) throw new Error('User ID required')

            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
            // Ensure we have a valid redirect URI. 
            // On localhost, this might need to be configured manually or via ngrok if the provider requires HTTPS.
            // However, for the OAuth flow, the redirect_uri must match what is in the provider's dashboard.
            // Usually this is the production URL of the Edge Function.
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
                throw new Error(`Unsupported platform: ${platform}`)
            }

            return new Response(
                JSON.stringify({ url }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            )
        } catch (error) {
            console.error('Error in social-auth:', error)
            return new Response(
                JSON.stringify({ error: error.message }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                },
            )
        }
    })
