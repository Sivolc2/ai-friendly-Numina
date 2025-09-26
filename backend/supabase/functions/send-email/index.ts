import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  type: 'profile_invitation' | 'profile_completion' | 'event_notification'
  eventName?: string
  profileUrl?: string
  eventUrl?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log('Received request body:', requestBody)

    const { to, subject, html, type, eventName, profileUrl, eventUrl }: EmailRequest = requestBody

    // Validate required fields
    if (!to) {
      throw new Error('Missing required field: to')
    }
    if (!subject) {
      throw new Error('Missing required field: subject')
    }
    if (!html) {
      throw new Error('Missing required field: html')
    }

    console.log('Validated fields:', { to, subject: subject?.substring(0, 50), hasHtml: !!html })

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      throw new Error('RESEND_API_KEY environment variable is not set. Please configure it in Supabase Dashboard > Edge Functions > Secrets')
    }

    // Get email sender configuration
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'AI-Friendly Numina <hello@ai-friendly-numina.com>'
    console.log('Using email sender:', emailFrom)

    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: to, // Use the actual recipient email address
        subject: subject,
        html: html,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Resend API error: ${response.status} - ${errorData}`)
    }

    const result = await response.json()

    // Log email sent for analytics
    console.log(`Email sent successfully: ${type} to ${to}`, {
      emailId: result.id,
      type,
      eventName,
      timestamp: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({
        success: true,
        emailId: result.id,
        message: 'Email sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error sending email:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send email'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})