// Server-only: drains the email_outbox queue and sweeps abandoned checkouts.
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { sendTemplateEmail } from '@/lib/email-templates/send-email'
import { corsHeaders } from './_shared/runtime.server'

const BATCH_SIZE = 25
const ABANDON_AFTER_MINUTES = 180
const ABANDON_LOOKBACK_HOURS = 48

interface OutboxRow {
  id: string
  template_name: string
  recipient_email: string
  payload: Record<string, unknown>
  attempts: number
}

async function isTemplateEnabled(name: string) {
  const { data } = await supabaseAdmin
    .from('email_template_settings')
    .select('enabled')
    .eq('template_name', name)
    .maybeSingle()
  return data ? Boolean((data as any).enabled) : true
}

async function isSuppressed(email: string) {
  const { data } = await supabaseAdmin
    .from('suppressed_emails')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle()
  return Boolean(data)
}

export async function drainOutbox(limit = BATCH_SIZE) {
  const { data, error } = await supabaseAdmin
    .from('email_outbox')
    .select('id, template_name, recipient_email, payload, attempts')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as unknown as OutboxRow[]
  let sent = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    try {
      if (!(await isTemplateEnabled(row.template_name))) {
        await supabaseAdmin
          .from('email_outbox')
          .update({ status: 'skipped', error: 'template disabled' })
          .eq('id', row.id)
        skipped++
        continue
      }

      if (await isSuppressed(row.recipient_email)) {
        await supabaseAdmin
          .from('email_outbox')
          .update({ status: 'skipped', error: 'recipient suppressed' })
          .eq('id', row.id)
        skipped++
        continue
      }

      await sendTemplateEmail(row.template_name, row.recipient_email, {
        templateData: row.payload ?? {},
      })

      await supabaseAdmin
        .from('email_outbox')
        .update({ status: 'sent', sent_at: new Date().toISOString(), attempts: row.attempts + 1 })
        .eq('id', row.id)

      await supabaseAdmin.from('email_send_log').insert({
        template_name: row.template_name,
        recipient_email: row.recipient_email,
        status: 'sent',
        metadata: { source: 'outbox', outbox_id: row.id },
      } as any)

      sent++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const attempts = row.attempts + 1
      await supabaseAdmin
        .from('email_outbox')
        .update({
          status: attempts >= 3 ? 'failed' : 'pending',
          attempts,
          error: message.slice(0, 500),
          scheduled_at: new Date(Date.now() + attempts * 10 * 60_000).toISOString(),
        })
        .eq('id', row.id)

      await supabaseAdmin.from('email_send_log').insert({
        template_name: row.template_name,
        recipient_email: row.recipient_email,
        status: 'failed',
        error_message: message.slice(0, 500),
        metadata: { source: 'outbox', outbox_id: row.id },
      } as any)

      failed++
    }
  }

  return { processed: rows.length, sent, skipped, failed }
}

/** Sends one outbox row immediately, regardless of its current status. */
export async function sendOutboxRow(id: string) {
  const { data, error } = await supabaseAdmin
    .from('email_outbox')
    .select('id, template_name, recipient_email, payload, attempts')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Email not found')

  const row = data as unknown as OutboxRow

  try {
    await sendTemplateEmail(row.template_name, row.recipient_email, {
      templateData: row.payload ?? {},
    })

    await supabaseAdmin
      .from('email_outbox')
      .update({
        status: 'sent',
        error: null,
        sent_at: new Date().toISOString(),
        attempts: row.attempts + 1,
      })
      .eq('id', row.id)

    await supabaseAdmin.from('email_send_log').insert({
      template_name: row.template_name,
      recipient_email: row.recipient_email,
      status: 'sent',
      metadata: { source: 'manual', outbox_id: row.id },
    } as any)

    return { ok: true, recipient: row.recipient_email }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await supabaseAdmin
      .from('email_outbox')
      .update({ status: 'failed', attempts: row.attempts + 1, error: message.slice(0, 500) })
      .eq('id', row.id)

    await supabaseAdmin.from('email_send_log').insert({
      template_name: row.template_name,
      recipient_email: row.recipient_email,
      status: 'failed',
      error_message: message.slice(0, 500),
      metadata: { source: 'manual', outbox_id: row.id },
    } as any)

    throw new Error(message)
  }
}

export async function sweepAbandonedCheckouts() {
  const since = new Date(Date.now() - ABANDON_LOOKBACK_HOURS * 3600_000).toISOString()
  const until = new Date(Date.now() - ABANDON_AFTER_MINUTES * 60_000).toISOString()

  const { data: started } = await supabaseAdmin
    .from('site_events')
    .select('id, user_id, session_id, props, created_at')
    .eq('name', 'checkout_started')
    .not('user_id', 'is', null)
    .gte('created_at', since)
    .lte('created_at', until)
    .limit(200)

  const events = (started ?? []) as any[]
  let queued = 0

  for (const event of events) {
    const { data: placed } = await supabaseAdmin
      .from('site_events')
      .select('id')
      .eq('name', 'order_placed')
      .eq('session_id', event.session_id)
      .gte('created_at', event.created_at)
      .limit(1)
    if (placed && placed.length) continue

    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('user_id', event.user_id)
      .gte('created_at', event.created_at)
      .limit(1)
    if (orders && orders.length) continue

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, display_name')
      .eq('user_id', event.user_id)
      .maybeSingle()
    const email = (profile as any)?.email
    if (!email) continue

    const total = event.props?.total
    const { error } = await supabaseAdmin.from('email_outbox').insert({
      dedupe_key: `${event.id}:abandoned-checkout`,
      template_name: 'abandoned-checkout',
      recipient_email: email,
      recipient_user_id: event.user_id,
      payload: {
        customerName: (profile as any)?.display_name ?? null,
        total: total != null ? String(total) : undefined,
        currency: 'SAR',
        resumeUrl: 'https://tejaraa.com/dropshipping/place-order',
      },
    } as any)
    if (!error) queued++
  }

  return { checked: events.length, queued }
}

export async function handler(_request: Request, _opts: { trusted: boolean }) {
  try {
    const swept = await sweepAbandonedCheckouts()
    const drained = await drainOutbox()
    return new Response(JSON.stringify({ ok: true, ...drained, abandoned: swept }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}
