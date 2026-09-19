import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_CONFIG: { key: string; label: string; color: string }[] = [
  { key: 'pending', label: 'Pending', color: 'bg-amber-400' },
  { key: 'processing', label: 'Processing', color: 'bg-blue-400' },
  { key: 'shipped', label: 'Shipped', color: 'bg-indigo-400' },
  { key: 'delivered', label: 'Delivered', color: 'bg-emerald-400' },
  { key: 'cancelled', label: 'Cancelled', color: 'bg-red-400' },
];

export function OrderStatusBreakdown() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('orders')
      .select('status')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const c: Record<string, number> = {};
        (data || []).forEach((o: any) => {
          c[o.status] = (c[o.status] || 0) + 1;
        });
        setCounts(c);
        setTotal(data?.length || 0);
        setLoading(false);
      });
  }, [user?.id]);

  if (loading) return <Skeleton className="h-32 w-full" />;
  if (total === 0) return <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>;

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-muted">
        {STATUS_CONFIG.map((s) => {
          const pct = ((counts[s.key] || 0) / total) * 100;
          if (pct === 0) return null;
          return <div key={s.key} className={`${s.color}`} style={{ width: `${pct}%` }} />;
        })}
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {STATUS_CONFIG.map((s) => {
          const count = counts[s.key] || 0;
          if (count === 0) return null;
          return (
            <div key={s.key} className="flex items-center gap-2 text-sm">
              <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
              <span className="flex-1 capitalize">{s.label}</span>
              <span className="font-semibold tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
