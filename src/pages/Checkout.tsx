import { SellerPublicShell } from '@/components/seller/shell/SellerPublicShell';
import { Component, ErrorInfo, ReactNode, useMemo } from "react";
import { useSearchParams, Navigate } from "@/lib/router-compat";
import { SEO } from "@/components/SEO";

import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { useAuth } from "@/contexts/AuthContext";

const PRICE_LABELS: Record<string, { plan: string; cycle: string }> = {
  growth_monthly: { plan: "Growth", cycle: "Monthly" },
  growth_yearly: { plan: "Growth", cycle: "Annual" },
};

class CheckoutErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Checkout page error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-base font-medium text-foreground">
            We couldn't load the secure checkout.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Please refresh the page, or contact support if it keeps happening.
          </p>
          <a href="/pricing" className="mt-4 inline-block text-sm text-primary underline">
            Back to pricing
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const priceId = searchParams.get("price");

  // Stable return URL so the embedded checkout doesn't re-init on re-render
  const returnUrl = useMemo(
    () =>
      typeof window === 'undefined'
        ? '/checkout/return?session_id={CHECKOUT_SESSION_ID}'
        : `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    [],
  );

  if (!priceId) {
    return <Navigate to="/pricing" replace />;
  }

  const label = PRICE_LABELS[priceId] ?? { plan: "Plan", cycle: "" };

  return (
    <SellerPublicShell>
      <SEO
        title={`Checkout — ${label.plan} ${label.cycle} — Product sourcing, labelling fulfillment and dropshipping for saudi arabia`}
        description="Complete your Tejaraa subscription. Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery."
        path="/checkout"
        noindex
      />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-2xl font-bold text-center mb-2">
          Complete your {label.plan} subscription
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          {label.cycle ? `${label.cycle} billing — ` : ""}Secure checkout powered by Stripe.
        </p>
        <CheckoutErrorBoundary>
          {authLoading ? (
            <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Preparing secure checkout…
            </div>
          ) : (
            <StripeEmbeddedCheckout
              priceId={priceId}
              customerEmail={user?.email || undefined}
              userId={user?.id || ""}
              returnUrl={returnUrl}
            />
          )}
        </CheckoutErrorBoundary>
      </main>
    </SellerPublicShell>
  );
}
