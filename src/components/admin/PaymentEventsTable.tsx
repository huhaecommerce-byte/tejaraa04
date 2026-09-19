import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, Search, AlertTriangle } from "lucide-react";

interface Row {
  id: string;
  user_id: string | null;
  kind: string;
  status: string;
  amount_sar: number | null;
  session_id: string | null;
  subscription_id: string | null;
  payment_intent_id: string | null;
  error_message: string | null;
  metadata: any;
  environment: string;
  created_at: string;
}

const STATUS_VARIANTS: Record<string, any> = {
  succeeded: "default",
  initiated: "secondary",
  pending: "secondary",
  failed: "destructive",
  cancelled: "outline",
  expired: "outline",
  refunded: "secondary",
  disputed: "destructive",
};

const STATUSES = ["all", "succeeded", "initiated", "pending", "failed", "cancelled", "expired", "refunded", "disputed"];
const KINDS = ["all", "subscription", "wallet_topup", "other"];

export function PaymentEventsTable() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [search, setSearch] = useState(initialQ);
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  const load = async () => {
    setLoading(true);
    let q: any = (supabase.from("payment_events") as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (kindFilter !== "all") q = q.eq("kind", kindFilter);
    const { data } = await q;
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-payment-events")
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_events" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, kindFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) =>
      [r.session_id, r.subscription_id, r.payment_intent_id, r.user_id, r.error_message]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, search]);

  // Keep ?q in URL in sync with search input (so deep links survive reloads).
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (search.trim()) next.set("q", search.trim());
    else next.delete("q");
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Scroll the deep-linked row into view once it renders.
  useEffect(() => {
    if (!initialQ || loading) return;
    const t = setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => clearTimeout(t);
  }, [initialQ, loading, filtered.length]);

  const stats = useMemo(() => {
    const last24h = rows.filter((r) => Date.now() - new Date(r.created_at).getTime() < 86_400_000);
    const counts = { succeeded: 0, failed: 0, disputed: 0, initiated: 0 };
    last24h.forEach((r) => {
      if (r.status in counts) (counts as any)[r.status]++;
    });
    const total = last24h.filter((r) => r.status === "succeeded")
      .reduce((s, r) => s + Number(r.amount_sar || 0), 0);
    return { ...counts, total };
  }, [rows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
          <span>Payment events</span>
          <Button size="sm" variant="outline" onClick={load} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Last 24h Revenue</p>
            <p className="text-lg font-semibold">SAR {stats.total.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Succeeded</p>
            <p className="text-lg font-semibold text-emerald-600">{stats.succeeded}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className="text-lg font-semibold text-destructive">{stats.failed}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Disputed</p>
            <p className={`text-lg font-semibold ${stats.disputed > 0 ? "text-destructive flex items-center gap-1" : ""}`}>
              {stats.disputed > 0 && <AlertTriangle className="h-4 w-4" />}
              {stats.disputed}
            </p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Pending starts</p>
            <p className="text-lg font-semibold">{stats.initiated}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search session / sub / intent / user / error"
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={kindFilter} onValueChange={setKindFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => <SelectItem key={k} value={k} className="capitalize">{k.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Kind</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium text-right">Amount</th>
                <th className="px-3 py-2 font-medium">User</th>
                <th className="px-3 py-2 font-medium">Reference</th>
                <th className="px-3 py-2 font-medium">Env</th>
              </tr>
            </thead>
            <tbody>
              {loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No payment events.</td></tr>
              )}
              {filtered.map((r) => {
                const isMatch = !!(initialQ && (
                  r.session_id === initialQ ||
                  r.payment_intent_id === initialQ ||
                  r.subscription_id === initialQ
                ));
                return (
                <tr
                  key={r.id}
                  ref={isMatch ? highlightRef : undefined}
                  className={`border-t border-border hover:bg-muted/20 ${isMatch ? "bg-primary/5 ring-1 ring-primary/40" : ""}`}
                >
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 capitalize">{r.kind.replace("_", " ")}</td>
                  <td className="px-3 py-2">
                    <Badge variant={STATUS_VARIANTS[r.status] || "outline"} className="capitalize">{r.status}</Badge>
                    {r.error_message && (
                      <p className="text-xs text-destructive mt-0.5 max-w-xs truncate" title={r.error_message}>
                        {r.error_message}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.amount_sar != null ? `SAR ${Number(r.amount_sar).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.user_id ? r.user_id.slice(0, 8) : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs max-w-[240px] truncate" title={r.session_id || r.subscription_id || r.payment_intent_id || ""}>
                    {r.session_id || r.subscription_id || r.payment_intent_id || "—"}
                  </td>
                  <td className="px-3 py-2 capitalize text-xs">{r.environment}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
