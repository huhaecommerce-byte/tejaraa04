import { useEffect, useState } from 'react';
import { fetchHeroProducts, type HeroSettings } from '@/lib/heroQuery';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Package } from 'lucide-react';

interface Props {
  settings: HeroSettings;
}

export function HeroLivePreview({ settings }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const data = await fetchHeroProducts(settings);
        if (!cancelled) setProducts(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Preview failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [
    settings.product_source,
    settings.time_window,
    settings.order_by,
    settings.product_count,
    settings.show_out_of_stock,
    settings.min_stock,
    JSON.stringify(settings.category_filters),
    JSON.stringify(settings.manual_product_ids),
  ]);

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-semibold text-sm">Live preview</h4>
        </div>
        <span className="text-xs text-muted-foreground">
          {loading ? 'Loading…' : `${products.length} product${products.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-4 gap-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No products match these settings yet.
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
          {products.map((p, i) => (
            <div key={p.id} className="relative group">
              <div className="aspect-square rounded overflow-hidden bg-background border">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
              <div className="absolute top-1 left-1 bg-background/90 backdrop-blur rounded px-1 text-[10px] font-mono">
                #{i + 1}
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[9px] text-white line-clamp-2">{p.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
