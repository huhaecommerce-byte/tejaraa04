import { FormEvent, useEffect, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { AlertCircle, ArrowRight, BarChart3, PackageSearch, Search, Sparkles, Store, TrendingUp, X } from 'lucide-react'
import { ProductCard, type ProductData } from '@/components/storefront/ProductCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/customer/aux/PageHeader'
import { huntProducts, type HuntFilters, type HuntProduct } from '@/lib/aiSearch.functions'

type HuntState = {
  prompt: string
  filters: HuntFilters
  products: HuntProduct[]
  total: number
  page: number
  relaxed: boolean
} | null

let huntingCache: HuntState = null
const examples: { label: string; description: string; query: string }[] = [
  {
    label: 'Brand + budget',
    description: 'Find a specific brand within your target price.',
    query: 'Huawei mobile case under 20 SAR',
  },
  {
    label: 'Price range',
    description: 'Set a minimum and maximum price to narrow results.',
    query: 'Wireless earbuds between 40 and 100 SAR',
  },
  {
    label: 'Arabic search',
    description: 'You can type in Arabic and we will match your request.',
    query: 'أريد شاحن آيفون بسعر أقل من 50 ريال',
  },
]

export default function ProductHunting() {
  const runHunt = useServerFn(huntProducts)
  const [prompt, setPrompt] = useState(huntingCache?.prompt ?? '')
  const [result, setResult] = useState(huntingCache)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { huntingCache = result }, [result])

  const search = async (nextPrompt: string, filters?: HuntFilters, page = 0) => {
    if (nextPrompt.trim().length < 2) return
    page === 0 ? setLoading(true) : setLoadingMore(true)
    setError(null)
    try {
      const response = await runHunt({ data: { prompt: nextPrompt.trim(), filters, page } })
      setResult((current) => ({
        prompt: nextPrompt.trim(),
        filters: response.filters,
        products: page === 0 ? response.products : [...(current?.products ?? []), ...response.products],
        total: response.total,
        page: response.page,
        relaxed: response.relaxed,
      }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not hunt products. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void search(prompt)
  }

  const removeTerm = (term: string) => {
    if (!result) return
    const filters = { ...result.filters, terms: result.filters.terms.filter((item) => item !== term) }
    void search(result.prompt, filters)
  }

  const clearField = (field: 'category' | 'source' | 'minPrice' | 'maxPrice') => {
    if (!result) return
    void search(result.prompt, { ...result.filters, [field]: null })
  }

  return (
    <div className="space-y-7 pb-10">
      <PageHeader
        title="Product Hunting"
        subtitle="Describe what you need in English or Arabic and discover the closest matches in our catalog."
      />

      <section className="border-y border-border bg-card/40 py-7 sm:py-10">
        <div className="mx-auto max-w-4xl px-1 sm:px-4">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PackageSearch className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">What product are you looking for?</h2>
              <p className="text-sm text-muted-foreground">Include the brand, product type, and your price range.</p>
            </div>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                maxLength={500}
                placeholder="e.g. Huawei mobile case under 20 SAR"
                className="h-14 pl-12 pr-10 text-base"
                aria-label="Describe the product you need"
              />
              {prompt && (
                <Button type="button" variant="ghost" size="icon" onClick={() => setPrompt('')} className="absolute right-2 top-1/2 -translate-y-1/2" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button type="submit" size="lg" disabled={loading || prompt.trim().length < 2} className="h-14 gap-2 px-7">
              <Sparkles className="h-4 w-4" />
              {loading ? 'Hunting…' : 'Hunt Products'}
            </Button>
          </form>

          <div className="mt-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Try an example</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {examples.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => { setPrompt(example.query); void search(example.query) }}
                  className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="block text-sm font-semibold text-foreground">{example.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{example.description}</span>
                  <span className="mt-3 block truncate rounded-md bg-muted px-2 py-1 text-xs font-medium text-primary">“{example.query}”</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/70 to-background p-6 text-center sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        </div>
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm">
            <TrendingUp className="h-7 w-7" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h3 className="text-lg font-bold sm:text-xl">Platform comparison & profit analytics</h3>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              Coming soon
            </span>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Soon you’ll be able to compare Tejaraa prices with Amazon, Noon and other major marketplaces, see estimated profit margins, and make smarter sourcing decisions.
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-medium ring-1 ring-border">
              <Store className="h-4 w-4 text-muted-foreground" /> Amazon
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-medium ring-1 ring-border">
              <Store className="h-4 w-4 text-muted-foreground" /> Noon
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-medium ring-1 ring-border">
              <BarChart3 className="h-4 w-4 text-muted-foreground" /> Profit margin
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-medium ring-1 ring-border">
              <Sparkles className="h-4 w-4 text-muted-foreground" /> AI insights
            </span>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex flex-col items-start justify-between gap-3 border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center">
          <span className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{error}</span>
          <Button variant="outline" size="sm" onClick={() => void search(result?.prompt ?? prompt, result?.filters)}>Retry</Button>
        </div>
      )}

      {loading ? <HuntLoading /> : result && (
        <section className="space-y-5">
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Understood criteria</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.filters.terms.map((term) => <FilterChip key={term} label={term} onRemove={() => removeTerm(term)} />)}
                {result.filters.category && <FilterChip label={result.filters.category} onRemove={() => clearField('category')} />}
                {result.filters.minPrice !== null && <FilterChip label={`From ${result.filters.minPrice} SAR`} onRemove={() => clearField('minPrice')} />}
                {result.filters.maxPrice !== null && <FilterChip label={`Up to ${result.filters.maxPrice} SAR`} onRemove={() => clearField('maxPrice')} />}
                {result.filters.source && <FilterChip label={`${result.filters.source} source`} onRemove={() => clearField('source')} />}
                {result.filters.inStock && <Badge variant="secondary">In stock</Badge>}
              </div>
            </div>
            <p className="shrink-0 text-sm text-muted-foreground"><strong className="text-foreground">{result.total.toLocaleString()}</strong> matches</p>
          </div>

          {result.relaxed && result.products.length > 0 && (
            <div className="border-l-4 border-primary bg-primary/5 px-4 py-3 text-sm">
              No exact price match was found. These are the closest relevant alternatives outside your requested range.
            </div>
          )}

          {result.products.length > 0 ? (
            <>
              <div className="product-grid gap-3 sm:gap-5">
                {result.products.map((product, index) => <ProductCard key={product.id} product={product as ProductData} priority={index < 4} />)}
              </div>
              {result.products.length < result.total && (
                <div className="flex justify-center pt-3">
                  <Button variant="outline" disabled={loadingMore} onClick={() => void search(result.prompt, result.filters, result.page + 1)} className="gap-2">
                    {loadingMore ? 'Loading…' : 'Load more'} {!loadingMore && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="border border-dashed border-border py-16 text-center">
              <PackageSearch className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h2 className="font-semibold">No matching products found</h2>
              <p className="mt-1 text-sm text-muted-foreground">Try fewer keywords or a wider price range.</p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return <Badge variant="outline" className="gap-1.5 py-1.5 pl-3 pr-1 text-xs">{label}<Button type="button" variant="ghost" size="icon" onClick={onRemove} className="h-6 w-6" aria-label={`Remove ${label}`}><X className="h-3 w-3" /></Button></Badge>
}

const huntStages = [
  'Understanding your request…',
  'Searching the full catalog…',
  'Matching brands & categories…',
  'Applying your price range…',
  'Ranking the best matches…',
]
const catalogEstimate = 1_500_000

function HuntLoading() {
  const [stage, setStage] = useState(0)
  const [scanned, setScanned] = useState(0)

  useEffect(() => {
    const stageTimer = window.setInterval(() => setStage((current) => (current + 1) % huntStages.length), 1600)
    const scanTimer = window.setInterval(() => {
      setScanned((current) => {
        const remaining = catalogEstimate - current
        if (remaining <= 0) return current
        return current + Math.max(1, Math.floor(remaining * 0.11))
      })
    }, 120)
    return () => {
      window.clearInterval(stageTimer)
      window.clearInterval(scanTimer)
    }
  }, [])

  const progress = Math.min(96, Math.round((scanned / catalogEstimate) * 100))

  return (
    <section className="space-y-6">
      <div className="border border-border bg-card/60 p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/20" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <PackageSearch className="h-6 w-6 animate-pulse" />
            </div>
          </div>
          <div>
            <p className="font-semibold">{huntStages[stage]}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Scanned <strong className="tabular-nums text-foreground">{scanned.toLocaleString()}</strong> products
            </p>
          </div>
          <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {huntStages.map((label, index) => (
              <span key={label} className={`h-1.5 w-8 rounded-full transition-colors ${index <= stage ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="product-grid gap-3 sm:gap-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden border border-border/40 bg-card">
            <div className="aspect-square animate-pulse bg-muted" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-4/5 animate-pulse bg-muted" />
              <div className="h-3 w-2/5 animate-pulse bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}