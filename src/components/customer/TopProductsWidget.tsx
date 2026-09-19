import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Package } from 'lucide-react';

type TopProduct = { name: string; count: number; image?: string };

export function TopProductsWidget() {
  const { user } = useAuth();
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('orders')
      .select('products')
      .eq('user_id', user.id)
      .then(({ data: orders }) => {
        const counts: Record<string, { count: number; image?: string }> = {};
        (orders || []).forEach((o: any) => {
          const prods = Array.isArray(o.products) ? o.products : [];
          prods.forEach((p: any) => {
            const name = p.name || p.product_name || 'Unknown';
            if (!counts[name]) counts[name] = { count: 0, image: p.image || p.images?.[0] };
            counts[name].count += Number(p.qty || p.quantity || 1);
          });
        });
        const sorted = Object.entries(counts)
          .map(([name, { count, image }]) => ({ name, count, image }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setProducts(sorted);
        setLoading(false);
      });
  }, [user?.id]);

  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  if (products.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No order data yet</p>;

  return (
    <div className="space-y-2">
      {products.map((p, i) => (
        <div key={p.name} className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {p.image ? (
              <img src={p.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <Package className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <span className="text-sm truncate flex-1">{p.name}</span>
          <span className="text-sm font-semibold tabular-nums">{p.count}×</span>
        </div>
      ))}
    </div>
  );
}
