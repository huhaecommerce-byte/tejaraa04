import { useCallback, useEffect, useRef, useState } from 'react';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';
import { RetailContainer, RetailErrorState } from '@/components/retail/common';
import { ActiveFilterChips, FilterSection, ListingToolbar, MobileFilterSheet, RetailFilterSidebar, RetailListingHeader, RetailPagination, RetailProductGrid } from '@/components/retail/listing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/analytics/track';
import type { ProductData } from '@/components/storefront/ProductCard';
import { useSearchParams } from '@/lib/router-compat';
import { useLocale } from '@/i18n/LocaleProvider';

const PAGE_SIZE = 50;
const LIST_COLUMNS = 'id,sku,name,name_ar,slug,top_category,sub_category,detailed_category,source,images,price_sar,price_usd,cost_usd,moq,weight_kg,estimated_delivery,labelling_available,platforms,stock_qty,track_inventory,low_stock_threshold,created_at';
type SortKey = 'newest' | 'price_asc' | 'price_desc';

export default function SearchResults() {
  const { t } = useLocale();
  const [params, setParams] = useSearchParams();
  const query = (params.get('q') ?? '').trim();
  const source = params.get('source') === 'local' || params.get('source') === 'global' ? params.get('source') as 'local' | 'global' : 'all';
  const sort = (['price_asc','price_desc'] as const).includes(params.get('sort') as 'price_asc' | 'price_desc') ? params.get('sort') as SortKey : 'newest';
  const min = Number(params.get('min')); const max = Number(params.get('max'));
  const appliedMin = Number.isFinite(min) && min >= 0 && params.has('min') ? min : null;
  const appliedMax = Number.isFinite(max) && max >= 0 && params.has('max') ? max : null;
  const page = Math.max(0, Number(params.get('page') ?? '1') - 1 || 0);
  const [minInput, setMinInput] = useState(params.get('min') ?? '');
  const [maxInput, setMaxInput] = useState(params.get('max') ?? '');
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const fetchTokenRef = useRef(0); const abortRef = useRef<AbortController | null>(null);

  const updateParams = useCallback((changes: Record<string, string | null>) => setParams((previous) => { const next = new URLSearchParams(previous); for (const [key,value] of Object.entries(changes)) value ? next.set(key,value) : next.delete(key); return next; }), [setParams]);
  useEffect(() => { setMinInput(params.get('min') ?? ''); setMaxInput(params.get('max') ?? ''); }, [params]);

  const buildQuery = useCallback((countMode: boolean, signal?: AbortSignal) => {
    let request = supabase.from('products').select(LIST_COLUMNS, countMode ? { count: 'estimated' } : undefined);
    if (source !== 'all') request = request.eq('source', source);
    if (appliedMin !== null) request = request.gte('price_sar', appliedMin);
    if (appliedMax !== null) request = request.lte('price_sar', appliedMax);
    request = request.order(sort === 'price_asc' || sort === 'price_desc' ? 'price_sar' : 'created_at', { ascending: sort === 'price_asc' }).order('id', { ascending: false });
    return signal ? request.abortSignal(signal) : request;
  }, [source, sort, appliedMin, appliedMax]);

  const runFetch = useCallback(async () => {
    const token = ++fetchTokenRef.current; abortRef.current?.abort(); const controller = new AbortController(); abortRef.current = controller;
    setLoading(true); setError(false); const offset = page * PAGE_SIZE;
    if (query) {
      const terms = query.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((word) => word.length >= 2).slice(0,4);
      const attempt = (relaxed: boolean) => supabase.rpc('hunt_catalog_products', { _terms: terms.length ? terms : [query], _category: null, _min_price: appliedMin, _max_price: appliedMax, _source: source === 'all' ? null : source, _in_stock: false, _limit: PAGE_SIZE, _offset: offset, _relaxed: relaxed } as never);
      let { data, error: fetchError } = await attempt(false);
      if (!fetchError && !(data as unknown[])?.length && terms.length > 1) ({ data, error: fetchError } = await attempt(true));
      for (let index=0; fetchError && (fetchError as { code?: string }).code === '57014' && index<2; index++) { await new Promise((resolve) => setTimeout(resolve,600*(index+1))); if (token !== fetchTokenRef.current || controller.signal.aborted) return; ({ data, error: fetchError } = await attempt(false)); }
      if (token !== fetchTokenRef.current || controller.signal.aborted) return;
      if (fetchError) { setError(true); setLoading(false); return; }
      let rows = ((data as Record<string, unknown>[]) ?? []).map(({ total_count: _totalCount, match_score: _matchScore, ...product }) => product) as unknown as ProductData[];
      if (sort === 'price_asc') rows = [...rows].sort((a,b) => Number(a.price_sar ?? 0)-Number(b.price_sar ?? 0));
      if (sort === 'price_desc') rows = [...rows].sort((a,b) => Number(b.price_sar ?? 0)-Number(a.price_sar ?? 0));
      const total = Number((data as Record<string, unknown>[])?.[0]?.total_count ?? rows.length); setProducts(rows); setTotalCount(total); void trackEvent('search',{ query, results:total }); setLoading(false); return;
    }
    const needCount = page === 0; const attempt = () => buildQuery(needCount, controller.signal).range(offset,offset+PAGE_SIZE-1);
    let { data, count, error: fetchError } = await attempt();
    for (let index=0; fetchError && (fetchError as { code?: string }).code === '57014' && index<2; index++) { await new Promise((resolve) => setTimeout(resolve,600*(index+1))); if (token !== fetchTokenRef.current || controller.signal.aborted) return; ({ data, count, error: fetchError } = await attempt()); }
    if (token !== fetchTokenRef.current || controller.signal.aborted) return;
    if (fetchError) { setError(true); setLoading(false); return; }
    setProducts((data as unknown as ProductData[]) ?? []); if (needCount && typeof count === 'number') setTotalCount(count); setLoading(false);
  }, [page, query, appliedMin, appliedMax, source, sort, buildQuery]);

  useEffect(() => { void runFetch(); return () => abortRef.current?.abort(); }, [runFetch]);
  const applyPrice = () => updateParams({ min: minInput && Number.isFinite(Number(minInput)) ? String(Math.max(0,Number(minInput))) : null, max: maxInput && Number.isFinite(Number(maxInput)) ? String(Math.max(0,Number(maxInput))) : null, page:null });
  const clearAll = () => setParams(new URLSearchParams(query ? { q:query } : {}));
  const chips = [...(source !== 'all' ? [{ key:'source', label:source === 'local' ? t('shopx.listing.localFaster') : t('shopx.listing.standardDelivery') }] : []), ...(appliedMin !== null || appliedMax !== null ? [{ key:'price', label:t('shopx.search.priceRange', { min: appliedMin ?? 0, max: appliedMax ?? t('shopx.search.any') }) }] : []), ...(sort !== 'newest' ? [{ key:'sort', label:sort === 'price_asc' ? t('shopx.search.priceLowHigh') : t('shopx.search.priceHighLow') }] : [])];
  const removeChip = (key:string) => key === 'price' ? updateParams({min:null,max:null,page:null}) : updateParams({[key]:null,page:null});
  const resultLabel = t('shopx.search.resultsCount', { count: (totalCount ?? products.length).toLocaleString() }); const totalPages = totalCount === null ? 1 : Math.max(1,Math.ceil(totalCount/PAGE_SIZE));
  const filters = <><FilterSection value="delivery" title={t('shopx.listing.delivery')}><div className="grid gap-1">{([['all',t('shopx.listing.allDelivery')],['local',t('shopx.listing.localFaster')],['global',t('shopx.listing.standardDelivery')]] as const).map(([value,label]) => <Button key={value} type="button" variant="ghost" onClick={() => updateParams({source:value === 'all' ? null:value,page:null})} className={`justify-start ${source===value?'bg-retail-light-green text-retail-green':''}`}>{label}</Button>)}</div></FilterSection><FilterSection value="price" title={t('shopx.search.price')}><div className="grid grid-cols-2 gap-2"><Input value={minInput} onChange={(event) => setMinInput(event.target.value)} inputMode="decimal" placeholder={t('shopx.search.minSar')} aria-label={t('shopx.search.minPriceAria')} /><Input value={maxInput} onChange={(event) => setMaxInput(event.target.value)} inputMode="decimal" placeholder={t('shopx.search.maxSar')} aria-label={t('shopx.search.maxPriceAria')} /></div><Button type="button" variant="outline" onClick={applyPrice} className="mt-2 w-full">{t('shopx.search.applyPrice')}</Button></FilterSection></>;
  const sortControl = <select value={sort} onChange={(event) => updateParams({sort:event.target.value === 'newest' ? null:event.target.value,page:null})} aria-label={t('shopx.search.sortAria')} className="h-10 flex-1 rounded-md border border-retail-border bg-retail-card px-3 text-sm sm:w-48 sm:flex-none"><option value="newest">{t('shopx.search.newest')}</option><option value="price_asc">{t('shopx.search.priceLowHigh')}</option><option value="price_desc">{t('shopx.search.priceHighLow')}</option></select>;

  return <RetailPublicShell><main><RetailContainer className="space-y-4 py-3 sm:py-4"><RetailListingHeader breadcrumbs={[{label:t('shopx.listing.home'),to:'/'},{label:t('shopx.search.searchTitle')}]} title={query ? t('shopx.search.resultsFor', { query }) : t('shopx.search.searchProducts')} description={t('shopx.search.description')} countLabel={!loading ? resultLabel : undefined} /><div className="grid items-start gap-4 lg:grid-cols-[250px_minmax(0,1fr)]"><RetailFilterSidebar hasFilters={chips.length>0} onClear={clearAll}>{filters}</RetailFilterSidebar><div className="min-w-0 space-y-3"><ListingToolbar resultLabel={loading?t('shopx.search.searching'):resultLabel} mobileFilters={<MobileFilterSheet count={chips.length} resultLabel={resultLabel} hasFilters={chips.length>0} onClear={clearAll}>{filters}</MobileFilterSheet>} sortControl={sortControl} /><ActiveFilterChips chips={chips} onRemove={removeChip} onClear={clearAll} />{error?<section className="rounded-lg border border-retail-border bg-retail-card"><RetailErrorState title={t('shopx.search.errorTitle')} description={t('shopx.search.errorDescription')} onRetry={() => void runFetch()} /></section>:<RetailProductGrid products={products as (ProductData & {slug?:string|null})[]} loading={loading} emptyTitle={query ? t('shopx.search.emptyForQuery', { query }) : t('shopx.search.emptyTitle')} emptyDescription={t('shopx.search.emptyDescription')} />}<RetailPagination currentPage={page+1} totalPages={totalPages} onPageChange={(next) => {updateParams({page:next>1?String(next):null});document.getElementById('listing-results')?.scrollIntoView({behavior:'smooth'});}} /></div></div></RetailContainer></main></RetailPublicShell>;
}