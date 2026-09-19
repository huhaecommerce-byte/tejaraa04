import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Sums total units (quantity) across all of the current user's orders for the
 * current calendar month, looking inside the orders.products jsonb array.
 * Used to enforce the `total_units_monthly` plan limit.
 */
export function useMonthlyUnits() {
  const { user } = useAuth();
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setUsed(0);
      setLoading(false);
      return;
    }
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).toISOString();
    const { data } = await supabase
      .from('orders')
      .select('products')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth);
    let total = 0;
    (data ?? []).forEach((row: any) => {
      const items = Array.isArray(row.products) ? row.products : [];
      items.forEach((it: any) => {
        total += Number(it?.quantity) || 0;
      });
    });
    setUsed(total);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
    if (!user?.id) return;
    const channel = supabase
      .channel(`units-orders-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        refresh,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refresh]);

  return { used, loading, refresh };
}
