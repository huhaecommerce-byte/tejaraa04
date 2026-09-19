import { Component, ErrorInfo, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export interface TopupSuccessPayload {
  sessionId: string;
  amountSar: number;
  balanceAfter: number | null;
  alreadyCredited: boolean;
}

interface Props {
  amount: number;
  onBack: () => void;
  onSuccess: (payload: TopupSuccessPayload) => void;
  onVerifyingChange?: (verifying: boolean) => void;
}

interface CheckoutSessionResult {
  clientSecret: string;
  sessionId: string;
}

class StripeBoundary extends Component<{ children: ReactNode; onError: (msg: string) => void }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("WalletTopupCheckout error:", error, info);
    this.props.onError(error?.message || "Stripe checkout failed to load");
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function WalletTopupCheckout({ amount, onBack, onSuccess, onVerifyingChange }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const stripePromise = useMemo(() => getStripe(), []);
  const checkoutRequestRef = useRef<Promise<CheckoutSessionResult> | null>(null);
  const verifiedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const amountRef = useRef(amount);
  amountRef.current = amount;

  useEffect(() => {
    onVerifyingChange?.(verifying);
  }, [verifying, onVerifyingChange]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        if (!checkoutRequestRef.current) {
          checkoutRequestRef.current = (async () => {
            const returnUrl = `${window.location.origin}/wallet/topup/return?session_id={CHECKOUT_SESSION_ID}`;
            const { data, error } = await supabase.functions.invoke("wallet-topup-checkout", {
              body: { amount, environment: "live", returnUrl },
            });

            if (error || !data?.clientSecret || !data?.sessionId) {
              throw new Error((data as { error?: string } | null)?.error || error?.message || "Could not start checkout");
            }

            return {
              clientSecret: data.clientSecret as string,
              sessionId: data.sessionId as string,
            };
          })();
        }

        const data = await checkoutRequestRef.current;
        if (!mounted) return;
        setClientSecret(data.clientSecret);
        setSessionId(data.sessionId);
        sessionIdRef.current = data.sessionId;
      } catch (err) {
        if (!mounted) return;
        setLoadError(err instanceof Error ? err.message : "Could not start checkout");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [amount]);

  // Stripe fires this exactly once when THIS embedded session completes.
  const handleStripeComplete = async () => {
    const sid = sessionIdRef.current;
    if (verifiedRef.current || !sid) return;
    verifiedRef.current = true;
    setVerifying(true);

    // Poll verify-checkout-session — it credits idempotently keyed by session id.
    const maxAttempts = 8;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke("verify-checkout-session", {
          body: { sessionId: sid, environment: "live" },
        });
        if (error) throw error;

        if (data?.status === "active" && data?.kind === "wallet_topup") {
          setVerifying(false);
          onSuccessRef.current({
            sessionId: sid,
            amountSar: Number(data.amountSar) || amountRef.current,
            balanceAfter: data.balanceAfter ?? null,
            alreadyCredited: !!data.alreadyCredited,
          });
          return;
        }
      } catch (err) {
        console.error("verify-checkout-session attempt failed:", err);
      }
      await new Promise((r) => setTimeout(r, 1500));
    }

    setVerifying(false);
    setLoadError("Payment received but confirmation timed out. Your wallet will update shortly.");
  };

  const options = useMemo(
    () => (clientSecret ? { clientSecret, onComplete: handleStripeComplete } : null),
    // Stable across renders; latest closure values come from refs above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clientSecret],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={verifying}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Change amount
        </Button>
        <p className="text-sm text-muted-foreground">
          Paying <span className="font-semibold text-foreground">SAR {amount.toFixed(2)}</span>
        </p>
      </div>

      {isLoading && (
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card to-muted/30 p-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Preparing secure checkout</p>
              <p className="text-xs text-muted-foreground">Connecting to Stripe — this only takes a moment.</p>
            </div>
            <div className="mt-2 w-full max-w-xs space-y-2">
              <div className="h-3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
              <div className="h-3 w-4/6 animate-pulse rounded bg-muted" />
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              256-bit encrypted · PCI-DSS compliant
            </div>
          </div>
        </div>
      )}

      {loadError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium text-destructive">{loadError}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onBack}>Back</Button>
        </div>
      )}

      {!isLoading && !loadError && options && (
        <StripeBoundary onError={(msg) => setLoadError(msg)}>
          <div id="wallet-checkout" key={options.clientSecret} className="rounded-lg overflow-hidden border border-border">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
          {verifying && (
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-card p-4 mt-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Confirming payment</p>
                  <p className="text-xs text-muted-foreground">Don't close this window — crediting your wallet…</p>
                </div>
              </div>
            </div>
          )}
        </StripeBoundary>
      )}
    </div>
  );
}
