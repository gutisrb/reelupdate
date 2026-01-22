import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { emailTemplates } from '../_shared/email-templates.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const OWNER_EMAIL = 'office@smartflow.rs'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
        const body = await req.json()

        // 1. Save to database
        const { error: dbError } = await supabase
            .from('intake_submissions')
            .insert([
                {
                    name: body.name,
                    email: body.email,
                    phone: body.phone,
                    agency: body.agency,
                    videos_per_month: body.videosPerMonth,
                    properties_per_month: body.propertiesPerMonth,
                    platforms: body.platforms,
                    current_video_method: body.currentMethod,
                    start_timeline: body.startTimeline || null,
                }
            ])

        if (dbError) throw dbError

        // 2. Send notification to owner
        const ownerTemplate = emailTemplates.intakeNotification(body)
        await sendEmail(OWNER_EMAIL, ownerTemplate.subject, ownerTemplate.html)

        // 3. Send auto-reply to user
        const userTemplate = emailTemplates.intakeAutoReply(body.name)
        await sendEmail(body.email, userTemplate.subject, userTemplate.html)

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error('Intake submission error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    }
})

async function sendEmail(to: string, subject: string, html: string) {
    if (!RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not set, skipping email send')
        return
    }

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: 'ReelUpdate <noreply@smartflow.rs>', // Adjusted to your domain
            to: [to],
            subject,
            html,
        }),
    })

    if (!res.ok) {
        const error = await res.json()
        console.error('Resend error:', error)
    }
}
