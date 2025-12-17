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
                console.log(`[TikTok Auth] Raw Key: '${clientKey}'`)
                if (!clientKey) throw new Error('TIKTOK_CLIENT_KEY not set')

                // Trim key just in case
                const cleanKey = clientKey.trim();

                const scopes = 'user.info.basic,video.publish,video.upload'

                url = `https://www.tiktok.com/v2/auth/authorize?client_key=${cleanKey}&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
                console.log(`[TikTok Auth] Generated URL: ${url}`)
            }
            else if (platform === 'instagram') {
                const clientId = Deno.env.get('INSTAGRAM_CLIENT_ID')
                console.log(`[Instagram Auth] Raw ID: '${clientId}'`)
                if (!clientId) throw new Error('INSTAGRAM_CLIENT_ID not set (FB App ID)')

                // Trim ID
                const cleanId = clientId.trim();

                // FB Login scopes for Instagram Business
                const scopes = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management'

                // Use Facebook Login endpoint
                // API Version v21.0 or latest
                url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${cleanId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${state}&response_type=code`
                console.log(`[Instagram Auth] Generated URL: ${url}`)
            }
            else {
                throw new Error(`Unsupported platform: ${platform}`)
            }

            console.log(`[Social Auth] Returning URL: ${url}`)
            return new Response(
                JSON.stringify({ url }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            )
        } catch (error) {
            console.error('Error in social-auth:', error)
            return new Response(
                JSON.stringify({ error: (error as Error).message }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                },
            )
        }
    } catch (e) {
        return new Response((e as Error).message, { status: 500, headers: corsHeaders })
    }
})
