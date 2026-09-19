import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ProductCard, type ProductData } from '@/components/storefront/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Search, ShoppingBag, SlidersHorizontal, ChevronRight, Layers, X, AlertCircle, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';

import { PlanFeatureChip } from '@/components/customer/PlanFeatureChip';
import { CatalogExportDialog } from '@/components/customer/CatalogExportDialog';
import {
  CategorySidebar,
  emptySelection,
  describeSelection,
  type CategorySelection,
  type AggregatedCount,
} from '@/components/customer/CategorySidebar';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/customer/aux/PageHeader';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc';

const PAGE_SIZE = 48;
const CATEGORY_CACHE_TTL_MS = 60 * 1000;

// Module-scope cache for the category aggregate (survives route changes)
let categoryCache: { data: AggregatedCount[]; ts: number } | null = null;

// Module-scope cache for catalog state (survives route changes within a session)
interface CatalogStateCache {
  search: string;
  debouncedSearch: string;
  source: 'all' | 'local' | 'global';
  sort: SortOption;
  selectionKeys: string[];
  page: number;
  products: ProductData[];
  totalCount: number | null;
  scrollY: number;
}
let catalogStateCache: CatalogStateCache | null = null;

// Only the columns the product grid renders — keeps payloads small at catalog scale.
const LIST_COLUMNS =
  'id,sku,name,name_ar,slug,top_category,sub_category,detailed_category,source,images,price_sar,price_usd,cost_usd,bulk_price,bulk_price_usd,dropship_price,dropship_price_usd,moq,weight_kg,estimated_delivery,labelling_available,platforms,stock_qty,track_inventory,is_featured,created_at';

// Escape PostgREST or() values: backslash, comma, parens, dot
const esc = (v: string) => v.replace(/([\\,().])/g, '\\$1');

function buildCategoryOr(selection: CategorySelection): string | null {
  if (selection.keys.size === 0) return null;
  const groups: string[] = [];
  for (const k of selection.keys) {
    const parts = k.split('::');
    if (parts.length === 1) {
      groups.push(`and(top_category.eq.${esc(parts[0])})`);
    } else if (parts.length === 2) {
      groups.push(`and(top_category.eq.${esc(parts[0])},sub_category.eq.${esc(parts[1])})`);
    } else if (parts.length === 3) {
      groups.push(
        `and(top_category.eq.${esc(parts[0])},sub_category.eq.${esc(parts[1])},detailed_category.eq.${esc(parts[2])})`
      );
    }
  }
  return groups.join(',');
}

const CustomerCatalog = () => {
  const cached = catalogStateCache;
  const [search, setSearch] = useState(cached?.search ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(cached?.debouncedSearch ?? '');
  const [source, setSource] = useState<'all' | 'local' | 'global'>(cached?.source ?? 'all');
  const [sort, setSort] = useState<SortOption>(cached?.sort ?? 'newest');
  const [products, setProducts] = useState<ProductData[]>(cached?.products ?? []);
  const [aggregatedCounts, setAggregatedCounts] = useState<AggregatedCount[]>(
    () => categoryCache?.data ?? []
  );
  const [categoryLoading, setCategoryLoading] = useState(() => !categoryCache?.data);
  const [loading, setLoading] = useState(!cached || cached.products.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(cached?.page ?? 0);
  const [totalCount, setTotalCount] = useState<number | null>(cached?.totalCount ?? null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selection, setSelection] = useState<CategorySelection>(() =>
    cached ? { keys: new Set(cached.selectionKeys) } : emptySelection()
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const hydratedFromCacheRef = useRef(!!cached && cached.products.length > 0);

  const { hasFeature, numericLimit } = useCurrentPlan();
  const canExport = hasFeature('catalog_export');
  const [exportOpen, setExportOpen] = useState(false);
  

  const fetchTokenRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  // Debounce search input → 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Persist state to module-scope cache on every relevant change
  useEffect(() => {
    catalogStateCache = {
      search,
      debouncedSearch,
      source,
      sort,
      selectionKeys: Array.from(selection.keys),
      page,
      products,
      totalCount,
      scrollY: catalogStateCache?.scrollY ?? 0,
    };
  }, [search, debouncedSearch, source, sort, selection, page, products, totalCount]);

  // Capture scroll position on unmount so Back-navigation can restore it
  useEffect(() => {
    return () => {
      if (catalogStateCache) {
        catalogStateCache.scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
      }
    };
  }, []);

  // Restore scroll on mount when hydrating from cache
  useEffect(() => {
    if (!hydratedFromCacheRef.current) return;
    const y = catalogStateCache?.scrollY ?? 0;
    if (y <= 0) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, left: 0, behavior: 'auto' });
      });
    });
  }, []);

  const loadCategoryAggregate = useCallback(async (attempt = 0) => {
    const fresh = categoryCache && Date.now() - categoryCache.ts < CATEGORY_CACHE_TTL_MS;
    if (fresh) {
      setAggregatedCounts(categoryCache!.data);
      setCategoryLoading(false);
      return;
    }

    setCategoryLoading(true);
    setCategoryError(null);

    // Page through results — PostgREST caps each response at 1000 rows by default,
    // and the cache table has more rows than that, which previously truncated the total.
    const fetchCounts = async (sourceName: 'product_category_counts_cache' | 'product_category_counts') => {
      const PAGE = 1000;
      const all: any[] = [];
      let pageIdx = 0;
      // Hard safety cap to avoid runaway loops
      while (pageIdx < 50) {
        const from = pageIdx * PAGE;
        const to = from + PAGE - 1;
        const res = await supabase
          .from(sourceName as any)
          .select('top_category, sub_category, detailed_category, cnt')
          .range(from, to);
        if (res.error) return { data: all.length ? all : null, error: res.error } as any;
        const batch = (res.data ?? []) as any[];
        all.push(...batch);
        if (batch.length < PAGE) break;
        pageIdx++;
      }
      return { data: all, error: null } as any;
    };

    let { data, error } = await fetchCounts('product_category_counts_cache');

    if (error && (error as any).code === '42P01') {
      ({ data, error } = await fetchCounts('product_category_counts'));
    }

    if (error && (error as any).code === '57014' && attempt < 1) {
      await new Promise(r => setTimeout(r, 700));
      return loadCategoryAggregate(attempt + 1);
    }

    if (error) {
      console.error('[Catalog] categories fetch error', error);
      setCategoryError(error.message || 'Failed to load categories');
      setCategoryLoading(false);
      return;
    }

    const rows = (data ?? []) as unknown as AggregatedCount[];
    categoryCache = { data: rows, ts: Date.now() };
    setAggregatedCounts(rows);
    setCategoryLoading(false);
  }, []);

  // Load category aggregate (cached at module scope, 5min TTL)
  useEffect(() => {
    void loadCategoryAggregate();
  }, [loadCategoryAggregate]);

  // Reset to page 0 whenever filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, source, sort, selection]);

  // Build a paginated, filtered, sorted query
  // Use 'exact' for narrow level-3 selections (accurate count, small result set)
  // Use 'planned' for broad/no selections (fast, avoids planner clamp on huge tables)
  // When text search is active we need query-based count (exact).
  // Otherwise we derive totalCount from the category cache — no count needed from query.
  const useQueryCount = debouncedSearch.length > 0;

  const buildQuery = useCallback((countMode: boolean, signal?: AbortSignal) => {
    let q = supabase
      .from('products')
      // Only grid columns — `*` drags full descriptions across the wire.
      // `estimated` keeps counting cheap on multi-million-row catalogs.
      .select(LIST_COLUMNS, countMode && useQueryCount ? { count: 'estimated' } : undefined);

    if (debouncedSearch) q = q.ilike('name', `%${debouncedSearch}%`);
    if (source !== 'all') q = q.eq('source', source);

    const orFilter = buildCategoryOr(selection);
    if (orFilter) {
      if (import.meta.env.DEV) console.debug('[Catalog] .or() →', orFilter);
      q = q.or(orFilter);
    }

    switch (sort) {
      case 'price-asc':
        q = q.order('price_sar', { ascending: true, nullsFirst: false });
        break;
      case 'price-desc':
        q = q.order('price_sar', { ascending: false, nullsFirst: false });
        break;
      case 'name-asc':
        q = q.order('name', { ascending: true });
        break;
      case 'newest':
      default:
        q = q.order('created_at', { ascending: false });
        break;
    }
    q = q.order('id', { ascending: false });
    if (signal) q = q.abortSignal(signal);
    return q;
  }, [debouncedSearch, source, sort, selection, useQueryCount]);

  // Fetch products whenever filters or page change (with retry-on-timeout)
  const runFetch = useCallback(async (token: number, isFirstPage: boolean) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    if (isFirstPage) setLoading(true); else setLoadingMore(true);
    setFetchError(null);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const attempt = async () => {
      const q = buildQuery(isFirstPage, ctrl.signal).range(from, to);
      return await q;
    };

    let { data, count, error } = await attempt();

    // Auto-retry twice on statement timeout (57014) with backoff
    for (let i = 0; error && (error as any).code === '57014' && i < 2; i++) {
      await new Promise(r => setTimeout(r, 600 * (i + 1)));
      if (token !== fetchTokenRef.current || ctrl.signal.aborted) return;
      ({ data, count, error } = await attempt());
    }

    if (token !== fetchTokenRef.current || ctrl.signal.aborted) return;

    if (error) {
      console.error('[Catalog] fetch error', error);
      setFetchError(error.message || 'Failed to load products');
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const rows = (data ?? []) as unknown as ProductData[];
    setProducts(rows);
    if (isFirstPage && useQueryCount && typeof count === 'number') setTotalCount(count);
    setLoading(false);
    setLoadingMore(false);
  }, [buildQuery, page]);

  useEffect(() => {
    // Skip the initial fetch when we just hydrated grid+filters from cache.
    // We still let subsequent filter/page changes trigger a fresh fetch.
    if (hydratedFromCacheRef.current) {
      hydratedFromCacheRef.current = false;
      return;
    }
    const token = ++fetchTokenRef.current;
    runFetch(token, page === 0);
    return () => { abortRef.current?.abort(); };
  }, [runFetch, page]);

  // Scroll to top on page change (after pagination click) — but not on the
  // very first render when we're restoring from cache.
  const topAnchorRef = useRef<HTMLDivElement | null>(null);
  const pageScrollSkipRef = useRef(!!cached);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (pageScrollSkipRef.current) {
      pageScrollSkipRef.current = false;
      return;
    }
    // Double rAF: wait for React commit + layout, then scroll.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = topAnchorRef.current;
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' });
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    });
  }, [page]);

  const retry = () => {
    const token = ++fetchTokenRef.current;
    runFetch(token, page === 0);
    void loadCategoryAggregate();
  };

  // Browsed-product tracking moved to ProductDetail (tracks actual opens only)

  const selectedChips = useMemo(() => describeSelection(selection), [selection]);
  const isSearchActive = debouncedSearch.length > 0;

  // Derive totalCount from category cache when not doing a text search
  useEffect(() => {
    if (useQueryCount || aggregatedCounts.length === 0) return;
    if (selection.keys.size === 0) {
      // No category filter → sum all cache counts
      const total = aggregatedCounts.reduce((s, r) => s + (r.cnt ?? 0), 0);
      setTotalCount(total);
    } else {
      // Sum counts for selected categories
      let total = 0;
      for (const row of aggregatedCounts) {
        for (const key of selection.keys) {
          const parts = key.split('::');
          let match = false;
          if (parts.length === 1) match = row.top_category === parts[0];
          else if (parts.length === 2) match = row.top_category === parts[0] && row.sub_category === parts[1];
          else if (parts.length === 3) match = row.top_category === parts[0] && row.sub_category === parts[1] && row.detailed_category === parts[2];
          if (match) { total += row.cnt ?? 0; break; }
        }
      }
      setTotalCount(total);
    }
  }, [useQueryCount, aggregatedCounts, selection]);

  const removeKey = (key: string) => {
    const next = new Set(selection.keys);
    next.delete(key);
    setSelection({ keys: next });
  };

  const canLoadMore = totalCount !== null && products.length < totalCount;
  const hasAggregateCategories = aggregatedCounts.length > 0;

  const sidebar = categoryError ? (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3 sticky top-4">
      <div className="flex items-start gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="font-medium">Categories couldn't load</p>
          <p className="text-xs text-destructive/80 mt-0.5 break-words">{categoryError}</p>
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={() => void loadCategoryAggregate()} className="w-full gap-1.5">
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </Button>
    </div>
  ) : (
    <CategorySidebar
      aggregatedCounts={hasAggregateCategories ? aggregatedCounts : undefined}
      categorySource={!hasAggregateCategories && !categoryLoading ? products : undefined}
      loading={categoryLoading}
      selection={selection}
      onChange={setSelection}
      className="h-[calc(100vh-6rem)] sticky top-4"
    />
  );

  return (
    <div className="space-y-3 md:space-y-6">
      <div ref={topAnchorRef} aria-hidden className="scroll-mt-24" />
      <PageHeader
        title="Browse products"
        highlight="products"
        subtitle="Source products for bulk orders, dropshipping, and more — browse freely on any plan."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={canExport ? 'default' : 'outline'}
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setExportOpen(true)}
              title={canExport ? 'Export catalog with image URLs (CSV/Excel)' : 'Upgrade to unlock catalog export'}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export Catalog
              {!canExport && <span className="text-[10px] opacity-70 ml-0.5">· upgrade</span>}
            </Button>
          </div>
        }
      />

      {/* Search + filters row */}
      <div className="md:space-y-3">
        {/* Sticky search bar — pinned to the header on mobile scroll */}
        <div className="sticky top-[56px] z-20 -mx-3 px-3 py-2 bg-background/95 backdrop-blur-md border-b border-border/40 md:static md:mx-0 md:px-0 md:py-0 md:bg-transparent md:backdrop-blur-none md:border-0">
          <form
            className="relative flex flex-1 min-w-[200px] md:w-full md:max-w-none gap-2"
            onSubmit={(e) => { e.preventDefault(); setDebouncedSearch(search.trim()); }}
          >
            <div className="relative flex-1 focus-glow rounded-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 h-11 md:h-10"
              />
            </div>
            <Button type="submit" size="sm" className="h-11 md:h-10 px-4 rounded-full touch-manipulation">Search</Button>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="flex gap-1.5 w-full md:w-auto md:overflow-x-auto md:no-scrollbar md:-mx-1 md:px-1 md:snap-x">
            {(['all', 'local', 'global'] as const).map(s => (
              <Button
                key={s}
                variant={source === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSource(s)}
                className={`h-9 text-xs rounded-full transition-all flex-1 md:flex-none md:snap-start md:shrink-0 touch-manipulation active:scale-[0.97] ${source === s ? 'ring-1 ring-primary/30' : 'hover:bg-primary/5 hover:text-primary hover:border-primary/30'}`}
              >
                {s === 'all' ? 'All Sources' : s === 'local' ? '🇸🇦 Local' : '🌍 Global'}
              </Button>
            ))}
          </div>

          {/* Mobile-only categories + sort row */}
          <div className="w-full lg:hidden flex flex-col gap-2 order-last">
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="group relative w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 flex items-center gap-3 px-4 text-left transition-all duration-150 active:scale-[0.98] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-primary-foreground/15 shrink-0">
                    <Layers className="h-5 w-5" />
                  </span>
                  <span className="flex-1 min-w-0 leading-tight">
                    <span className="block text-base font-bold">Categories</span>
                    <span className="block text-[11px] font-medium text-primary-foreground/80">
                      {selectedChips.length > 0 ? 'Tap to refine your filters' : 'Filter products by category'}
                    </span>
                  </span>
                  {selectedChips.length > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground text-primary px-3 py-1 text-xs font-bold shrink-0 shadow-sm">
                      {selectedChips.length} selected
                    </span>
                  ) : (
                    <ChevronRight className="h-5 w-5 text-primary-foreground/80 shrink-0 transition-transform group-active:translate-x-0.5" />
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] max-w-[88vw] h-[100dvh] p-0">
                <div className="h-full p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  {categoryError ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                      <div className="flex items-start gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium">Categories couldn't load</p>
                          <p className="text-xs text-destructive/80 mt-0.5 break-words">{categoryError}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => void loadCategoryAggregate()} className="w-full gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5" /> Retry
                      </Button>
                    </div>
                  ) : (
                    <CategorySidebar
                      aggregatedCounts={hasAggregateCategories ? aggregatedCounts : undefined}
                      categorySource={!hasAggregateCategories && !categoryLoading ? products : undefined}
                      loading={categoryLoading}
                      selection={selection}
                      onChange={(s, meta) => { setSelection(s); if (meta?.isLeaf) setMobileSidebarOpen(false); }}
                      className="h-full"
                    />
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {selectedChips.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {selectedChips.map(chip => (
                  <span
                    key={chip.key}
                    title={chip.path}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary pl-3 pr-1 py-1 text-xs font-medium shrink-0 max-w-[200px] border border-primary/20"
                  >
                    <span className="truncate">{chip.path}</span>
                    <button
                      onClick={() => removeKey(chip.key)}
                      className="inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-primary/20 touch-manipulation shrink-0"
                      aria-label={`Remove ${chip.path}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="h-9 w-full rounded-full text-sm">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-asc">Price: Low → High</SelectItem>
                <SelectItem value="price-desc">Price: High → Low</SelectItem>
                <SelectItem value="name-asc">Name: A → Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="hidden md:block ml-auto">
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-[180px] h-9">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-asc">Price: Low → High</SelectItem>
                <SelectItem value="price-desc">Price: High → Low</SelectItem>
                <SelectItem value="name-asc">Name: A → Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">{sidebar}</div>

        {/* Products grid area */}
        <div className="space-y-4 min-w-0">
          {/* Selected chips bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm min-w-0 overflow-x-auto no-scrollbar flex-nowrap md:flex-wrap -mx-1 px-1">
              {isSearchActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1.5 text-xs shrink-0">
                  <Search className="h-3 w-3" />
                  "{debouncedSearch}"
                  <button
                    onClick={() => { setSearch(''); setDebouncedSearch(''); }}
                    className="ml-0.5 inline-flex items-center justify-center h-6 w-6 -my-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/60 touch-manipulation"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {selectedChips.length === 0 && !isSearchActive && (
                <span className="font-semibold text-foreground shrink-0">All products</span>
              )}
              {selectedChips.map(chip => (
                <span
                  key={chip.key}
                  title={chip.path}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1.5 text-xs font-medium shrink-0 max-w-[260px]"
                >
                  <span className="truncate">{chip.path}</span>
                  <button
                    onClick={() => removeKey(chip.key)}
                    className="ml-0.5 inline-flex items-center justify-center h-6 w-6 -my-1 rounded-full hover:bg-primary/15 touch-manipulation shrink-0"
                    aria-label={`Remove ${chip.path}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              {(selectedChips.length > 0 || isSearchActive) && (
                <button
                  onClick={() => { setSelection(emptySelection()); setSearch(''); setDebouncedSearch(''); }}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted shrink-0 touch-manipulation"
                >
                  Clear all
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground shrink-0">
              <span className="font-medium text-foreground">
                {totalCount !== null ? totalCount.toLocaleString() : '—'}
              </span> product{totalCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Error state with retry */}
          {fetchError && !loading && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-destructive min-w-0">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="truncate">Couldn't load products. {fetchError}</span>
              </div>
              <Button size="sm" variant="outline" onClick={retry} className="gap-1.5 shrink-0">
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <CatalogLoading />
          ) : products.length > 0 ? (
            <>
              <div className="product-grid gap-3 sm:gap-5">
                {products.map((p, i) => (
                  <div
                    key={p.id}
                    className="opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i % PAGE_SIZE, 6) * 20}ms`, animationFillMode: 'forwards' }}
                  >
                    <ProductCard product={p} priority={i < 4} />
                  </div>
                ))}
              </div>

              {totalCount !== null && totalCount > PAGE_SIZE && (() => {
                const totalPages = Math.ceil(totalCount / PAGE_SIZE);
                const current = page + 1;
                const goTo = (p: number) => {
                  const next = Math.max(0, Math.min(totalPages - 1, p));
                  if (next === page) return;
                  // Blur the focused pagination button so the browser doesn't
                  // auto-scroll it back into view after rerender.
                  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                  setPage(next);
                };
                // Build a compact page list with ellipses
                const pages: (number | 'ellipsis')[] = [];
                const push = (n: number) => { if (!pages.includes(n)) pages.push(n); };
                push(1);
                for (let i = current - 1; i <= current + 1; i++) {
                  if (i > 1 && i < totalPages) push(i);
                }
                push(totalPages);
                const withGaps: (number | 'ellipsis')[] = [];
                pages.sort((a, b) => (a as number) - (b as number)).forEach((n, idx, arr) => {
                  if (idx > 0 && (n as number) - (arr[idx - 1] as number) > 1) withGaps.push('ellipsis');
                  withGaps.push(n);
                });
                return (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goTo(page - 1)}
                      disabled={page === 0 || loadingMore || loading}
                      className="h-9 px-3 gap-1 rounded-full"
                    >
                      <ChevronRight className="h-4 w-4 rotate-180" />
                      Prev
                    </Button>
                    {withGaps.map((p, i) =>
                      p === 'ellipsis' ? (
                        <span key={`e-${i}`} className="px-2 text-muted-foreground text-sm">…</span>
                      ) : (
                        <Button
                          key={p}
                          variant={p === current ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => goTo(p - 1)}
                          disabled={loadingMore || loading}
                          className={`h-9 min-w-9 px-3 rounded-full ${p === current ? 'ring-1 ring-primary/30' : ''}`}
                        >
                          {p}
                        </Button>
                      )
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goTo(page + 1)}
                      disabled={current >= totalPages || loadingMore || loading}
                      className="h-9 px-3 gap-1 rounded-full"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })()}
            </>
          ) : !fetchError ? (
            <div className="text-center py-20 rounded-xl border border-dashed border-border bg-card/30">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-1">No products found</p>
              <p className="text-muted-foreground text-sm">Try a different category, source, or search term.</p>
              {(selectedChips.length > 0 || isSearchActive) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSelection(emptySelection());
                    setSearch('');
                    setDebouncedSearch('');
                  }}
                >
                  Reset filters
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Plan-aware export & bulk image download dialogs */}
      <CatalogExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        aggregatedCounts={aggregatedCounts}
        initialSearch={debouncedSearch}
        initialSource={source}
      />
    </div>
  );
};

function CatalogLoading() {
  return (
    <div className="relative min-h-[400px]">
      <div className="product-grid gap-3 sm:gap-5 opacity-40">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
            <div className="aspect-square bg-muted/30 animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-3/4 bg-muted/30 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-muted/30 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex items-start justify-center pt-32 pointer-events-none">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-background/85 backdrop-blur-md border border-border/40 px-8 py-6 shadow-xl">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <div className="relative animate-pulse">
              <BrandLogo />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-xs text-muted-foreground font-medium tracking-wide">Loading products…</p>
        </div>
      </div>
    </div>
  );
}

export default CustomerCatalog;
