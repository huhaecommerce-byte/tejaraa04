import { useEffect, useState } from 'react';
import { Link } from "@/lib/router-compat";
import { AlertTriangle, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BentoTile } from '@/components/layout/BentoGrid';
import { SectionRibbon } from '@/components/layout/SectionRibbon';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stock_qty: number;
  low_stock_threshold: number;
}

export const LowStockWidget = () => {
  const [items, setItems] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, sku, stock_qty, low_stock_threshold')
        .eq('track_inventory', true)
        .order('stock_qty', { ascending: true })
        .limit(8);
      const filtered = ((data as LowStockProduct[]) || []).filter(p => p.stock_qty <= p.low_stock_threshold);
      setItems(filtered);
      setLoading(false);
    })();
  }, []);

  return (
    <BentoTile span={2}>
      <SectionRibbon icon={AlertTriangle} title="Low Stock Alerts" tone="amber" />
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">All tracked stock is healthy ✓</p>
      ) : (
        <div className="divide-y divide-border/40">
          {items.map(p => (
            <Link key={p.id} to="/admin/products" className="flex items-center justify-between py-2.5 hover:bg-muted/30 -mx-2 px-2 rounded-md transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  p.stock_qty === 0 ? 'bg-destructive/10 text-destructive' : 'bg-amber-100 text-amber-600'
                }`}>
                  <Package className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">{p.sku}</p>
                </div>
              </div>
              <Badge variant={p.stock_qty === 0 ? 'destructive' : 'secondary'} className="shrink-0">
                {p.stock_qty === 0 ? 'Out' : `${p.stock_qty} left`}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </BentoTile>
  );
};
