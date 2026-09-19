import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, MapPin } from 'lucide-react';

export function TopProducts({ orders }: { orders: any[] }) {
  const top = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; total: number }>();
    orders.forEach(o => {
      (o.products || []).forEach((p: any) => {
        const key = p.product_id || p.sku || p.name;
        if (!key) return;
        const cur = map.get(key) || { name: p.name || key, qty: 0, total: 0 };
        cur.qty += Number(p.quantity) || 0;
        cur.total += (Number(p.price) || 0) * (Number(p.quantity) || 0);
        map.set(key, cur);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [orders]);

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4 text-amber-500" /> Top products</CardTitle></CardHeader>
      <CardContent className="p-0">
        {top.length === 0 ? <p className="p-6 text-center text-xs text-muted-foreground">No purchases yet.</p> : (
          <div className="divide-y">
            {top.map((p, i) => (
              <div key={i} className="px-4 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.qty} units</p>
                </div>
                <p className="text-sm font-bold tabular-nums">SAR {p.total.toFixed(0)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PreferredDestinations({ orders }: { orders: any[] }) {
  const dests = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => {
      const d = (o.destination || '').trim();
      if (!d) return;
      map.set(d, (map.get(d) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders]);

  const max = Math.max(...dests.map(d => d[1]), 1);

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4 text-sky-500" /> Preferred destinations</CardTitle></CardHeader>
      <CardContent className="p-0">
        {dests.length === 0 ? <p className="p-6 text-center text-xs text-muted-foreground">No destinations recorded.</p> : (
          <div className="divide-y">
            {dests.map(([name, count]) => (
              <div key={name} className="px-4 py-2 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{count} orders</p>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
