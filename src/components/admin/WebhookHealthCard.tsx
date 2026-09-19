import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Webhook, CheckCircle2, XCircle, RefreshCw, Copy, AlertTriangle } from "lucide-react";

interface WebhookEvent {
  id: string;
  event_id: string;
  event_type: string;
  environment: string;
  payload_summary: any;
  received_at: string;
}

const WEBHOOK_URL_LIVE =
  typeof window === "undefined" ? "" : `${window.location.origin}/api/public/payments-webhook?env=live`;

function timeAgo(iso: string) {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

export default function WebhookHealthCard() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ reachable: boolean; status?: number; error?: string; checked_at: string } | null>(null);

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from("webhook_events")
      .select("id,event_id,event_type,environment,payload_summary,received_at")
      .eq("provider", "stripe")
      .order("received_at", { ascending: false })
      .limit(10);
    if (!error && data) setEvents(data as WebhookEvent[]);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
    const channel = supabase
      .channel("webhook_events_admin")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "webhook_events" },
        () => loadEvents()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const runPing = async () => {
    setPinging(true);
    try {
      const { data, error } = await supabase.functions.invoke("webhook-ping", {
        body: { environment: "live" },
      });
      if (error) throw error;
      setPingResult({
        reachable: !!data?.reachable,
        status: data?.status,
        error: data?.error,
        checked_at: data?.checked_at ?? new Date().toISOString(),
      });
      toast({
        title: data?.reachable ? "Endpoint reachable" : "Endpoint unreachable",
        description: data?.reachable
          ? `Responded with HTTP ${data.status}`
          : data?.error ?? "No response",
        variant: data?.reachable ? "default" : "destructive",
      });
    } catch (e: any) {
      setPingResult({ reachable: false, error: e?.message ?? String(e), checked_at: new Date().toISOString() });
      toast({ title: "Ping failed", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setPinging(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const lastEvent = events[0];

  return (
    <Card className="opacity-0 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: "75ms", animationFillMode: "forwards" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5 text-primary" />
          Stripe Webhook Health
        </CardTitle>
        <CardDescription>
          Monitor whether Stripe can reach your <code>payments-webhook</code> endpoint and see the most recent events processed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Endpoint */}
        <div>
          <div className="text-sm font-medium mb-1">Endpoint URL (live)</div>
          <div className="flex gap-2">
            <code className="flex-1 text-xs bg-muted/50 rounded px-2 py-1.5 break-all">{WEBHOOK_URL_LIVE || "Project URL unavailable"}</code>
            <Button variant="outline" size="sm" onClick={() => copy(WEBHOOK_URL_LIVE)} disabled={!WEBHOOK_URL_LIVE}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Paste this into Stripe Dashboard → Developers → Webhooks. Signing secret env var: <code>STRIPE_WEBHOOK_SECRET</code>.
          </p>
        </div>

        {/* Reachability */}
        <div className="rounded-lg border border-border/60 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {pingResult ? (
              pingResult.reachable ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )
            ) : (
              <Webhook className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <div className="text-sm font-medium">
                {pingResult
                  ? pingResult.reachable
                    ? "Endpoint reachable"
                    : "Endpoint unreachable"
                  : "Reachability not checked"}
              </div>
              <div className="text-xs text-muted-foreground">
                {pingResult
                  ? `${pingResult.status ? `HTTP ${pingResult.status} · ` : ""}${timeAgo(pingResult.checked_at)}${pingResult.error ? ` · ${pingResult.error}` : ""}`
                  : "Run a probe to confirm Stripe can reach this URL."}
              </div>
            </div>
          </div>
          <Button onClick={runPing} disabled={pinging} size="sm" variant="outline">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${pinging ? "animate-spin" : ""}`} />
            Test now
          </Button>
        </div>

        {/* Last event */}
        <div className="rounded-lg border border-border/60 p-3">
          <div className="text-sm font-medium mb-1.5">Last event received</div>
          {loading ? (
            <Skeleton className="h-12 w-full" />
          ) : lastEvent ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">{lastEvent.event_type}</Badge>
                  <Badge variant="outline" className="text-xs">{lastEvent.environment}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {timeAgo(lastEvent.received_at)} · {new Date(lastEvent.received_at).toLocaleString()}
                </div>
                {lastEvent.payload_summary?.object_id && (
                  <div className="text-xs font-mono text-muted-foreground">
                    {lastEvent.payload_summary.object_type ?? "object"}: {lastEvent.payload_summary.object_id}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">No events received yet.</div>
                <div className="text-xs text-muted-foreground">
                  If customers are paying but nothing appears here, the webhook is not configured in Stripe. Add the endpoint URL above and ensure <code>STRIPE_WEBHOOK_SECRET</code> matches.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent events */}
        {events.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Recent events ({events.length})</div>
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Type</th>
                    <th className="text-left px-3 py-2 font-medium">Env</th>
                    <th className="text-left px-3 py-2 font-medium">Object</th>
                    <th className="text-left px-3 py-2 font-medium">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id} className="border-t border-border/40">
                      <td className="px-3 py-2 font-mono">{e.event_type}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-xs">{e.environment}</Badge>
                      </td>
                      <td className="px-3 py-2 font-mono text-muted-foreground truncate max-w-[200px]">
                        {e.payload_summary?.object_id ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{timeAgo(e.received_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
