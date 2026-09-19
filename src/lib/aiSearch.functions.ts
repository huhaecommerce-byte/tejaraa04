import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import type { ProductData } from '@/components/storefront/ProductCard'

const inputSchema = z.object({
  prompt: z.string().trim().min(2).max(500),
  filters: z.object({
    terms: z.array(z.string().trim().min(1).max(60)).max(8),
    category: z.string().trim().max(100).nullable(),
    minPrice: z.number().min(0).max(1_000_000).nullable(),
    maxPrice: z.number().min(0).max(1_000_000).nullable(),
    source: z.enum(['local', 'global']).nullable(),
    inStock: z.boolean(),
  }).optional(),
  page: z.number().int().min(0).max(2000).default(0),
})

const intentSchema = z.object({
  terms: z.array(z.string()).max(8).default([]),
  category: z.string().nullable().default(null),
  minPrice: z.number().nullable().default(null),
  maxPrice: z.number().nullable().default(null),
  source: z.enum(['local', 'global']).nullable().default(null),
  inStock: z.boolean().default(true),
})

export type HuntFilters = z.infer<typeof intentSchema>
export type HuntProduct = ProductData & { match_score?: number }

const STOP_WORDS = new Set([
  'i', 'me', 'my', 'need', 'want', 'looking', 'for', 'find', 'show', 'products',
  'product', 'item', 'items', 'with', 'in', 'the', 'a', 'an', 'of', 'sar', 'riyals',
  'under', 'below', 'between', 'from', 'to', 'maximum', 'max', 'minimum', 'min',
  'riyal', 'riyals', 'sr', 'usd', 'aed', 'dirham', 'dirhams', 'dollar', 'dollars',
  'price', 'prices', 'budget', 'around', 'about', 'range', 'please', 'any', 'some',
  'and', 'or', 'is', 'are', 'that', 'this', 'less', 'than', 'more', 'over', 'up',
  'ريالات', 'سعر', 'ميزانية', 'حوالي', 'تقريبا', 'دولار', 'درهم',
  'اريد', 'أريد', 'احتاج', 'أحتاج', 'ابحث', 'عن', 'منتج', 'منتجات', 'ريال', 'بسعر',
  'اقل', 'أقل', 'من', 'بين', 'الى', 'إلى', 'اعرض', 'لي',
])

function fallbackIntent(prompt: string): HuntFilters {
  const normalized = prompt.replace(/[،,]/g, ' ').replace(/\s+/g, ' ').trim()
  const numbers = [...normalized.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]))
  const range = normalized.match(/(?:between|from|بين|من)\s*(\d+(?:\.\d+)?)\s*(?:and|to|-|و|إلى|الى)\s*(\d+(?:\.\d+)?)/i)
  const maxMatch = normalized.match(/(?:under|below|less than|max(?:imum)?|up to|أقل من|اقل من|حتى)\s*(\d+(?:\.\d+)?)/i)
  const minMatch = normalized.match(/(?:above|over|more than|min(?:imum)?|أكثر من|اكثر من)\s*(\d+(?:\.\d+)?)/i)
  const words = normalized
    .toLocaleLowerCase()
    .split(/[^\p{L}\p{N}-]+/u)
    .filter((word) => word.length > 1 && !/^\d/.test(word) && !STOP_WORDS.has(word))
  return {
    terms: [...new Set(words)].slice(0, 8),
    category: null,
    minPrice: range ? Number(range[1]) : minMatch ? Number(minMatch[1]) : null,
    maxPrice: range ? Number(range[2]) : maxMatch ? Number(maxMatch[1]) : numbers.length === 1 ? numbers[0] : null,
    source: /\b(local|ksa|saudi)\b|محلي/i.test(normalized) ? 'local' : /\b(global|international)\b|عالمي/i.test(normalized) ? 'global' : null,
    inStock: !/out of stock|نفد|غير متوفر/i.test(normalized),
  }
}

function cleanIntent(value: unknown, prompt: string): HuntFilters {
  const fallback = fallbackIntent(prompt)
  const parsed = intentSchema.safeParse(value)
  if (!parsed.success) return fallback
  const result = parsed.data
  const terms = [...new Set(result.terms.map((term) => term.trim().toLocaleLowerCase()).filter((term) => term.length > 1))].slice(0, 8)
  const minPrice = result.minPrice === null ? null : Math.max(0, Math.min(result.minPrice, 1_000_000))
  const maxPrice = result.maxPrice === null ? null : Math.max(0, Math.min(result.maxPrice, 1_000_000))
  return {
    ...result,
    terms: terms.length ? terms : fallback.terms,
    minPrice: minPrice !== null && maxPrice !== null ? Math.min(minPrice, maxPrice) : minPrice,
    maxPrice: minPrice !== null && maxPrice !== null ? Math.max(minPrice, maxPrice) : maxPrice,
  }
}

function extractIntent(prompt: string): { filters: HuntFilters; usedAi: boolean } {
  return { filters: fallbackIntent(prompt), usedAi: false }
}

const PAGE_SIZE = 24

export const huntProducts = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const interpreted = data.filters
      ? { filters: cleanIntent(data.filters, data.prompt), usedAi: false }
      : extractIntent(data.prompt)

    const search = async (relaxed: boolean) => context.supabase.rpc('hunt_catalog_products', {
      _terms: interpreted.filters.terms,
      _category: interpreted.filters.category,
      _min_price: interpreted.filters.minPrice,
      _max_price: interpreted.filters.maxPrice,
      _source: interpreted.filters.source,
      _in_stock: interpreted.filters.inStock,
      _limit: PAGE_SIZE,
      _offset: data.page * PAGE_SIZE,
      _relaxed: relaxed,
    } as never)

    let result = await search(false)
    if (result.error) throw new Error(result.error.message)
    let relaxed = false
    if (!result.data?.length && interpreted.filters.terms.length > 0) {
      result = await search(true)
      if (result.error) throw new Error(result.error.message)
      relaxed = true
    }
    const rows = (result.data ?? []) as Array<Record<string, unknown>>
    return {
      filters: interpreted.filters,
      products: rows.map(({ total_count: _totalCount, match_score, ...product }) => ({ ...product, match_score })) as HuntProduct[],
      total: Number(rows[0]?.total_count ?? 0),
      page: data.page,
      pageSize: PAGE_SIZE,
      relaxed,
      usedAi: interpreted.usedAi,
    }
  })