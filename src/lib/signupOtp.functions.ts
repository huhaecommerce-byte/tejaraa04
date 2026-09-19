import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import * as React from 'react'
import { render } from '@react-email/render'
import { SignupEmail } from '@/lib/email-templates/signup'
import { DEFAULT_FROM, SITE_NAME, sendResendEmail } from '@/lib/email-templates/resend.server'

const emailSchema = z.object({ email: z.string().trim().email().max(255) })
const verifySchema = z.object({
  email: z.string().trim().email().max(255),
  code: z.string().trim().regex(/^\d{4}$/, 'Code must be 4 digits'),
})

// Sends a 4-digit signup code. Public (pre-auth), so access goes through the
// service-role client and the code expires after 10 minutes.
export const sendSignupOtp = createServerFn({ method: 'POST' })
  .inputValidator((data) => emailSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const email = data.email.toLowerCase()
    const code = String(Math.floor(1000 + Math.random() * 9000))

    const { error } = await supabaseAdmin
      .from('signup_otps')
      .upsert({ email, code, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() })
    if (error) throw new Error('Could not create verification code')

    const siteUrl = 'https://tejaraa.com'
    const element = React.createElement(SignupEmail, {
      siteName: SITE_NAME,
      siteUrl,
      recipient: email,
      confirmationUrl: `${siteUrl}/signup`,
      token: code,
    })
    const html = await render(element)
    const text = await render(element, { plainText: true })
    await sendResendEmail({
      to: email,
      from: DEFAULT_FROM,
      subject: `Your ${SITE_NAME} verification code: ${code}`,
      html,
      text,
      tags: [{ name: 'type', value: 'signup_otp' }],
    })
    return { ok: true }
  })

// Verifies the 4-digit code and confirms the user's email so they can sign in.
export const verifySignupOtp = createServerFn({ method: 'POST' })
  .inputValidator((data) => verifySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const email = data.email.toLowerCase()

    const { data: row } = await supabaseAdmin
      .from('signup_otps')
      .select('code, expires_at')
      .eq('email', email)
      .maybeSingle()

    if (!row || row.code !== data.code || new Date(row.expires_at).getTime() < Date.now()) {
      throw new Error('Invalid or expired code')
    }

    await supabaseAdmin.from('signup_otps').delete().eq('email', email)

    // Confirm the matching unconfirmed user account
    const { data: usersPage } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const user = usersPage?.users?.find((u) => u.email?.toLowerCase() === email)
    if (user && !user.email_confirmed_at) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, { email_confirm: true })
    }
    return { ok: true }
  })
