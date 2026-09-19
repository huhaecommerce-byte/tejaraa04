// Server-only: sends email through Resend via the Lovable connector gateway.
// Used for both auth emails (signup, password reset, ...) and app alert emails.

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend'

export const SITE_NAME = 'Tejaraa'
export const FROM_DOMAIN = 'tejaraa.com'
export const DEFAULT_FROM = `${SITE_NAME} <noreply@${FROM_DOMAIN}>`

export interface ResendSendPayload {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  tags?: { name: string; value: string }[]
}

export async function sendResendEmail(payload: ResendSendPayload): Promise<{ id?: string }> {
  const lovableApiKey = process.env['LOVABLE_API_KEY']
  const resendKey = process.env['RESEND_API_KEY']
  if (!lovableApiKey) throw new Error('LOVABLE_API_KEY is not configured')
  if (!resendKey) throw new Error('RESEND_API_KEY is not configured')

  const body: Record<string, unknown> = {
    from: payload.from ?? DEFAULT_FROM,
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    subject: payload.subject,
    html: payload.html,
  }
  if (payload.text) body['text'] = payload.text
  if (payload.replyTo) body['reply_to'] = payload.replyTo
  if (payload.tags) body['tags'] = payload.tags

  const response = await fetch(`${GATEWAY_URL}/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': resendKey,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`Resend send failed [${response.status}]: ${errorBody}`)
    throw new Error(`Resend send failed [${response.status}]: ${errorBody}`)
  }

  return (await response.json()) as { id?: string }
}
