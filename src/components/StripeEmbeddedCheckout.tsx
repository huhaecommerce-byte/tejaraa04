import { Component, ErrorInfo, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

interface StripeEmbeddedCheckoutProps {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

function FallbackCard({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center">
      <p className="text-base font-medium text-foreground">Checkout is unavailable right now.</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <a href="/pricing" className="mt-4 inline-block text-sm text-primary underline">
        Back to pricing
      </a>
    </div>
  );
}

class StripeBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  state = { hasError: false, message: "" };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || "Something went wrong while loading Stripe." };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("StripeEmbeddedCheckout error:", error, info);
  }
  render() {
    if (this.state.hasError) return <FallbackCard message={this.state.message} />;
    return this.props.children;
  }
}

export function StripeEmbeddedCheckout({
  priceId,
  quantity,
  customerEmail,
  userId,
  returnUrl,
}: StripeEmbeddedCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Stable Stripe instance
  const stripePromise = useMemo(() => getStripe(), []);

  // Guard against double-invoke (StrictMode) and against duplicate sessions
  // for the same inputs. We key by the meaningful inputs.
  const inputKey = `${priceId}|${quantity ?? 1}|${customerEmail ?? ""}|${userId ?? ""}|${returnUrl ?? ""}`;
  const lastKeyRef = useRef<string | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (lastKeyRef.current === inputKey && (clientSecret || inFlightRef.current)) {
      // Already loaded or loading for these exact inputs — don't re-create.
      return;
    }
    lastKeyRef.current = inputKey;

    const loadCheckout = async () => {
      setIsLoading(true);
      setLoadError(null);
      setClientSecret(null);

      try {
        const environment = await getStripeEnvironment();
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: { priceId, quantity, customerEmail, userId, returnUrl, environment },
        });

        if (!isMounted) return;

        if (error || !data?.clientSecret) {
          setLoadError(data?.error || error?.message || "Failed to create checkout session");
          setIsLoading(false);
          return;
        }

        setClientSecret(data.clientSecret);
        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Failed to create checkout session";
        setLoadError(msg);
        setIsLoading(false);
      } finally {
        inFlightRef.current = null;
      }
    };

    inFlightRef.current = loadCheckout();

    return () => {
      isMounted = false;
    };
  }, [inputKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stable options object for the provider — must not be recreated on every render
  const options = useMemo(
    () => (clientSecret ? { clientSecret } : null),
    [clientSecret],
  );

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Preparing secure checkout…
      </div>
    );
  }

  if (loadError) {
    return <FallbackCard message={loadError} />;
  }

  if (!options) {
    return <FallbackCard message="Checkout session could not be created." />;
  }

  return (
    <StripeBoundary>
      {/* key on clientSecret guarantees a clean unmount/remount when it changes,
          preventing "multiple Embedded Checkout objects" errors. */}
      <div id="checkout" key={options.clientSecret}>
        <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </StripeBoundary>
  );
}
