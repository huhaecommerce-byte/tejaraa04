import { corsHeaders } from './_shared/runtime.server'
import { drainOutbox } from './process-email-outbox.server'

const SITE_ROOT = 'https://tejaraa.com'

interface Stage {
  key: string
  minMinutes: number
  maxMinutes: number
}

// Two nudges only: ~1h after signup and ~24h after signup.
const STAGES: Stage[] = [
  { key: 'h1', minMinutes: 60, maxMinutes: 60 * 20 },
  { key: 'h24', minMinutes: 60 * 24, maxMinutes: 60 * 24 * 7 },
]

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export async function handler(_request: Request) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

  const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })
  if (error) return json({ ok: false, error: error.message }, 500)

  const now = Date.now()
  let queued = 0
  const skipped: string[] = []

  for (const user of list.users) {
    if (user.email_confirmed_at || !user.email) continue
    const ageMin = (now - new Date(user.created_at).getTime()) / 60000
    const stage = STAGES.find((s) => ageMin >= s.minMinutes && ageMin <= s.maxMinutes)
    if (!stage) continue

    // One reminder per stage per user — the unique index makes this race-safe.
    const { error: logError } = await supabaseAdmin
      .from('signup_reminder_log')
      .insert({ user_id: user.id, email: user.email, stage: stage.key })
    if (logError) {
      skipped.push(`${user.email}:${stage.key}`)
      continue
    }

    let confirmUrl = `${SITE_ROOT}/login`
    try {
      const { data: link } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: user.email,
        password: crypto.randomUUID(),
        options: { redirectTo: `${SITE_ROOT}/dropshipping` },
      })
      if (link?.properties?.action_link) confirmUrl = link.properties.action_link
    } catch {
      /* fall back to the login page */
    }

    const { error: queueError } = await supabaseAdmin.from('email_outbox').insert({
      dedupe_key: `${user.id}:confirm-reminder:${stage.key}`,
      template_name: 'confirm-reminder',
      recipient_email: user.email,
      recipient_user_id: user.id,
      payload: {
        customerName:
          (user.user_metadata?.['full_name'] as string | undefined) ||
          user.email.split('@')[0],
        confirmUrl,
        creditAmount: 20,
      },
    })
    if (queueError) {
      skipped.push(`${user.email}:queue`)
      continue
    }
    queued += 1
  }

  if (queued > 0) {
    try {
      await drainOutbox()
    } catch {
      /* the scheduled outbox processor picks up the rest */
    }
  }

  return json({ ok: true, queued, skipped: skipped.length })
}
