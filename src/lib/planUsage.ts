// Shared helpers for plan usage display (admin overview + buyer self-view).

export type UsageStatus = 'ok' | 'near' | 'over';

export interface UsageEntry {
  key: string;
  label: string;
  used: number;
  limit: number; // Infinity for unlimited
  pct: number; // 0-100+; capped only for display
  status: UsageStatus;
}

/** Monthly quota limit_keys → user-friendly label + which table/aggregation to use. */
export const MONTHLY_KEYS = [
  { key: 'dropshipping_orders', label: 'Dropship orders', table: 'orders', filter: 'dropship' as const },
  { key: 'bulk_orders_monthly', label: 'Bulk orders', table: 'orders', filter: 'bulk' as const },
  { key: 'total_units_monthly', label: 'Total units ordered', table: 'orders', sumColumn: 'quantity' as const },
  { key: 'quote_requests_monthly', label: 'Quote requests', table: 'quote_requests' },
  { key: 'sourcing_requests_monthly', label: 'Sourcing requests', table: 'sourcing_requests' },
  { key: 'labelling_units_monthly', label: 'Labelling units', table: 'labelling_requests', sumColumn: 'items_count' as const },
  { key: 'release_requests_monthly', label: 'Release requests', table: 'release_requests' },
] as const;

/** Total caps (lifetime / current count, not reset monthly). */
export const TOTAL_KEYS = [
  { key: 'favourites_max', label: 'Favourites', table: 'favourites' },
  { key: 'addresses_max', label: 'Shipping addresses', table: 'shipping_addresses' },
  { key: 'store_integrations_max', label: 'Connected stores', table: 'store_integrations' },
  { key: 'team_seats', label: 'Team members', table: 'team_members', column: 'owner_id' as const },
  { key: 'templates_max', label: 'Order templates', table: 'order_templates' },
] as const;

export function usageStatus(pct: number): UsageStatus {
  if (pct >= 100) return 'over';
  if (pct >= 80) return 'near';
  return 'ok';
}

export function usageColorClass(status: UsageStatus): string {
  switch (status) {
    case 'over': return 'text-destructive';
    case 'near': return 'text-amber-500 dark:text-amber-400';
    default: return 'text-emerald-500 dark:text-emerald-400';
  }
}

export function usageBarClass(status: UsageStatus): string {
  switch (status) {
    case 'over': return 'bg-destructive';
    case 'near': return 'bg-amber-500';
    default: return 'bg-emerald-500';
  }
}

export function usageBadgeClass(status: UsageStatus): string {
  switch (status) {
    case 'over': return 'bg-destructive/15 text-destructive border-destructive/30';
    case 'near': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    default: return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  }
}

export function computePct(used: number, limit: number): number {
  if (!isFinite(limit)) return 0;
  if (limit <= 0) return used > 0 ? 100 : 0;
  return Math.round((used / limit) * 100);
}

export function formatLimit(limit: number): string {
  if (!isFinite(limit)) return '∞';
  return limit.toLocaleString();
}
