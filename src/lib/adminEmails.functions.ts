import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc('has_role', {
    _user_id: context.userId,
    _role: 'admin',
  })
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Forbidden')
}

export const listEmailTemplates = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { TEMPLATES } = await import('@/lib/email-templates/registry')
    const { data } = await context.supabase.from('email_template_settings').select('*')
    const settings = new Map<string, any>((data ?? []).map((r: any) => [r.template_name, r]))

    return Object.keys(TEMPLATES).map((name) => ({
      name,
      displayName: TEMPLATES[name]?.displayName ?? name,
      enabled: settings.get(name)?.enabled ?? true,
      label: settings.get(name)?.label ?? '',
    }))
  })

export const setEmailTemplateEnabled = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; enabled: boolean }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { error } = await context.supabase.from('email_template_settings').upsert(
      {
        template_name: data.name,
        enabled: data.enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'template_name' }
    )
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const previewEmailTemplate = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; data?: Record<string, any> }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const React = await import('react')
    const { render } = await import('@react-email/render')
    const { TEMPLATES } = await import('@/lib/email-templates/registry')

    const entry = TEMPLATES[data.name]
    if (!entry) throw new Error(`Unknown template: ${data.name}`)

    const templateData = { ...(entry.previewData ?? {}), ...(data.data ?? {}) }
    const html = await render(React.createElement(entry.component, templateData))
    const subject =
      typeof entry.subject === 'function' ? entry.subject(templateData) : entry.subject
    return { html, subject }
  })

export const sendTestEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; to: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { TEMPLATES } = await import('@/lib/email-templates/registry')
    const entry = TEMPLATES[data.name]
    if (!entry) throw new Error(`Unknown template: ${data.name}`)
    const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')
    await sendTemplateEmail(data.name, data.to, { templateData: entry.previewData ?? {} })
    return { ok: true }
  })

export const listEmailOutbox = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data, error } = await context.supabase
      .from('email_outbox')
      .select('id, template_name, recipient_email, status, error, attempts, created_at, sent_at')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw new Error(error.message)
    return data ?? []
  })

export const listEmailSendLog = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input?: { page?: number; pageSize?: number }) => input ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const pageSize = Math.min(Math.max(data?.pageSize ?? 50, 1), 200)
    const page = Math.max(data?.page ?? 1, 1)
    const from = (page - 1) * pageSize
    const { data: rows, error, count } = await context.supabase
      .from('email_send_log')
      .select('id, template_name, recipient_email, status, error_message, created_at', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1)
    if (error) throw new Error(error.message)
    return { rows: rows ?? [], total: count ?? 0, page, pageSize }
  })

export const runEmailQueue = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { drainOutbox, sweepAbandonedCheckouts } = await import(
      '@/lib/edge/process-email-outbox.server'
    )
    const abandoned = await sweepAbandonedCheckouts()
    const result = await drainOutbox(50)
    return { ...result, abandoned }
  })

export const queueCustomEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      audience: 'all' | 'selected'
      emails?: string[]
      subject: string
      heading: string
      body: string
      ctaLabel?: string
      ctaUrl?: string
    }) => input
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    if (!data.subject?.trim() || !data.body?.trim()) {
      throw new Error('Subject and body are required')
    }

    let recipients: { email: string; name?: string | null; user_id?: string | null }[] = []

    if (data.audience === 'all') {
      const { data: rows, error } = await context.supabase
        .from('profiles')
        .select('user_id, email, display_name')
        .not('email', 'is', null)
      if (error) throw new Error(error.message)
      recipients = (rows ?? []).map((r: any) => ({
        email: r.email,
        name: r.display_name,
        user_id: r.user_id,
      }))
    } else {
      recipients = (data.emails ?? [])
        .map((e) => e.trim())
        .filter(Boolean)
        .map((email) => ({ email }))
    }

    if (!recipients.length) throw new Error('No recipients')

    const stamp = Date.now()
    const rows = recipients.map((r) => ({
      dedupe_key: `custom:${stamp}:${r.email}`,
      template_name: 'custom-message',
      recipient_email: r.email,
      recipient_user_id: r.user_id ?? null,
      payload: {
        subject: data.subject,
        heading: data.heading || data.subject,
        body: data.body,
        customerName: r.name ?? null,
        ctaLabel: data.ctaLabel || undefined,
        ctaUrl: data.ctaUrl || undefined,
      },
    }))

    const { error } = await context.supabase.from('email_outbox').insert(rows)
    if (error) throw new Error(error.message)

    // Deliver right away instead of waiting for the next queue run.
    let delivery: { sent: number; failed: number; skipped: number } | null = null
    try {
      const { drainOutbox } = await import('@/lib/edge/process-email-outbox.server')
      delivery = await drainOutbox(Math.min(rows.length, 50))
    } catch (e) {
      console.error('[queueCustomEmail] immediate drain failed', e)
    }

    return { queued: rows.length, delivery }
  })


export const sendOutboxEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { sendOutboxRow } = await import('@/lib/edge/process-email-outbox.server')
    return await sendOutboxRow(data.id)
  })

export const getProductAlertSettings = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { loadSettings } = await import('@/lib/edge/product-digest.server')
    const settings = await loadSettings()
    const { data: runs } = await context.supabase
      .from('product_alert_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    return { settings, runs: runs ?? [] }
  })

export const updateProductAlertSettings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      enabled: boolean
      frequency: 'off' | 'daily' | 'weekly'
      send_hour: number
      day_of_week: number
      window_days: number
      max_products: number
    }) => input
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { error } = await context.supabase
      .from('product_alert_settings')
      .update({
        enabled: data.enabled,
        frequency: data.frequency,
        send_hour: Math.max(0, Math.min(23, Math.round(data.send_hour))),
        day_of_week: Math.max(0, Math.min(6, Math.round(data.day_of_week))),
        window_days: Math.max(1, Math.min(90, Math.round(data.window_days))),
        max_products: Math.max(1, Math.min(24, Math.round(data.max_products))),
      })
      .eq('id', true)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const previewProductDigest = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const React = await import('react')
    const { render } = await import('@react-email/render')
    const { TEMPLATES } = await import('@/lib/email-templates/registry')
    const { loadSettings, buildDigest } = await import('@/lib/edge/product-digest.server')

    const settings = await loadSettings()
    const payload = await buildDigest(settings)
    const entry = TEMPLATES['product-digest']!
    const html = await render(React.createElement(entry.component, payload as any))
    const subject =
      typeof entry.subject === 'function' ? entry.subject(payload as any) : entry.subject
    return { html, subject, stats: { newCount: payload.newCount, categories: payload.categories.length, topSellers: payload.topSellers.length, trending: payload.trending.length } }
  })

export const sendTestProductDigest = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { to: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { loadSettings, buildDigest } = await import('@/lib/edge/product-digest.server')
    const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')
    const payload = await buildDigest(await loadSettings())
    const result = await sendTemplateEmail('product-digest', data.to, {
      templateData: { ...payload, customerName: 'there' },
      idempotencyKey: `product-digest-test-${Date.now()}`,
    })
    return result
  })

export const runProductDigestNow = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { runDigest } = await import('@/lib/edge/product-digest.server')
    return runDigest({ force: true, triggeredBy: `admin:${context.userId}` })
  })
