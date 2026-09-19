import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Boxes, CheckCircle2, Copy, RefreshCw, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/partners/AdminShell";
import { Panel, StatCard, StatusPill, TableWrap, Tabs, Td, Th } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import {
  createSupplierIntegration,
  deleteSupplierIntegration,
  listInventoryActivity,
  listSupplierIntegrations,
  pullSupplierInventoryNow,
  rotateSupplierIntegrationKey,
  updateSupplierIntegration,
} from "@/lib/partners/supplier-inventory.functions";

export const Route = createFileRoute("/partners/admin/supplier-integrations")({
  head: () => ({
    meta: [
      { title: `Supplier Integrations | ${brandConfig.name}` },
      { name: "description", content: "Connect wholesaler inventory systems to sync stock and wholesale prices automatically." },
      { property: "og:title", content: `Supplier Integrations | ${brandConfig.name}` },
      { property: "og:description", content: "Admin-managed API keys, feed pulling and audit history for wholesaler stock and price sync." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupplierIntegrationsPage,
});

const TABS = ["Integrations", "Sync activity", "Documentation"] as const;

const field =
  "h-9 w-full rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary";
const label = "mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground";
const btn =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[11px] font-bold transition-colors hover:border-primary hover:text-primary disabled:opacity-50";

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border bg-secondary/50 p-3 text-[11px] leading-relaxed font-semibold text-foreground">
      <code>{children}</code>
    </pre>
  );
}

function SupplierIntegrationsPage() {
  const queryClient = useQueryClient();
  const list = useServerFn(listSupplierIntegrations);
  const listActivity = useServerFn(listInventoryActivity);
  const create = useServerFn(createSupplierIntegration);
  const update = useServerFn(updateSupplierIntegration);
  const rotate = useServerFn(rotateSupplierIntegrationKey);
  const remove = useServerFn(deleteSupplierIntegration);
  const pull = useServerFn(pullSupplierInventoryNow);

  const [tab, setTab] = useState<string>(TABS[0]);
  const [form, setForm] = useState({ supplierId: "", name: "", notes: "", pullUrl: "", pullSecret: "" });
  const [newKey, setNewKey] = useState<{ name: string; key: string } | null>(null);
  const [busy, setBusy] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "supplier-integrations"],
    queryFn: () => list({ data: undefined as never }),
  });

  const activityQuery = useQuery({
    queryKey: ["admin", "supplier-integrations", "activity"],
    enabled: tab === "Sync activity",
    queryFn: () => listActivity({ data: undefined as never }),
  });

  const integrations = data?.integrations ?? [];
  const suppliers = data?.suppliers ?? [];
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const updatesUrl = `${origin}/api/public/supplier-inventory/updates`;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "supplier-integrations"] });
  };

  const createMutation = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: (result) => {
      setNewKey({ name: result.name, key: result.apiKey });
      setForm({ supplierId: "", name: "", notes: "", pullUrl: "", pullSecret: "" });
      toast.success("Integration created — copy the key now, it is shown only once.");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function run(id: string, action: () => Promise<unknown>, done: string) {
    setBusy(id);
    try {
      await action();
      toast.success(done);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy("");
    }
  }

  function copy(value: string, message = "Copied") {
    void navigator.clipboard.writeText(value);
    toast.success(message);
  }

  return (
    <AdminShell
      title="Supplier integrations"
      subtitle="Connect wholesaler inventory systems so their stock and wholesale prices update automatically."
    >
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Integrations" value={String(integrations.length)} icon={Boxes} />
        <StatCard label="Enabled" value={String(integrations.filter((i) => i.enabled).length)} icon={CheckCircle2} />
        <StatCard label="Updates applied" value={String(integrations.reduce((t, i) => t + i.applied, 0))} icon={RefreshCw} />
        <StatCard label="Failing" value={String(integrations.filter((i) => i.last_status === "error").length)} icon={XCircle} />
      </div>

      <Tabs items={TABS} value={tab} onChange={setTab} />

      {newKey && (
        <div className="rounded-card border border-primary/40 bg-accent/40 p-3">
          <p className="text-[11px] font-bold text-primary">API key for {newKey.name} — copy it now, it will not be shown again.</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-border bg-background px-2 py-1.5 text-[11px]">{newKey.key}</code>
            <button type="button" className={btn} onClick={() => copy(newKey.key, "API key copied")}><Copy className="h-3.5 w-3.5" /> Copy</button>
            <button type="button" className={btn} onClick={() => setNewKey(null)}>Done</button>
          </div>
        </div>
      )}

      {tab === "Integrations" && (
        <>
          <Panel title="Connect a wholesaler system">
            <form
              className="grid gap-3 p-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                createMutation.mutate();
              }}
            >
              <div>
                <label className={label} htmlFor="int-supplier">Wholesaler</label>
                <select
                  id="int-supplier"
                  className={field}
                  value={form.supplierId}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                >
                  <option value="">Choose a wholesaler…</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name} — {supplier.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="int-name">Integration name</label>
                <input id="int-name" className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Warehouse ERP" />
              </div>
              <div>
                <label className={label} htmlFor="int-notes">Notes</label>
                <input id="int-notes" className={field} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Who uses this key" />
              </div>
              <div>
                <label className={label} htmlFor="int-pull">Feed address to pull (optional)</label>
                <input id="int-pull" className={field} value={form.pullUrl} onChange={(e) => setForm({ ...form, pullUrl: e.target.value })} placeholder="https://supplier.example.com/stock.json" />
              </div>
              <div>
                <label className={label} htmlFor="int-pull-secret">Feed access token (optional)</label>
                <input id="int-pull-secret" className={field} value={form.pullSecret} onChange={(e) => setForm({ ...form, pullSecret: e.target.value })} placeholder="Token sent to their feed" />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending || !form.supplierId || !form.name.trim()}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-button disabled:opacity-50"
                >
                  <Boxes className="h-4 w-4" /> {createMutation.isPending ? "Creating…" : "Create integration"}
                </button>
              </div>
            </form>
          </Panel>

          <Panel
            title="Connected wholesaler systems"
            action={
              <button type="button" className={btn} disabled={busy === "all"} onClick={() => run("all", () => pull({ data: {} }), "Feeds pulled for all integrations.")}>
                <RefreshCw className="h-3.5 w-3.5" /> Pull all feeds
              </button>
            }
          >
            <TableWrap>
              <thead className="bg-secondary/60">
                <tr><Th>Integration</Th><Th>Wholesaler</Th><Th>Key</Th><Th>Feed</Th><Th align="right">Applied</Th><Th>Last sync</Th><Th>Status</Th><Th align="right">Actions</Th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {integrations.map((row) => (
                  <tr key={row.id}>
                    <Td strong>
                      {row.name}
                      <span className="block text-[10px] font-semibold text-muted-foreground">{row.notes || "—"}</span>
                    </Td>
                    <Td>{row.supplier}</Td>
                    <Td><code className="text-[10px]">{row.key_prefix}…</code></Td>
                    <Td><span className="block max-w-[200px] truncate text-[10px] font-semibold text-muted-foreground">{row.pull_url || "push only"}</span></Td>
                    <Td align="right" strong>{row.applied}</Td>
                    <Td>
                      {row.last_sync_at ? new Date(row.last_sync_at).toLocaleString() : "—"}
                      {row.last_error && <span className="block max-w-[200px] truncate text-[10px] font-semibold text-destructive">{row.last_error}</span>}
                    </Td>
                    <Td>
                      <StatusPill
                        label={!row.enabled ? "Disabled" : row.last_status === "error" ? "Failing" : row.last_status === "partial" ? "Partial" : "Enabled"}
                        tone={!row.enabled ? "neutral" : row.last_status === "error" ? "danger" : row.last_status === "partial" ? "warning" : "positive"}
                      />
                    </Td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button type="button" className={btn} disabled={busy === row.id} onClick={() => run(row.id, () => pull({ data: { id: row.id } }), "Feed pulled.")}>
                          <RefreshCw className="h-3.5 w-3.5" /> Pull now
                        </button>
                        <button
                          type="button"
                          className={btn}
                          disabled={busy === row.id}
                          onClick={() =>
                            run(row.id, async () => {
                              const result = await rotate({ data: { id: row.id } });
                              setNewKey({ name: row.name, key: result.apiKey });
                            }, "New key generated.")
                          }
                        >
                          Rotate key
                        </button>
                        <button type="button" className={btn} disabled={busy === row.id} onClick={() => run(row.id, () => update({ data: { id: row.id, enabled: !row.enabled } }), row.enabled ? "Integration disabled." : "Integration enabled.")}>
                          {row.enabled ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          className={`${btn} text-destructive`}
                          disabled={busy === row.id}
                          onClick={() => {
                            if (!window.confirm(`Delete the integration "${row.name}"? The key stops working immediately.`)) return;
                            void run(row.id, () => remove({ data: { id: row.id } }), "Integration deleted.");
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {integrations.length === 0 && (
                  <tr><Td>{isLoading ? "Loading…" : "No wholesaler systems connected yet."}</Td><Td>—</Td><Td>—</Td><Td>—</Td><Td align="right">—</Td><Td>—</Td><Td>—</Td><Td align="right">—</Td></tr>
                )}
              </tbody>
            </TableWrap>
          </Panel>
        </>
      )}

      {tab === "Sync activity" && (
        <>
          <Panel title="Recent batches" action={<button type="button" className={btn} onClick={refresh}><RefreshCw className="h-3.5 w-3.5" /> Reload</button>}>
            <TableWrap>
              <thead className="bg-secondary/60">
                <tr><Th>When</Th><Th>Integration</Th><Th>Source</Th><Th>Request</Th><Th align="right">Accepted</Th><Th align="right">Rejected</Th><Th>Status</Th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(activityQuery.data?.batches ?? []).map((row) => (
                  <tr key={row.id}>
                    <Td>{new Date(row.created_at).toLocaleString()}</Td>
                    <Td strong>{row.integration}</Td>
                    <Td>{row.source === "pull" ? "Pulled feed" : "Pushed by wholesaler"}</Td>
                    <Td><code className="text-[10px]">{row.request_id || "—"}</code></Td>
                    <Td align="right" strong>{row.accepted}</Td>
                    <Td align="right">{row.rejected}</Td>
                    <td className="px-3 py-2.5">
                      <StatusPill label={row.status} tone={row.status === "ok" ? "positive" : row.status === "partial" ? "warning" : row.status === "processing" ? "info" : "danger"} />
                    </td>
                  </tr>
                ))}
                {(activityQuery.data?.batches ?? []).length === 0 && (
                  <tr><Td>{activityQuery.isLoading ? "Loading…" : "No batches yet."}</Td><Td>—</Td><Td>—</Td><Td>—</Td><Td align="right">—</Td><Td align="right">—</Td><Td>—</Td></tr>
                )}
              </tbody>
            </TableWrap>
          </Panel>

          <Panel title="Row-level history">
            <TableWrap>
              <thead className="bg-secondary/60">
                <tr><Th>When</Th><Th>Integration</Th><Th>SKU</Th><Th>Result</Th><Th>Change</Th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(activityQuery.data?.log ?? []).map((row) => (
                  <tr key={row.id}>
                    <Td>{new Date(row.created_at).toLocaleString()}</Td>
                    <Td>{row.integration}</Td>
                    <Td><code className="text-[10px]">{row.sku || "—"}</code></Td>
                    <td className="px-3 py-2.5">
                      <StatusPill label={row.status === "ok" ? "Updated" : "Rejected"} tone={row.status === "ok" ? "positive" : "danger"} />
                      {row.status !== "ok" && <span className="block max-w-[220px] text-[10px] font-semibold text-muted-foreground">{row.message}</span>}
                    </td>
                    <Td><span className="block max-w-[420px] truncate">{JSON.stringify(row.detail)}</span></Td>
                  </tr>
                ))}
                {(activityQuery.data?.log ?? []).length === 0 && (
                  <tr><Td>{activityQuery.isLoading ? "Loading…" : "No updates recorded yet."}</Td><Td>—</Td><Td>—</Td><Td>—</Td><Td>—</Td></tr>
                )}
              </tbody>
            </TableWrap>
          </Panel>
        </>
      )}

      {tab === "Documentation" && (
        <>
          <Panel title="How wholesaler integrations work">
            <div className="space-y-2 p-3 text-[11px] font-semibold leading-relaxed text-muted-foreground">
              <p>Each integration belongs to one wholesaler and gets its own secret key. The key can only touch that wholesaler's products — never anyone else's.</p>
              <ol className="ml-4 list-decimal space-y-1">
                <li>Create the integration here and copy the key once — it is stored hashed and never shown again.</li>
                <li>The wholesaler's system pushes stock and price updates to our updates address, or we pull their feed on a schedule.</li>
                <li>Each row is matched by SKU. Valid rows apply immediately; invalid rows are rejected with a reason.</li>
                <li>Every change is written to the sync activity log with the old and new values.</li>
              </ol>
            </div>
          </Panel>

          <Panel title="Push updates to TejarX">
            <div className="space-y-3 p-3 text-[11px] font-semibold text-muted-foreground">
              <p>Send one update or a batch. Fields per row: <code>sku</code> (required), <code>stock</code>, <code>wholesale_price</code>, <code>currency</code>. At least one of stock or price is required. Currencies: AED, SAR, KWD, QAR, BHD, OMR, USD.</p>
              <Code>{`curl -X POST "${updatesUrl}" \\
  -H "Authorization: Bearer <supplier-api-key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "request_id": "stock-sync-001",
    "items": [
      { "sku": "ABC-123", "stock": 48, "wholesale_price": 23.98, "currency": "SAR" },
      { "sku": "XYZ-900", "stock": 0 }
    ]
  }'`}</Code>
              <p>The response lists accepted SKUs and rejected rows with reasons. Sending the same <code>request_id</code> again is safe — the batch will not be applied twice.</p>
            </div>
          </Panel>

          <Panel title="Let TejarX pull a feed">
            <div className="space-y-3 p-3 text-[11px] font-semibold text-muted-foreground">
              <p>If the wholesaler already publishes a stock feed (ERP, warehouse system, or a simple JSON file), paste its address on the integration. We fetch it on a schedule and apply the same rules as pushed updates.</p>
              <Code>{`// Expected feed response (array or an object with "items")
{
  "request_id": "optional-unique-id",
  "items": [
    { "sku": "ABC-123", "stock": 48, "wholesale_price": 23.98, "currency": "SAR" }
  ]
}`}</Code>
              <p>If the feed needs a token, save it as the feed access token — we send it as an Authorization bearer header when fetching.</p>
            </div>
          </Panel>

          <Panel title="Who sees what">
            <div className="space-y-1.5 p-3 text-[11px] font-semibold text-muted-foreground">
              <p>Keys, feed addresses, tokens and the activity log are visible to admins only.</p>
              <p>Wholesalers never see API credentials in their portal. They simply see their product stock and prices update.</p>
              <p>A key can only update stock, wholesale price and currency on products owned by its wholesaler — titles, descriptions, images and other products are never touched.</p>
            </div>
          </Panel>
        </>
      )}
    </AdminShell>
  );
}
