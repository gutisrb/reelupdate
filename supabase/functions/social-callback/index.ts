import { serve } from "std/http/server.ts"
import { createClient } from '@supabase/supabase-js'

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

            // 1. Exchange code for short-lived token
            const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`

            const tokenRes = await fetch(tokenUrl)
            const tokenData = await tokenRes.json()

            if (tokenData.error) throw new Error(tokenData.error.message || 'FB Token Error')

            const shortLivedToken = tokenData.access_token

            // 2. Exchange for long-lived token (60 days validity)
            const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`

            const longLivedRes = await fetch(longLivedUrl)
            const longLivedData = await longLivedRes.json()

            if (longLivedData.error) throw new Error(longLivedData.error.message || 'Failed to get long-lived token')

            accessToken = longLivedData.access_token
            expiresIn = longLivedData.expires_in || 5184000 // 60 days in seconds

            // 3. Get user's Facebook Pages
            const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`)
            const pagesData = await pagesRes.json()

            if (pagesData.error) throw new Error(pagesData.error.message || 'Failed to get Facebook pages')

            // 4. Get first page (or iterate to find IG-connected page)
            let facebookPageId = ''
            let pageAccessToken = ''
            let instagramBusinessId = ''
            let instagramUsername = ''

            if (pagesData.data && pagesData.data.length > 0) {
                // Try to find a page with an Instagram account
                for (const page of pagesData.data) {
                    const pageId = page.id
                    const pageToken = page.access_token // This is the page-scoped access token

                    // Check if this page has a connected IG Business account
                    const igRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`)
                    const igData = await igRes.json()

                    if (igData.instagram_business_account) {
                        facebookPageId = pageId
                        pageAccessToken = pageToken
                        instagramBusinessId = igData.instagram_business_account.id

                        // Get IG username
                        const igUserRes = await fetch(`https://graph.facebook.com/v21.0/${instagramBusinessId}?fields=username&access_token=${pageToken}`)
                        const igUserData = await igUserRes.json()
                        instagramUsername = igUserData.username || 'Unknown'

                        break // Use first page with IG account
                    }
                }

                // If no IG account found, use first page anyway (for FB posting)
                if (!facebookPageId && pagesData.data.length > 0) {
                    const firstPage = pagesData.data[0]
                    facebookPageId = firstPage.id
                    pageAccessToken = firstPage.access_token
                    platformUsername = firstPage.name
                }
            }

            if (!facebookPageId) {
                throw new Error('No Facebook pages found. Please create a Facebook page and link it to an Instagram Business account.')
            }

            platformUserId = facebookPageId // Store FB Page ID as primary identifier
            platformUsername = instagramUsername || platformUsername || 'Facebook Page'

            // Store page access token (more reliable than user token for posting)
            accessToken = pageAccessToken

            // Create separate connections for Instagram and Facebook
            // We'll save Instagram connection if IG account exists
            if (instagramBusinessId) {
                await supabase
                    .from('social_connections')
                    .upsert({
                        user_id: userId,
                        platform: 'instagram',
                        platform_user_id: instagramBusinessId,
                        platform_username: instagramUsername,
                        access_token: pageAccessToken,
                        refresh_token: null,
                        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
                        facebook_page_id: facebookPageId,
                        instagram_business_id: instagramBusinessId,
                        page_access_token: pageAccessToken
                    }, {
                        onConflict: 'user_id,platform'
                    })
            }

            // Also save Facebook connection
            await supabase
                .from('social_connections')
                .upsert({
                    user_id: userId,
                    platform: 'facebook',
                    platform_user_id: facebookPageId,
                    platform_username: platformUsername,
                    access_token: pageAccessToken,
                    refresh_token: null,
                    expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
                    facebook_page_id: facebookPageId,
                    page_access_token: pageAccessToken
                }, {
                    onConflict: 'user_id,platform'
                })

            // Skip the default save below since we already saved
            platformUserId = '' // This will skip the generic save
        }

        // Save to Database (only for TikTok, Instagram/Facebook already saved above)
        if (platformUserId) {
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
        }

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
          window.location.href = "${Deno.env.get('APP_URL') || 'http://localhost:5173'}/app/settings?tab=social";
        </script>
        <body>Authentication successful! Redirecting...</body>
      </html>`,
            { headers: { 'Content-Type': 'text/html' } }
        )

    } catch (error) {
        return new Response(`Authentication failed: ${error.message}`, { status: 500 })
    }
})
