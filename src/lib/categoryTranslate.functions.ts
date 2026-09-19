import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc('is_staff_or_admin', { _user_id: context.userId })
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Forbidden')
}

/** Translate a batch of short strings in a single request (newline separated). */
async function translateChunk(texts: string[]): Promise<string[]> {
  const joined = texts.join('\n')
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx' +
    `&sl=en&tl=ar&dt=t&q=${encodeURIComponent(joined)}`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`Translation failed (${res.status})`)
  const json = (await res.json()) as any
  const out: string = Array.isArray(json?.[0])
    ? json[0].map((c: any) => (Array.isArray(c) ? c[0] : '')).join('')
    : ''
  const lines = out.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  if (lines.length === texts.length) return lines
  // Line count mismatch — fall back to one request per item.
  const single: string[] = []
  for (const t of texts) {
    try {
      const [v] = await translateChunk([t])
      single.push(v ?? t)
    } catch {
      single.push(t)
    }
  }
  return single
}

/**
 * Translates the next slice of untranslated SunSky categories into Arabic and
 * saves them. Call repeatedly until `done` is true.
 */
export const translateCategoriesBatch = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number; retranslate?: boolean } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context)

    const limit = Math.min(Math.max(data.limit ?? 300, 20), 600)

    if (data.retranslate) {
      await context.supabase.from('sunsky_categories').update({ name_ar: null }).not('name_ar', 'is', null)
    }

    let query = context.supabase
      .from('sunsky_categories')
      .select('category_id,name')
      .is('name_ar', null)
      .order('category_id')
      .limit(limit)

    const { data: rows, error } = await query
    if (error) throw new Error(error.message)

    const pending = (rows ?? []) as { category_id: number; name: string }[]

    let translated = 0
    const GROUP = 40
    for (let i = 0; i < pending.length; i += GROUP) {
      const group = pending.slice(i, i + GROUP)
      let results: string[]
      try {
        results = await translateChunk(group.map((r) => r.name))
      } catch {
        break
      }
      for (let j = 0; j < group.length; j++) {
        const value = results[j]?.trim()
        if (!value) continue
        const { error: upErr } = await context.supabase
          .from('sunsky_categories')
          .update({ name_ar: value })
          .eq('category_id', group[j].category_id)
        if (!upErr) translated++
      }
    }

    const { count: remaining } = await context.supabase
      .from('sunsky_categories')
      .select('category_id', { count: 'exact', head: true })
      .is('name_ar', null)

    const { count: total } = await context.supabase
      .from('sunsky_categories')
      .select('category_id', { count: 'exact', head: true })

    const done = (remaining ?? 0) === 0 || translated === 0
    if (done) {
      // Rebuild the Arabic full paths once every name is in place.
      await context.supabase.rpc('sunsky_rebuild_category_paths_ar')
    }

    return {
      translated,
      remaining: remaining ?? 0,
      total: total ?? 0,
      done,
    }
  })
