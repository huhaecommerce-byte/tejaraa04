import { useState, useEffect, useMemo, useRef } from 'react';
import { ProductCard, type ProductData } from '@/components/storefront/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBrowsedProducts } from '@/hooks/useBrowsedProducts';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/customer/aux/PageHeader';

const PAGE_SIZE = 20;

// ── Module-scope cache ──────────────────────────────────────────────
interface BrowsedCache {
  productMap: Map<string, ProductData>;
  orderedIds: string[];
  search: string;
  page: number;
}
let browsedCache: BrowsedCache | null = null;

const BrowsedProducts = () => {
  const { browsedIds, historyDays } = useBrowsedProducts();

  const cached = browsedCache;
  const hasCache = cached && cached.orderedIds.length > 0;

  const [productMap, setProductMap] = useState<Map<string, ProductData>>(
    () => cached?.productMap ?? new Map()
  );
  const [search, setSearch] = useState(cached?.search ?? '');
  const [loading, setLoading] = useState(!hasCache && browsedIds.length > 0);
  const [page, setPage] = useState(cached?.page ?? 1);
  const fetchedIdsRef = useRef<Set<string>>(
    new Set(cached?.productMap.keys() ?? [])
  );

  useEffect(() => { setPage(1); }, [search]);

  // ── Fetch only missing product IDs from the current page ─────────
  useEffect(() => {
    if (browsedIds.length === 0) {
      setLoading(false);
      return;
    }

    // If searching, we need all products fetched (for name filtering)
    const idsToConsider = browsedIds;
    const missing = idsToConsider.filter(id => !fetchedIdsRef.current.has(id));

    if (missing.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchMissing = async () => {
      // Only show skeleton on a true cold load (no cached data at all)
      if (productMap.size === 0) setLoading(true);

      // Fetch in chunks of 50 to avoid huge IN clauses
      const CHUNK = 50;
      for (let i = 0; i < missing.length; i += CHUNK) {
        if (cancelled) return;
        const chunk = missing.slice(i, i + CHUNK);
        const { data } = await supabase
          .from('products')
          .select('*')
          .in('id', chunk);
        if (cancelled) return;
        if (data) {
          setProductMap(prev => {
            const next = new Map(prev);
            for (const p of data) {
              next.set(p.id, p as unknown as ProductData);
              fetchedIdsRef.current.add(p.id);
            }
            return next;
          });
        }
      }
      setLoading(false);
    };

    fetchMissing();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browsedIds]);

  // ── Derive ordered, filtered, paged list ─────────────────────────
  const ordered = useMemo(
    () => browsedIds.map(id => productMap.get(id)).filter(Boolean) as ProductData[],
    [browsedIds, productMap]
  );

  const filtered = useMemo(() => {
    if (!search) return ordered;
    const q = search.toLowerCase();
    return ordered.filter(p => p.name.toLowerCase().includes(q));
  }, [ordered, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Persist to module-scope cache ────────────────────────────────
  useEffect(() => {
    browsedCache = {
      productMap,
      orderedIds: browsedIds,
      search,
      page,
    };
  }, [productMap, browsedIds, search, page]);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Recently browsed"
        highlight="browsed"
        subtitle={`Products you've previously viewed (${browsedIds.length} total) · history window: ${historyDays === Infinity ? 'Unlimited' : `${historyDays || 7} days`}`}
        guide={{
          chip: 'About this list',
          intro: 'Use this archive to return to products faster.',
          steps: [
            { title: 'Auto-tracked', description: 'Every product you open is logged here automatically.' },
            { title: 'Quick return', description: 'Re-open any item without searching the full catalog again.' },
            { title: 'Compare', description: 'Review price, MOQ, and sourcing type side by side.' },
          ],
        }}
      />

      {browsedIds.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search browsed products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
      )}

      {loading && productMap.size === 0 ? (
        <div className="product-grid gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/40 bg-card/60 p-3 space-y-3 animate-pulse">
              <div className="aspect-square rounded-lg bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : paged.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="product-grid gap-5">
            {paged.map((p, i) => (
              <div key={p.id} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'forwards' }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{page}</span> of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : browsedIds.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium mb-1">No browsed products yet</p>
          <p className="text-muted-foreground">Products you browse in the catalog will appear here.</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products match your search.</p>
        </div>
      )}
    </div>
  );
};

export default BrowsedProducts;
