export interface Subscription {
  id: string;
  status: string;
  product_id: string;
  price_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  environment: string;
}

/**
 * Subscriptions were removed. Every user has full access; this stub keeps the
 * old API so any remaining callers stay happy.
 */
export function useSubscription() {
  return {
    subscription: null as Subscription | null,
    isActive: true,
    isGrowth: true,
    isLoading: false,
    refetch: () => {},
  };
}
