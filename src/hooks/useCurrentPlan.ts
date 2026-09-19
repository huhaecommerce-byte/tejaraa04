import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlanLimits {
  [key: string]: string | number | 'unlimited';
}

export interface CurrentPlan {
  planId: string | null;
  planName: string;
  planPrice: string;
  limits: PlanLimits;
  isLoading: boolean;
  rawLimits: Array<{ limit_key: string; limit_value: string; label: string }>;
  /** Raw stored value for a limit_key ("unlimited" when nothing is configured). */
  getLimit: (key: string) => string;
  /** True when the feature has no cap configured. */
  isUnlimited: (key: string) => boolean;
  /** True unless the feature is explicitly disabled (no / false / 0). */
  hasFeature: (key: string) => boolean;
  /** Numeric cap; Infinity when unlimited, 0 when disabled. */
  numericLimit: (key: string) => number;
}

const UNLIMITED = 'unlimited';

const isUnlimitedValue = (raw: string) => {
  const v = (raw ?? '').trim().toLowerCase();
  return v === '' || v === 'unlimited' || v === '∞' || v === 'yes' || v === 'true';
};

const isDisabledValue = (raw: string) => {
  const v = (raw ?? '').trim().toLowerCase();
  return v === 'no' || v === 'false' || v === '0' || v === 'none' || v === 'disabled';
};

/**
 * Resolves each feature/limit for the signed-in customer:
 * per-customer override (customer_usage_limits) → platform default
 * (usage_limit_defaults) → unlimited when nothing is configured.
 * Mirrors the SQL function public.get_user_plan_limit used by DB triggers.
 */
export function useCurrentPlan(): CurrentPlan {
  const { data, isLoading } = useQuery({
    queryKey: ['plan-limits'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? null;

      const [defaultsRes, overridesRes] = await Promise.all([
        (supabase as any).from('usage_limit_defaults').select('limit_key, label, limit_value'),
        uid
          ? (supabase as any)
              .from('customer_usage_limits')
              .select('limit_key, limit_value')
              .eq('user_id', uid)
          : Promise.resolve({ data: [] }),
      ]);

      const labels: Record<string, string> = {};
      const merged: Record<string, string> = {};
      for (const r of (defaultsRes?.data ?? []) as any[]) {
        merged[r.limit_key] = r.limit_value ?? UNLIMITED;
        labels[r.limit_key] = r.label ?? r.limit_key;
      }
      for (const r of (overridesRes?.data ?? []) as any[]) {
        merged[r.limit_key] = r.limit_value ?? UNLIMITED;
      }
      return { merged, labels };
    },
  });

  const merged = data?.merged ?? {};
  const labels = data?.labels ?? {};

  const getLimit = useCallback(
    (key: string) => {
      const v = merged[key];
      return v === undefined || v === null || v === '' ? UNLIMITED : String(v);
    },
    [merged],
  );

  const isUnlimited = useCallback((key: string) => isUnlimitedValue(getLimit(key)), [getLimit]);

  const hasFeature = useCallback((key: string) => !isDisabledValue(getLimit(key)), [getLimit]);

  const numericLimit = useCallback(
    (key: string) => {
      const raw = getLimit(key);
      if (isUnlimitedValue(raw)) return Infinity;
      if (isDisabledValue(raw)) return 0;
      const n = Number(String(raw).replace(/[^0-9.\-]/g, ''));
      return Number.isFinite(n) ? n : Infinity;
    },
    [getLimit],
  );

  const rawLimits = useMemo(
    () =>
      Object.entries(merged).map(([limit_key, limit_value]) => ({
        limit_key,
        limit_value: String(limit_value),
        label: labels[limit_key] ?? limit_key,
      })),
    [merged, labels],
  );

  return {
    planId: null,
    planName: 'Full access',
    planPrice: 'Free',
    limits: merged as PlanLimits,
    isLoading,
    rawLimits,
    getLimit,
    isUnlimited,
    hasFeature,
    numericLimit,
  };
}
