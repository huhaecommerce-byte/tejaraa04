import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Counts the current-calendar-month rows in a table for the signed-in user.
 * Optionally sums a numeric column instead of counting rows (e.g. items_count).
 * Subscribes to realtime inserts/updates so the count stays fresh.
 */
export function useMonthlyUsage(
  table:
    | 'orders'
    | 'quote_requests'
    | 'sourcing_requests'
    | 'labelling_requests'
    | 'release_requests',
  options: {
    /** Filter rows by `type` column (e.g. 'bulk' / 'dropship' for orders). */
    typeFilter?: string;
    /** Sum this numeric column instead of counting rows. */
    sumColumn?: string;
  } = {},
) {
  const { user } = useAuth();
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setUsed(0);
      setLoading(false);
      return;
    }
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    if (options.sumColumn) {
      const { data } = await (supabase as any)
        .from(table)
        .select(`${options.sumColumn}, type, created_at`)
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth);
      let total = 0;
      (data ?? []).forEach((r: any) => {
        if (options.typeFilter && r.type !== options.typeFilter) return;
        total += Number(r[options.sumColumn!]) || 0;
      });
      setUsed(total);
    } else {
      let q: any = supabase
        .from(table)
        .select('*', { count: 'exact', head: !options.typeFilter })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth);
      if (options.typeFilter) q = q.eq('type', options.typeFilter);
      const { data, count } = await q;
      setUsed(options.typeFilter ? (data ?? []).length : count ?? 0);
    }
    setLoading(false);
  }, [user?.id, table, options.typeFilter, options.sumColumn]);

  useEffect(() => {
    refresh();
    if (!user?.id) return;
    const channel = supabase
      .channel(`usage-${table}-${user.id}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${user.id}` },
        refresh,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, table, refresh]);

  return { used, loading, refresh };
}
