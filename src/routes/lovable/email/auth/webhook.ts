import * as React from 'react'
import { render } from '@react-email/render'
import { WebhookError, verifyWebhookRequest } from '@lovable.dev/webhooks-js'
import { createFileRoute } from '@tanstack/react-router'
import { SignupEmail } from '@/lib/email-templates/signup'
import { InviteEmail } from '@/lib/email-templates/invite'
import { MagicLinkEmail } from '@/lib/email-templates/magic-link'
import { RecoveryEmail } from '@/lib/email-templates/recovery'
import { EmailChangeEmail } from '@/lib/email-templates/email-change'
import { ReauthenticationEmail } from '@/lib/email-templates/reauthentication'
import { DEFAULT_FROM, SITE_NAME, sendResendEmail } from '@/lib/email-templates/resend.server'

const ROOT_DOMAIN = 'tejaraa.com'
const SITE_URL = `https://${ROOT_DOMAIN}`

interface AuthHookData {
  action_type: string
  url: string
  email: string
  old_email?: string | null
  new_email?: string | null
  token?: string | null
}

interface AuthHookPayload {
  version: string
  run_id?: string
  data: AuthHookData
}

const emails: Record<
  string,
  { subject: string; render: (data: AuthHookData) => React.ReactElement }
> = {
  signup: {
    // The in-portal 4-digit code is sent by sendSignupOtp; this email is the
    // one-click confirmation link backup, so no token is shown here.
    subject: 'Confirm your email',
    render: (data) =>
      React.createElement(SignupEmail, {
        siteName: SITE_NAME,
        siteUrl: SITE_URL,
        recipient: data.email,
        confirmationUrl: data.url,
      }),
  },
  invite: {
    subject: "You've been invited",
    render: (data) =>
      React.createElement(InviteEmail, {
        siteName: SITE_NAME,
        siteUrl: SITE_URL,
        confirmationUrl: data.url,
      }),
  },
  magiclink: {
    subject: 'Your login link',
    render: (data) =>
      React.createElement(MagicLinkEmail, {
        siteName: SITE_NAME,
        confirmationUrl: data.url,
      }),
  },
  recovery: {
    subject: 'Reset your password',
    render: (data) =>
      React.createElement(RecoveryEmail, {
        siteName: SITE_NAME,
        confirmationUrl: data.url,
      }),
  },
  email_change: {
    subject: 'Confirm your new email',
    render: (data) =>
      React.createElement(EmailChangeEmail, {
        siteName: SITE_NAME,
        oldEmail: data.old_email ?? '',
        email: data.email,
        newEmail: data.new_email ?? '',
        confirmationUrl: data.url,
      }),
  },
  reauthentication: {
    subject: 'Your verification code',
    render: (data) => React.createElement(ReauthenticationEmail, { token: data.token ?? '' }),
  },
}

// Auth emails are delivered through Resend (connector gateway); Lovable only
// signs and delivers the auth hook payload.
export const Route = createFileRoute('/lovable/email/auth/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env['LOVABLE_API_KEY']
        if (!apiKey) {
          return Response.json({ error: 'Missing Lovable API key' }, { status: 500 })
        }

        let event: AuthHookPayload
        try {
          ;({ payload: event } = await verifyWebhookRequest<AuthHookPayload>({
            req: request,
            secret: apiKey,
            parser: (body) => JSON.parse(body) as AuthHookPayload,
          }))
        } catch (error) {
          if (error instanceof WebhookError) {
            return Response.json({ error: error.message }, { status: 401 })
          }
          console.error('auth webhook verification failed:', error)
          return Response.json({ error: 'Webhook verification failed' }, { status: 500 })
        }

        const data = event?.data
        // Signup verification is handled in-portal by our own 4-digit code
        // email (sendSignupOtp), so skip Supabase's confirmation email to
        // avoid sending two emails for one signup.
        if (data?.action_type === 'signup') {
          return Response.json({ success: true, sent: false })
        }
        const definition = data ? emails[data.action_type] : undefined
        if (!data || !definition) {
          return Response.json(
            { error: `Unknown auth email action type: ${data?.action_type}` },
            { status: 400 }
          )
        }

        try {
          const element = definition.render(data)
          const html = await render(element)
          const text = await render(element, { plainText: true })
          await sendResendEmail({
            to: data.email,
            from: DEFAULT_FROM,
            subject: definition.subject,
            html,
            text,
            tags: [{ name: 'type', value: data.action_type }],
          })
        } catch (error) {
          console.error('auth email send failed:', error)
          return Response.json({ error: 'Failed to send email' }, { status: 500 })
        }

        return Response.json({ success: true, sent: true })
      },
    },
  },
})
