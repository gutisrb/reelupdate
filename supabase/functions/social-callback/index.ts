import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    const requestUrl = new URL(req.url)
    const code = requestUrl.searchParams.get('code')
    const state = requestUrl.searchParams.get('state')
    const error = requestUrl.searchParams.get('error')

    if (error) {
        return new Response(`Error: ${error}`, { status: 400 })
    }

    if (!code || !state) {
        return new Response('Missing code or state', { status: 400 })
    }

    try {
        // Decode state
        const { platform, userId } = JSON.parse(atob(state))

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)
        const redirectUri = `${supabaseUrl}/functions/v1/social-callback`

        let accessToken = ''
        let refreshToken = ''
        let platformUserId = ''
        let platformUsername = ''
        let expiresIn = 0

        if (platform === 'tiktok') {
            const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')
            const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')

            // Exchange code for token
            const tokenParams = new URLSearchParams({
                client_key: clientKey,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            })

            const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: tokenParams,
            })

            const tokenData = await tokenRes.json()
            if (tokenData.error) throw new Error(tokenData.error_description || 'TikTok Token Error')

            accessToken = tokenData.access_token
            refreshToken = tokenData.refresh_token
            expiresIn = tokenData.expires_in

            // Get User Info
            const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })
            const userData = await userRes.json()
            if (userData.error) throw new Error(userData.error.message || 'TikTok User Info Error')

            platformUserId = userData.data.user.open_id
            platformUsername = userData.data.user.display_name
        }
        else if (platform === 'instagram') {
            const clientId = Deno.env.get('INSTAGRAM_CLIENT_ID')
            const clientSecret = Deno.env.get('INSTAGRAM_CLIENT_SECRET')

            // Exchange code for short-lived token
            const formData = new FormData()
            formData.append('client_id', clientId)
            formData.append('client_secret', clientSecret)
            formData.append('grant_type', 'authorization_code')
            formData.append('redirect_uri', redirectUri)
            formData.append('code', code)

            const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
                method: 'POST',
                body: formData,
            })

            const tokenData = await tokenRes.json()
            if (tokenData.error_message) throw new Error(tokenData.error_message)

            const shortLivedToken = tokenData.access_token
            platformUserId = tokenData.user_id.toString() // Instagram returns user_id here

            // Exchange for long-lived token
            const longTokenRes = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`)
            const longTokenData = await longTokenRes.json()

            accessToken = longTokenData.access_token || shortLivedToken
            expiresIn = longTokenData.expires_in || 3600

            // Get Username
            const userRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`)
            const userData = await userRes.json()
            platformUsername = userData.username
        }

        // Save to Database
        const { error: dbError } = await supabase
            .from('social_connections')
            .upsert({
                user_id: userId,
                platform,
                platform_user_id: platformUserId,
                platform_username: platformUsername,
                access_token: accessToken,
                refresh_token: refreshToken || null,
                expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
            }, {
                onConflict: 'user_id,platform'
            })

        if (dbError) throw dbError

        // Redirect back to app
        // Assuming the app is hosted at the origin of the referrer or a known URL
        // For now, redirect to a generic success page or the settings page
        // We should ideally pass the 'redirect_to' in the state as well

        // Hardcoded for now based on user's environment, but should be dynamic
        // The user is likely on localhost:5173 or the netlify URL.
        // Let's redirect to the deployed URL or localhost if dev.
        // Since we don't know, let's redirect to a success HTML page served by this function

        return new Response(
            `<html>
        <script>
          window.location.href = "${Deno.env.get('APP_URL') || 'http://localhost:5173'}/brand-kit";
        </script>
        <body>Authentication successful! Redirecting...</body>
      </html>`,
            { headers: { 'Content-Type': 'text/html' } }
        )

    } catch (error) {
        return new Response(`Authentication failed: ${error.message}`, { status: 500 })
    }
})
