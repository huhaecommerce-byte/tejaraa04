import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link, useNavigate } from "@/lib/router-compat";
import {
  CheckCircle2, ArrowRight, Loader2, AlertTriangle, Clock, Copy, Check,
  Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, RefreshCw, Shield, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import { toast } from "sonner";

type Status = "verifying" | "succeeded" | "pending" | "failed" | "no_session";

type Tx = {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  stripe_session_id: string | null;
  created_at: string;
};

type ReceiptData = {
  amountSar: number | null;
  balanceAfter: number | null;
  paymentIntentId: string | null;
  environment: string | null;
  alreadyCredited: boolean;
};

const fmtSar = (n: number | null | undefined) =>
  n == null || Number.isNaN(Number(n)) ? "—" : `SAR ${Number(n).toFixed(2)}`;

const relTime = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
};

function CopyableId({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const short = value.length > 22 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value;
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
      title={`Copy ${label}`}
    >
      <span>{short}</span>
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export default function WalletTopupReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const { isAdmin } = useStaffPermissions();

  const [status, setStatus] = useState<Status>(sessionId ? "verifying" : "no_session");
  const [receipt, setReceipt] = useState<ReceiptData>({
    amountSar: null, balanceAfter: null, paymentIntentId: null,
    environment: null, alreadyCredited: false,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const verifyRanRef = useRef(false);
  const fallbackRanRef = useRef(false);

  // Bootstrap: fetch user, verify session once, load recent transactions.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      setUserId(user?.id ?? null);

      // Initial transaction list
      if (user?.id) {
        const { data: list } = await supabase
          .from("wallet_transactions")
          .select("id,type,amount,balance_after,description,stripe_session_id,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);
        if (!cancelled && list) setTxs(list as Tx[]);
      }

      if (!sessionId || verifyRanRef.current) return;
      verifyRanRef.current = true;
      await verifyOnce();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const verifyOnce = async () => {
    if (!sessionId) return;
    try {
      const { data, error } = await supabase.functions.invoke("verify-checkout-session", {
        body: { sessionId, environment: "sandbox" },
      });
      if (error) {
        console.error("verify-checkout-session error:", error);
        return;
      }
      if (data?.status === "active" && data?.kind === "wallet_topup") {
        const amount = Number(data.amountSar) || null;
        setReceipt({
          amountSar: amount,
          balanceAfter: data.balanceAfter != null ? Number(data.balanceAfter) : null,
          paymentIntentId: data.paymentIntentId ?? null,
          environment: data.environment ?? "sandbox",
          alreadyCredited: !!data.alreadyCredited,
        });
        setStatus("succeeded");
        if (!data.alreadyCredited && amount) {
          toast.success(`SAR ${amount.toFixed(2)} added to your wallet`);
        }
      } else if (data?.status === "failed") {
        setStatus("failed");
        setErrorMsg(data?.error ?? "Payment was not completed.");
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  // Realtime: payment_events for this session, and wallet_transactions for the user.
  useEffect(() => {
    if (!sessionId && !userId) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    if (sessionId) {
      const peCh = supabase
        .channel(`pe-${sessionId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "payment_events", filter: `session_id=eq.${sessionId}` },
          (payload: any) => {
            const row = payload.new ?? payload.old;
            if (!row) return;
            if (row.status === "succeeded" || row.status === "active") {
              setReceipt((r) => ({
                ...r,
                paymentIntentId: row.payment_intent_id ?? r.paymentIntentId,
                amountSar: r.amountSar ?? (row.amount_sar != null ? Number(row.amount_sar) : null),
                environment: row.environment ?? r.environment,
              }));
              setStatus("succeeded");
            } else if (row.status === "failed") {
              setStatus("failed");
              setErrorMsg(row.error_message ?? "Payment was not completed.");
            } else if (row.status === "pending" || row.status === "processing") {
              setStatus((s) => (s === "succeeded" ? s : "pending"));
            }
          },
        )
        .subscribe();
      channels.push(peCh);
    }

    if (userId) {
      const wtCh = supabase
        .channel(`wt-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "wallet_transactions", filter: `user_id=eq.${userId}` },
          (payload: any) => {
            const row = payload.new as Tx | undefined;
            if (!row) return;
            setTxs((prev) => {
              const without = prev.filter((t) => t.id !== row.id);
              return [row, ...without].slice(0, 10);
            });
            if (row.stripe_session_id && row.stripe_session_id === sessionId) {
              setReceipt((r) => ({
                ...r,
                amountSar: Number(row.amount),
                balanceAfter: Number(row.balance_after),
              }));
              setStatus("succeeded");
            }
          },
        )
        .subscribe();
      channels.push(wtCh);
    }

    return () => {
      channels.forEach((c) => supabase.removeChannel(c));
    };
  }, [sessionId, userId]);

  // Safety re-verify after 8s if still verifying (covers edge cases where realtime missed).
  useEffect(() => {
    if (!sessionId || status !== "verifying" || fallbackRanRef.current) return;
    const t = setTimeout(() => {
      fallbackRanRef.current = true;
      verifyOnce().then(() => {
        setStatus((s) => (s === "verifying" ? "pending" : s));
      });
    }, 8000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, status]);

  const matchedTx = useMemo(
    () => txs.find((t) => t.stripe_session_id && t.stripe_session_id === sessionId) ?? null,
    [txs, sessionId],
  );

  const headerCard = (() => {
    if (status === "no_session") {
      return {
        Icon: AlertTriangle, tone: "muted",
        title: "No checkout session", desc: "We couldn't find a checkout session in this URL.",
      };
    }
    if (status === "verifying") {
      return {
        Icon: Loader2, tone: "primary", spin: true,
        title: "Confirming your payment with Stripe…",
        desc: "Hang tight — this usually takes a few seconds.",
      };
    }
    if (status === "succeeded") {
      return {
        Icon: CheckCircle2, tone: "success",
        title: "Payment successful",
        desc: receipt.amountSar
          ? `${fmtSar(receipt.amountSar)} added to your wallet.`
          : "Your wallet has been credited.",
      };
    }
    if (status === "pending") {
      return {
        Icon: Clock, tone: "warning",
        title: "Awaiting confirmation from Stripe",
        desc: "Your payment is taking a little longer than usual to clear. We'll credit your wallet automatically once it does.",
      };
    }
    return {
      Icon: AlertTriangle, tone: "destructive",
      title: "We couldn't verify your payment",
      desc: errorMsg ?? "Something went wrong. If you were charged, please contact support.",
    };
  })();

  const toneClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-500",
    warning: "bg-amber-500/10 text-amber-500",
    destructive: "bg-rose-500/10 text-rose-500",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <div className="min-h-screen px-4 py-10 md:py-16">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Status header */}
        <div className="aux-card aux-card-pad">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${toneClasses[headerCard.tone]}`}>
              <headerCard.Icon className={`h-7 w-7 ${(headerCard as any).spin ? "animate-spin" : ""}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">{headerCard.title}</h1>
                {receipt.environment && status === "succeeded" && (
                  <Badge variant="outline" className="uppercase text-xs">
                    {receipt.environment === "live" ? "Live" : "Test"}
                  </Badge>
                )}
                {receipt.alreadyCredited && status === "succeeded" && (
                  <Badge variant="secondary" className="text-xs">Already credited</Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">{headerCard.desc}</p>
            </div>
            <div className="flex gap-2">
              <Link to="/dropshipping/billing?tab=wallet">
                <Button variant="outline" className="rounded-full gap-2">
                  <WalletIcon className="h-4 w-4" /> Back to Wallet
                </Button>
              </Link>
              {status === "succeeded" && (
                <Link to="/dropshipping/billing?tab=wallet">
                  <Button className="rounded-full gap-2">
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              {(status === "pending" || status === "failed") && (
                <Button
                  variant="secondary"
                  className="rounded-full gap-2"
                  onClick={() => { fallbackRanRef.current = false; setStatus("verifying"); verifyOnce(); }}
                >
                  <RefreshCw className="h-4 w-4" /> Check again
                </Button>
              )}
            </div>
          </div>

          {isAdmin && (sessionId || matchedTx) && (
            <div className="mt-4 pt-4 border-t border-border/60 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Shield className="h-3.5 w-3.5" /> Admin
              </span>
              {sessionId && (
                <Link to={`/admin/internal-hub?tab=payments&q=${encodeURIComponent(sessionId)}`}>
                  <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs">
                    Payment event <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              )}
              {matchedTx && userId && (
                <Link to={`/admin/customers/${userId}?tx=${matchedTx.id}`}>
                  <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs">
                    Wallet ledger row <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              )}
              {receipt.paymentIntentId && (
                <Link to={`/admin/internal-hub?tab=payments&q=${encodeURIComponent(receipt.paymentIntentId)}`}>
                  <Button size="sm" variant="ghost" className="rounded-full gap-1.5 text-xs">
                    Payment intent <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Receipt details */}
          <div className="aux-card aux-card-pad">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Receipt
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="font-semibold text-base">{fmtSar(receipt.amountSar ?? matchedTx?.amount)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">New balance</dt>
                <dd className="font-semibold">{fmtSar(receipt.balanceAfter ?? matchedTx?.balance_after)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  {status === "succeeded" && <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20">Succeeded</Badge>}
                  {status === "verifying" && <Badge variant="outline">Verifying…</Badge>}
                  {status === "pending" && <Badge className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/20">Pending</Badge>}
                  {status === "failed" && <Badge variant="destructive">Failed</Badge>}
                  {status === "no_session" && <Badge variant="outline">—</Badge>}
                </dd>
              </div>
              <div className="border-t border-border/60 pt-3 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Session</dt>
                  <dd>{sessionId ? <CopyableId value={sessionId} label="session id" /> : <span className="text-xs text-muted-foreground">—</span>}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Payment intent</dt>
                  <dd>{receipt.paymentIntentId ? <CopyableId value={receipt.paymentIntentId} label="payment intent" /> : <span className="text-xs text-muted-foreground">—</span>}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">When</dt>
                  <dd className="text-xs text-muted-foreground">
                    {matchedTx ? new Date(matchedTx.created_at).toLocaleString() : "—"}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Recent activity */}
          <div className="aux-card aux-card-pad">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Recent activity
              </h2>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Live
              </span>
            </div>
            {txs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No wallet activity yet.</p>
            ) : (
              <ul className="space-y-2">
                {txs.map((t) => {
                  const isCredit = Number(t.amount) > 0;
                  const isMatch = t.stripe_session_id && t.stripe_session_id === sessionId;
                  return (
                    <li
                      key={t.id}
                      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors ${
                        isMatch ? "bg-primary/5 ring-1 ring-primary/30" : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isCredit ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                        }`}>
                          {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {t.description || (isCredit ? "Top-up" : "Payment")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {relTime(t.created_at)} · {t.type}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-semibold ${isCredit ? "text-emerald-500" : "text-rose-500"}`}>
                          {isCredit ? "+" : ""}{fmtSar(Number(t.amount))}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          bal {fmtSar(Number(t.balance_after))}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {status === "no_session" && (
          <div className="text-center">
            <Button variant="outline" className="rounded-full" onClick={() => navigate("/dropshipping/billing?tab=wallet")}>
              Go to Wallet
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
