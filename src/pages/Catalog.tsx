import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { JsonLd } from '@/components/JsonLd';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';
import { RetailContainer, RetailErrorState } from '@/components/retail/common';
import { ActiveFilterChips, FilterSection, ListingToolbar, MobileFilterSheet, RetailFilterSidebar, RetailListingHeader, RetailPagination, RetailProductGrid } from '@/components/retail/listing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/analytics/track';
import type { ProductData } from '@/components/storefront/ProductCard';
import { CategorySidebar, emptySelection, describeSelection, type CategorySelection, type AggregatedCount } from '@/components/customer/CategorySidebar';
import { useSearchParams } from '@/lib/router-compat';
import { useLocale } from '@/i18n/LocaleProvider';

const PAGE_SIZE = 50;
const LIST_COLUMNS = 'id,sku,name,name_ar,slug,top_category,sub_category,detailed_category,source,images,price_sar,price_usd,cost_usd,moq,weight_kg,estimated_delivery,labelling_available,platforms,stock_qty,track_inventory,low_stock_threshold,created_at';
const esc = (value: string) => value.replace(/([\\,().])/g, '\\$1');

function buildCategoryOr(selection: CategorySelection) {
  if (!selection.keys.size) return null;
  const groups: string[] = [];
  for (const key of selection.keys) {
    const parts = key.split('::');
    if (parts.length === 1) groups.push(`and(top_category.eq.${esc(parts[0])})`);
    else if (parts.length === 2) groups.push(`and(top_category.eq.${esc(parts[0])},sub_category.eq.${esc(parts[1])})`);
    else if (parts.length === 3) groups.push(`and(top_category.eq.${esc(parts[0])},sub_category.eq.${esc(parts[1])},detailed_category.eq.${esc(parts[2])})`);
  }
  return groups.join(',');
}

export default function Catalog() {
  const { t } = useLocale();
  const [params, setParams] = useSearchParams();
  const query = (params.get('q') ?? '').trim();
  const categoryKey = params.get('cat') ?? '';
  const source = params.get('source') === 'local' || params.get('source') === 'global' ? params.get('source') as 'local' | 'global' : 'all';
  const page = Math.max(0, Number(params.get('page') ?? '1') - 1 || 0);
  const selection = useMemo<CategorySelection>(() => ({ keys: categoryKey ? new Set([categoryKey]) : new Set() }), [categoryKey]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [aggregatedCounts, setAggregatedCounts] = useState<AggregatedCount[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const fetchTokenRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const updateParams = useCallback((changes: Record<string, string | null>, replace = false) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
      return next;
    }, { replace });
  }, [setParams]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const all: AggregatedCount[] = [];
      for (let index = 0; index < 100; index++) {
        const { data, error: readError } = await supabase.from('product_category_counts_cache').select('top_category, sub_category, detailed_category, cnt').range(index * 1000, index * 1000 + 999);
        if (readError || !data?.length) break;
        all.push(...data as unknown as AggregatedCount[]);
        if (data.length < 1000) break;
      }
      if (active) { setAggregatedCounts(all); setCategoryLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const buildQuery = useCallback((countMode: boolean, signal?: AbortSignal) => {
    let request = supabase.from('products').select(LIST_COLUMNS, countMode ? { count: 'estimated' } : undefined);
    if (query) request = request.ilike('name', `%${query}%`);
    if (source !== 'all') request = request.eq('source', source);
    const categoryFilter = buildCategoryOr(selection);
    if (categoryFilter) request = request.or(categoryFilter);
    request = request.order('created_at', { ascending: false }).order('id', { ascending: false });
    return signal ? request.abortSignal(signal) : request;
  }, [query, selection, source]);

  const runFetch = useCallback(async () => {
    const token = ++fetchTokenRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true); setError(false);
    const needCount = page === 0;
    const attempt = () => buildQuery(needCount, controller.signal).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    let { data, count, error: fetchError } = await attempt();
    for (let index = 0; fetchError && (fetchError as { code?: string }).code === '57014' && index < 2; index++) {
      await new Promise((resolve) => setTimeout(resolve, 600 * (index + 1)));
      if (token !== fetchTokenRef.current || controller.signal.aborted) return;
      ({ data, count, error: fetchError } = await attempt());
    }
    if (token !== fetchTokenRef.current || controller.signal.aborted) return;
    if (fetchError) { setError(true); setLoading(false); return; }
    setProducts((data as unknown as ProductData[]) ?? []);
    if (needCount && typeof count === 'number') setTotalCount(count);
    if (query) void trackEvent('search', { query, results: count ?? 0 });
    setLoading(false);
  }, [buildQuery, page, query]);

  useEffect(() => { void runFetch(); return () => abortRef.current?.abort(); }, [runFetch]);

  const selected = describeSelection(selection);
  const chips = [...selected.map((item) => ({ key: `cat:${item.key}`, label: item.label })), ...(query ? [{ key: 'q', label: `“${query}”` }] : []), ...(source !== 'all' ? [{ key: 'source', label: source === 'local' ? t('shopx.listing.localFaster') : t('shopx.listing.standardDelivery') }] : [])];
  const clearAll = () => setParams(new URLSearchParams());
  const removeChip = (key: string) => updateParams({ [key.startsWith('cat:') ? 'cat' : key]: null, page: null });
  const resultLabel = totalCount === null ? t('shopx.listing.productsCount', { count: products.length.toLocaleString() }) : (totalCount >= 1000 ? t('shopx.listing.productsCountPlus', { count: totalCount.toLocaleString() }) : t('shopx.listing.productsCount', { count: totalCount.toLocaleString() }));
  const totalPages = totalCount === null ? 1 : Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const filters = <><FilterSection value="delivery" title={t('shopx.listing.delivery')}><div className="grid gap-1">{([['all',t('shopx.listing.allDelivery')],['local',t('shopx.listing.localFaster')],['global',t('shopx.listing.standardDelivery')]] as const).map(([value,label]) => <Button key={value} type="button" variant="ghost" onClick={() => updateParams({ source: value === 'all' ? null : value, page: null })} className={`justify-start ${source === value ? 'bg-retail-light-green text-retail-green' : ''}`}>{label}</Button>)}</div></FilterSection><FilterSection value="category" title={t('shopx.listing.category')}><CategorySidebar aggregatedCounts={aggregatedCounts.length ? aggregatedCounts : undefined} loading={categoryLoading} selection={selection} onChange={(next) => updateParams({ cat: [...next.keys][0] ?? null, page: null })} className="border-0 bg-transparent shadow-none" /></FilterSection></>;

  return <RetailPublicShell><JsonLd data={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Tejaraa Shop Catalogue', description: 'Browse products available on Tejaraa across Saudi Arabia.', url: 'https://tejaraa.com/catalog', isPartOf: { '@type': 'WebSite', name: 'Tejaraa', url: 'https://tejaraa.com' } }} /><main><RetailContainer className="space-y-4 py-3 sm:py-4"><RetailListingHeader breadcrumbs={[{ label: t('shopx.listing.home'), to: '/' }, { label: t('shopx.listing.allProducts') }]} title={t('shopx.listing.shopAllProducts')} description={t('shopx.listing.shopAllDescription')} countLabel={!loading ? resultLabel : undefined} /><div className="grid items-start gap-4 lg:grid-cols-[250px_minmax(0,1fr)]"><RetailFilterSidebar hasFilters={chips.length > 0} onClear={clearAll}>{filters}</RetailFilterSidebar><div className="min-w-0 space-y-3"><ListingToolbar resultLabel={loading ? t('shopx.listing.loadingProducts') : resultLabel} mobileFilters={<MobileFilterSheet count={chips.length} resultLabel={resultLabel} hasFilters={chips.length > 0} onClear={clearAll}>{filters}</MobileFilterSheet>} /><ActiveFilterChips chips={chips} onRemove={removeChip} onClear={clearAll} />{error ? <section className="rounded-lg border border-retail-border bg-retail-card"><RetailErrorState title={t('shopx.listing.errorTitle')} description={t('shopx.listing.errorDescription')} onRetry={() => void runFetch()} /></section> : <RetailProductGrid products={products as (ProductData & { slug?: string | null })[]} loading={loading} emptyTitle={t('shopx.listing.emptyTitle')} emptyDescription={t('shopx.listing.emptyDescription')} />}<RetailPagination currentPage={page + 1} totalPages={totalPages} onPageChange={(next) => { updateParams({ page: next > 1 ? String(next) : null }); document.getElementById('listing-results')?.scrollIntoView({ behavior: 'smooth' }); }} /></div></div></RetailContainer></main></RetailPublicShell>;
}