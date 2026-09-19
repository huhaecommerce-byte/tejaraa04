import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, XCircle, Clock, RotateCcw, AlertTriangle, Info, Loader2, Ban, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 10;

interface PaymentEvent {
  id: string;
  kind: string;
  status: string;
  amount_sar: number | null;
  error_message: string | null;
  created_at: string;
  metadata: any;
  session_id: string | null;
}

const STATUS_META: Record<
  string,
  { label: string; variant: any; icon: any; defaultReason: string; tone: "ok" | "warn" | "bad" | "muted" }
> = {
  succeeded: {
    label: "Succeeded",
    variant: "default",
    icon: CheckCircle2,
    tone: "ok",
    defaultReason: "Payment completed successfully.",
  },
  pending: {
    label: "Processing",
    variant: "secondary",
    icon: Loader2,
    tone: "warn",
    defaultReason: "Finalizing payment with the bank…",
  },
  initiated: {
    label: "Processing",
    variant: "secondary",
    icon: Loader2,
    tone: "warn",
    defaultReason: "Finalizing payment with the bank…",
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    icon: XCircle,
    tone: "bad",
    defaultReason:
      "Payment was declined by the card issuer. Please try a different card.",
  },
  cancelled: {
    label: "Cancelled",
    variant: "outline",
    icon: Ban,
    tone: "muted",
    defaultReason: "You closed the checkout before completing payment.",
  },
  expired: {
    label: "Expired",
    variant: "outline",
    icon: Clock,
    tone: "muted",
    defaultReason: "Checkout session expired before payment was completed.",
  },
  refunded: {
    label: "Refunded",
    variant: "secondary",
    icon: RotateCcw,
    tone: "muted",
    defaultReason: "Amount was refunded back to the original payment method.",
  },
  disputed: {
    label: "Disputed",
    variant: "destructive",
    icon: AlertTriangle,
    tone: "bad",
    defaultReason: "A dispute was opened on this charge.",
  },
};

const KIND_META: Record<string, { label: string; className: string }> = {
  wallet_topup: {
    label: "Wallet top-up",
    className: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  subscription: {
    label: "Subscription",
    className: "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  other: {
    label: "Payment",
    className: "border-border bg-muted text-muted-foreground",
  },
};

export function PaymentHistoryCard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    const load = async () => {
      const { data } = await (supabase.from("payment_events") as any)
        .select("id, kind, status, amount_sar, error_message, created_at, metadata, session_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (!mounted) return;
      setEvents((data as PaymentEvent[]) || []);
      setLoading(false);
    };

    const reconcile = async () => {
      try {
        await supabase.functions.invoke("reconcile-stale-payments", { body: {} });
      } catch (e) {
        console.warn("reconcile-stale-payments failed (non-fatal)", e);
      }
    };

    // Reconcile then load. Run a second pass shortly after to catch
    // checkouts that were just initiated when the page mounted.
    (async () => {
      await reconcile();
      if (mounted) await load();
      setTimeout(async () => {
        if (!mounted) return;
        await reconcile();
        if (mounted) await load();
      }, 1500);
    })();

    const channel = supabase
      .channel(`payment-events-${user.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "payment_events",
        filter: `user_id=eq.${user.id}`,
      }, () => load())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [user?.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          Payment activity
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Every payment attempt is shown with the outcome and reason —
                  whether it succeeded, was declined, expired, or you closed
                  the checkout before completing it.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && events.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No payment activity yet. Top-ups and subscriptions will appear here.
          </p>
        )}
        {(() => {
          const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
          const currentPage = Math.min(page, totalPages);
          const start = (currentPage - 1) * PAGE_SIZE;
          const pageItems = events.slice(start, start + PAGE_SIZE);

          return (
            <>
              {pageItems.map((e) => {
                const meta = STATUS_META[e.status] || STATUS_META.pending;
                const Icon = meta.icon;
                const isPending = e.status === "initiated" || e.status === "pending";
                const kindMeta = KIND_META[e.kind] || KIND_META.other;
                const reason = e.error_message?.trim() || meta.defaultReason;

                const iconClass =
                  isPending ? "text-amber-500 animate-spin"
                  : meta.tone === "ok"   ? "text-emerald-500"
                  : meta.tone === "bad"  ? "text-destructive"
                  : meta.tone === "warn" ? "text-amber-500"
                  : "text-muted-foreground";

                return (
                  <div key={e.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide ${kindMeta.className}`}>
                            {kindMeta.label}
                          </span>
                          {e.amount_sar != null && (
                            <span className="text-sm font-medium leading-none">
                              SAR {Number(e.amount_sar).toFixed(2)}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground leading-none">
                            {new Date(e.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 truncate ${meta.tone === "bad" ? "text-destructive" : "text-muted-foreground"}`}>
                          {reason}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                  </div>
                );
              })}

              {events.length > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Showing {start + 1}–{Math.min(start + PAGE_SIZE, events.length)} of {events.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </CardContent>
    </Card>
  );
}
