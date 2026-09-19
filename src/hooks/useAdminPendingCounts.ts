import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AdminPendingCounts = {
  orders: number;
  sourcing: number;
  tickets: number;
};

const ZERO: AdminPendingCounts = { orders: 0, sourcing: 0, tickets: 0 };

// Module-level subscribers so any component can trigger a refresh
const refreshSubscribers = new Set<() => void>();

export function triggerAdminPendingCountsRefresh() {
  refreshSubscribers.forEach((fn) => {
    try { fn(); } catch { /* noop */ }
  });
}

/**
 * Returns a stable callback that triggers all mounted useAdminPendingCounts hooks
 * to refetch immediately. Safe to call from any admin write path.
 */
export function useAdminPendingCountsRefresh() {
  return useCallback(() => triggerAdminPendingCountsRefresh(), []);
}

/** Count parents whose latest request_message is NOT from admin (or has no messages). */
async function countRequestsAwaitingAdmin(
  parentIds: string[],
  requestType: 'sourcing' | 'quote',
): Promise<number> {
  if (parentIds.length === 0) return 0;
  const { data, error } = await supabase
    .from('request_messages')
    .select('request_id, is_admin, created_at')
    .eq('request_type', requestType)
    .in('request_id', parentIds)
    .order('created_at', { ascending: false });
  if (error || !data) return parentIds.length;

  const lastByParent = new Map<string, boolean>();
  for (const row of data) {
    if (!lastByParent.has(row.request_id)) lastByParent.set(row.request_id, row.is_admin);
  }
  let awaiting = 0;
  for (const pid of parentIds) {
    const lastIsAdmin = lastByParent.get(pid);
    if (lastIsAdmin === undefined || lastIsAdmin === false) awaiting += 1;
  }
  return awaiting;
}

/** Count tickets whose latest ticket_message is NOT from admin (or has no messages). */
async function countTicketsAwaitingAdmin(ticketIds: string[]): Promise<number> {
  if (ticketIds.length === 0) return 0;
  const { data, error } = await supabase
    .from('ticket_messages')
    .select('ticket_id, is_admin, created_at')
    .in('ticket_id', ticketIds)
    .order('created_at', { ascending: false });
  if (error || !data) return ticketIds.length;

  const lastByParent = new Map<string, boolean>();
  for (const row of data) {
    if (!lastByParent.has(row.ticket_id)) lastByParent.set(row.ticket_id, row.is_admin);
  }
  let awaiting = 0;
  for (const tid of ticketIds) {
    const lastIsAdmin = lastByParent.get(tid);
    if (lastIsAdmin === undefined || lastIsAdmin === false) awaiting += 1;
  }
  return awaiting;
}

export function useAdminPendingCounts(): AdminPendingCounts {
  const { user } = useAuth();
  const [counts, setCounts] = useState<AdminPendingCounts>(ZERO);
  const isAdmin = user?.role === 'admin';
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setCounts(ZERO);
      return;
    }

    let cancelled = false;

    const fetchAll = async () => {
      try {
        const [ordersRes, sourcingIdsRes, quoteIdsRes, ticketIdsRes] = await Promise.all([
          supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending'),
          supabase.from('sourcing_requests').select('id').eq('status', 'pending'),
          supabase.from('quote_requests').select('id').eq('status', 'pending'),
          supabase.from('tickets').select('id').eq('status', 'open'),
        ]);

        const sourcingIds = (sourcingIdsRes.data ?? []).map((r) => r.id);
        const quoteIds = (quoteIdsRes.data ?? []).map((r) => r.id);
        const ticketIds = (ticketIdsRes.data ?? []).map((r) => r.id);

        const [sourcingAwaiting, quoteAwaiting, ticketsAwaiting] = await Promise.all([
          countRequestsAwaitingAdmin(sourcingIds, 'sourcing'),
          countRequestsAwaitingAdmin(quoteIds, 'quote'),
          countTicketsAwaitingAdmin(ticketIds),
        ]);

        if (cancelled) return;
        setCounts({
          orders: ordersRes.count ?? 0,
          sourcing: sourcingAwaiting + quoteAwaiting,
          tickets: ticketsAwaiting,
        });
      } catch {
        /* noop */
      }
    };

    const scheduleFetch = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchAll, 500);
    };

    fetchAll();
    refreshSubscribers.add(scheduleFetch);

    const channel = supabase
      .channel('admin-pending-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, scheduleFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sourcing_requests' }, scheduleFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quote_requests' }, scheduleFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, scheduleFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'request_messages' }, scheduleFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_messages' }, scheduleFetch)
      .subscribe();

    const poll = setInterval(fetchAll, 60_000);

    return () => {
      cancelled = true;
      refreshSubscribers.delete(scheduleFetch);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  return counts;
}
