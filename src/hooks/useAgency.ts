import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AgencyBalance {
  lifetime: number;
  pending: number;
  available: number;
  requested: number;
  paid: number;
  clients: number;
  orders: number;
  this_month: number;
}

export interface AgencyDashboard {
  ok: boolean;
  error?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  code?: string;
  company?: string;
  rate?: number;
  min_payout?: number;
  balance?: AgencyBalance;
}

const EMPTY_BALANCE: AgencyBalance = {
  lifetime: 0, pending: 0, available: 0, requested: 0,
  paid: 0, clients: 0, orders: 0, this_month: 0,
};

export function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function sar(v: unknown): string {
  return `SAR ${num(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Loads the signed-in user's agency profile summary (status, code, balance). */
export function useAgency() {
  const [data, setData] = useState<AgencyDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.rpc('agency_dashboard' as never);
      if (error) throw error;
      const parsed = (result ?? { ok: false, error: 'not_an_agency' }) as AgencyDashboard;
      setData({ ...parsed, balance: { ...EMPTY_BALANCE, ...(parsed.balance || {}) } });
    } catch {
      setData({ ok: false, error: 'not_an_agency' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  return { agency: data, isLoading, reload };
}

export function inviteLink(code: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tejaraa.com';
  return `${origin}/selling/signup?ref=${code}`;
}
