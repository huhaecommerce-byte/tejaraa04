// Server-only: builds and queues the product alert digest emails.
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { drainOutbox } from './process-email-outbox.server'
import { corsHeaders } from './_shared/runtime.server'
import type { DigestCategory, DigestProduct } from '@/lib/email-templates/product-digest'

const SITE_ROOT = 'https://tejaraa.com'
const RECIPIENT_CAP = 2000
const RIYADH_OFFSET_HOURS = 3

export interface AlertSettings {
  enabled: boolean
  frequency: 'off' | 'daily' | 'weekly'
  send_hour: number
  day_of_week: number
  window_days: number
  max_products: number
  last_run_at: string | null
}

const DEFAULTS: AlertSettings = {
  enabled: false,
  frequency: 'weekly',
  send_hour: 9,
  day_of_week: 0,
  window_days: 7,
  max_products: 6,
  last_run_at: null,
}

export async function loadSettings(): Promise<AlertSettings> {
  const { data } = await supabaseAdmin
    .from('product_alert_settings')
    .select('*')
    .eq('id', true)
    .maybeSingle()
  return { ...DEFAULTS, ...((data as any) ?? {}) }
}

function riyadhNow(now = new Date()) {
  return new Date(now.getTime() + RIYADH_OFFSET_HOURS * 3600_000)
}

/** Stable key so a period is never sent twice. */
export function periodKey(frequency: string, now = new Date()) {
  const r = riyadhNow(now)
  const y = r.getUTCFullYear()
  const m = String(r.getUTCMonth() + 1).padStart(2, '0')
  const d = String(r.getUTCDate()).padStart(2, '0')
  if (frequency === 'daily') return `daily:${y}-${m}-${d}`
  // ISO-ish week bucket for weekly runs
  const start = Date.UTC(y, 0, 1)
  const week = Math.floor((Date.UTC(y, r.getUTCMonth(), r.getUTCDate()) - start) / 604800000)
  return `weekly:${y}-W${String(week).padStart(2, '0')}`
}

export function isDueNow(settings: AlertSettings, now = new Date()) {
  if (!settings.enabled || settings.frequency === 'off') return false
  const r = riyadhNow(now)
  if (r.getUTCHours() !== settings.send_hour) return false
  if (settings.frequency === 'weekly' && r.getUTCDay() !== settings.day_of_week) return false
  return true
}

function money(value: unknown) {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n) || n <= 0) return null
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function productUrl(row: any) {
  return row?.slug ? `${SITE_ROOT}/product/${row.slug}` : `${SITE_ROOT}/dropshipping/catalog`
}

function categoryUrl(name: string) {
  return `${SITE_ROOT}/dropshipping/catalog?category=${encodeURIComponent(name)}`
}

function toDigestProduct(row: any, metric?: string | null): DigestProduct {
  return {
    id: row.id,
    name: row.name,
    image: Array.isArray(row.images) && row.images.length ? row.images[0] : null,
    price: money(row.price_sar),
    priceUsd: money(row.price_usd),
    currency: 'SAR',
    category: row.top_category || row.sub_category || null,
    url: productUrl(row),
    metric: metric ?? null,
  }
}

export interface DigestPayload {
  periodLabel: string
  windowLabel: string
  newCount: number
  totalCatalog: number
  categoryCount: number
  lowestPrice: string | null
  newProducts: DigestProduct[]
  categories: DigestCategory[]
  subCategories: DigestCategory[]
  topSellers: DigestProduct[]
  trending: DigestProduct[]
  catalogUrl: string
}

function windowWording(days: number) {
  if (days <= 1) return 'in the last 24 hours'
  if (days === 7) return 'in the last 7 days'
  if (days === 30) return 'in the last 30 days'
  return `in the last ${days} days`
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export async function buildDigest(settings: AlertSettings): Promise<DigestPayload> {
  const days = Math.max(1, Math.round(settings.window_days || 1))
  const sinceDate = new Date(Date.now() - days * 86400_000)
  const since = sinceDate.toISOString()
  const periodLabel = windowWording(days)
  const windowLabel = `${formatDate(sinceDate)} – ${formatDate(new Date())}`
  const limit = Math.max(1, Math.min(settings.max_products || 6, 12))

  const { data: statsRaw, error: statsError } = await supabaseAdmin.rpc(
    'product_digest_stats' as any,
    { _since: since, _limit: limit }
  )
  if (statsError) {
    throw new Error(
      statsError.code === '57014'
        ? 'The catalog is large and the digest data took too long to gather. Try a shorter activity window.'
        : `Could not gather digest data: ${statsError.message}`
    )
  }
  const stats: any = statsRaw ?? {}


  const categories: DigestCategory[] = ((stats.top_categories as any[]) ?? [])
    .filter((c) => c?.name)
    .map((c) => ({ name: c.name, count: Number(c.count) || 0, url: categoryUrl(c.name) }))
  const subCategories: DigestCategory[] = ((stats.sub_categories as any[]) ?? [])
    .filter((c) => c?.name)
    .map((c) => ({ name: c.name, count: Number(c.count) || 0, url: categoryUrl(c.name) }))

  const newProducts = ((stats.fresh as any[]) ?? []).map((row) =>
    toDigestProduct(row, row.top_category || null)
  )
  const topSellers = ((stats.top_sellers as any[]) ?? []).map((row) =>
    toDigestProduct(row, `${Number(row.units || 0).toLocaleString('en-US')} units ordered`)
  )
  const trendingIds = new Set(topSellers.map((p) => p.id))
  const trending = ((stats.trending as any[]) ?? [])
    .filter((row) => !trendingIds.has(row.id))
    .slice(0, limit)
    .map((row) =>
      toDigestProduct(row, `${Number(row.views || 0).toLocaleString('en-US')} views`)
    )

  return {
    periodLabel,
    windowLabel,
    newCount: Number(stats.new_count ?? 0),
    totalCatalog: Number(stats.total_catalog ?? 0),
    categoryCount: categories.length,
    lowestPrice: money(stats.min_price),
    newProducts,
    categories,
    subCategories,
    topSellers,
    trending,
    catalogUrl: `${SITE_ROOT}/dropshipping/catalog`,
  }
}

async function loadRecipients() {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('user_id, email, display_name')
    .not('email', 'is', null)
    .limit(RECIPIENT_CAP)
  const seen = new Set<string>()
  const out: { user_id: string; email: string; name: string | null }[] = []
  for (const row of (data as any[]) ?? []) {
    const email = String(row.email || '').trim().toLowerCase()
    if (!email || seen.has(email)) continue
    seen.add(email)
    out.push({ user_id: row.user_id, email, name: row.display_name ?? null })
  }
  return out
}

export interface RunResult {
  ran: boolean
  reason?: string
  periodKey?: string
  recipients?: number
  queued?: number
  newCount?: number
}

/** Queues one digest per recipient. Idempotent per period via product_alert_runs.period_key. */
export async function runDigest(opts: {
  force?: boolean
  triggeredBy?: string
} = {}): Promise<RunResult> {
  const settings = await loadSettings()
  if (!opts.force && !isDueNow(settings)) return { ran: false, reason: 'not_due' }
  if (opts.force && settings.frequency === 'off') {
    settings.frequency = 'weekly'
  }

  const key = opts.force
    ? `manual:${new Date().toISOString()}`
    : periodKey(settings.frequency)

  // Single-flight + idempotency: unique period_key insert wins the run.
  const { data: runRow, error: claimError } = await supabaseAdmin
    .from('product_alert_runs')
    .insert({
      period_key: key,
      frequency: settings.frequency,
      triggered_by: opts.triggeredBy ?? 'cron',
    })
    .select('id')
    .maybeSingle()

  if (claimError || !runRow) return { ran: false, reason: 'already_ran', periodKey: key }

  const payload = await buildDigest(settings)
  if (payload.newCount === 0 && payload.topSellers.length === 0 && payload.trending.length === 0) {
    await supabaseAdmin
      .from('product_alert_runs')
      .update({ summary: { skipped: 'no_activity' } })
      .eq('id', (runRow as any).id)
    return { ran: false, reason: 'no_activity', periodKey: key }
  }

  const recipients = await loadRecipients()
  const rows = recipients.map((r) => ({
    dedupe_key: `${key}:${r.email}`,
    template_name: 'product-digest',
    recipient_email: r.email,
    recipient_user_id: r.user_id,
    payload: { ...payload, customerName: r.name } as any,
    status: 'pending',
  }))

  let queued = 0
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200)
    const { error } = await supabaseAdmin.from('email_outbox').insert(chunk)
    if (!error) queued += chunk.length
  }

  await supabaseAdmin
    .from('product_alert_runs')
    .update({
      recipients: recipients.length,
      queued,
      new_products: payload.newCount,
      summary: {
        categories: payload.categories,
        topSellers: payload.topSellers.length,
        trending: payload.trending.length,
      } as any,
    })
    .eq('id', (runRow as any).id)

  await supabaseAdmin
    .from('product_alert_settings')
    .update({ last_run_at: new Date().toISOString() })
    .eq('id', true)

  // Drain a bounded batch now; the outbox processor handles the rest.
  await drainOutbox(50)

  return { ran: true, periodKey: key, recipients: recipients.length, queued, newCount: payload.newCount }
}

export async function handler(request: Request, opts: { trusted: boolean }) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  let force = false
  try {
    const body = (await request.json()) as any
    // "force" bypasses the schedule check, so only trusted (cron-authenticated
    // or admin) callers may set it. Untrusted pings can still run the normal
    // due-now path, which is idempotent per period key.
    force = opts.trusted && Boolean(body?.force)
  } catch {
    /* no body */
  }
  const result = await runDigest({ force, triggeredBy: force ? 'manual' : 'cron' })
  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
