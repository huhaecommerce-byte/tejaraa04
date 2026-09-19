import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Link2, Package, Plug, RefreshCw, ShoppingCart, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/partners/AdminShell";
import { Panel, StatCard, StatusPill, TableWrap, Tabs, Td, Th } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import {
  createChannelConnection,
  deleteChannelConnection,
  listChannelConnections,
  listChannelOrders,
  listSharedProducts,
  pullOrdersNow,
  pushProductsNow,
  rotateChannelKey,
  updateChannelConnection,
} from "@/lib/partners/channel-connections.functions";

export const Route = createFileRoute("/partners/admin/connections")({
  head: () => ({
    meta: [
      { title: `Project Connections | ${brandConfig.name}` },
      { name: "description", content: "Connect other projects to the platform: share the live product catalogue, receive their orders and follow every sync event." },
      { property: "og:title", content: `Project Connections | ${brandConfig.name}` },
      { property: "og:description", content: "Manage API keys, shared products, synced orders and integration docs for connected projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConnectionsPage,
});

const TABS = ["Connections", "Shared products", "Synced orders", "Sync activity", "Documentation"] as const;

const field =
  "h-9 w-full rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary";
const label = "mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground";
const btn =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[11px] font-bold transition-colors hover:border-primary hover:text-primary disabled:opacity-50";
const orderTone: Record<string, string> = {
  New: "info", Confirmed: "info", Processing: "warning", "Ready to Ship": "warning",
  Shipped: "positive", Delivered: "positive", Cancelled: "danger", Returned: "danger",
};

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border bg-secondary/50 p-3 text-[11px] leading-relaxed font-semibold text-foreground">
      <code>{children}</code>
    </pre>
  );
}

function ConnectionsPage() {
  const queryClient = useQueryClient();
  const list = useServerFn(listChannelConnections);
  const listProducts = useServerFn(listSharedProducts);
  const listOrders = useServerFn(listChannelOrders);
  const create = useServerFn(createChannelConnection);
  const update = useServerFn(updateChannelConnection);
  const rotate = useServerFn(rotateChannelKey);
  const remove = useServerFn(deleteChannelConnection);
  const push = useServerFn(pushProductsNow);
  const pull = useServerFn(pullOrdersNow);

  const [tab, setTab] = useState<string>(TABS[0]);
  const [form, setForm] = useState({ name: "", notes: "", pushUrl: "", pushSecret: "", pullUrl: "", pullSecret: "" });
  const [newKey, setNewKey] = useState<{ name: string; key: string } | null>(null);
  const [busy, setBusy] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "connections"],
    queryFn: () => list({ data: undefined as never }),
  });

  const productsQuery = useQuery({
    queryKey: ["admin", "connections", "products"],
    enabled: tab === "Shared products",
    queryFn: () => listProducts({ data: undefined as never }),
  });

  const ordersQuery = useQuery({
    queryKey: ["admin", "connections", "orders"],
    enabled: tab === "Synced orders",
    queryFn: () => listOrders({ data: undefined as never }),
  });

  const connections = data?.connections ?? [];
  const log = data?.log ?? [];
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const productsUrl = `${origin}/api/public/channel/products`;
  const ordersUrl = `${origin}/api/public/channel/orders`;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "connections"] });

  const createMutation = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: (result) => {
      setNewKey({ name: result.name, key: result.apiKey });
      setForm({ name: "", notes: "", pushUrl: "", pushSecret: "", pullUrl: "", pullSecret: "" });
      toast.success("Connection created — copy the key now, it is shown only once.");
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
      title="Project connections"
      subtitle="Share the live catalogue with other projects, pull their orders back in, and follow every sync event."
    >
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Connections" value={String(connections.length)} icon={Plug} />
        <StatCard label="Enabled" value={String(connections.filter((c) => c.enabled).length)} icon={Link2} />
        <StatCard label="Orders received" value={String(connections.reduce((t, c) => t + c.order_count, 0))} icon={ShoppingCart} />
        <StatCard label="Recent events" value={String(log.length)} icon={RefreshCw} />
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

      {tab === "Connections" && (
        <>
          <Panel title="Connect a new project">
            <form
              className="grid gap-3 p-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                createMutation.mutate();
              }}
            >
              <div>
                <label className={label} htmlFor="conn-name">Project name</label>
                <input id="conn-name" className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Partner storefront" />
              </div>
              <div>
                <label className={label} htmlFor="conn-notes">Notes</label>
                <input id="conn-notes" className={field} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Who runs it, what it sells" />
              </div>
              <div>
                <label className={label} htmlFor="conn-push">Product push address (optional)</label>
                <input id="conn-push" className={field} value={form.pushUrl} onChange={(e) => setForm({ ...form, pushUrl: e.target.value })} placeholder="https://partner.example.com/api/products" />
              </div>
              <div>
                <label className={label} htmlFor="conn-push-secret">Push signing secret (optional)</label>
                <input id="conn-push-secret" className={field} value={form.pushSecret} onChange={(e) => setForm({ ...form, pushSecret: e.target.value })} placeholder="Shared secret" />
              </div>
              <div>
                <label className={label} htmlFor="conn-pull">Orders address to fetch (optional)</label>
                <input id="conn-pull" className={field} value={form.pullUrl} onChange={(e) => setForm({ ...form, pullUrl: e.target.value })} placeholder="https://partner.example.com/api/orders" />
              </div>
              <div>
                <label className={label} htmlFor="conn-pull-secret">Orders access token (optional)</label>
                <input id="conn-pull-secret" className={field} value={form.pullSecret} onChange={(e) => setForm({ ...form, pullSecret: e.target.value })} placeholder="Token sent to their API" />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending || !form.name.trim()}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-button disabled:opacity-50"
                >
                  <Plug className="h-4 w-4" /> {createMutation.isPending ? "Creating…" : "Create connection"}
                </button>
              </div>
            </form>
          </Panel>

          <Panel
            title="Connected projects"
            action={
              <div className="flex gap-1.5">
                <button type="button" className={btn} disabled={busy === "all"} onClick={() => run("all", () => push({ data: {} }), "Products pushed to all connections.")}>
                  <Upload className="h-3.5 w-3.5" /> Push products to all
                </button>
                <button type="button" className={btn} disabled={busy === "all"} onClick={() => run("all", () => pull({ data: {} }), "Orders fetched from all connections.")}>
                  <RefreshCw className="h-3.5 w-3.5" /> Fetch all orders
                </button>
              </div>
            }
          >
            <TableWrap>
              <thead className="bg-secondary/60">
                <tr><Th>Project</Th><Th>Key</Th><Th>Addresses</Th><Th>Orders</Th><Th>Last push</Th><Th>Last order</Th><Th>Status</Th><Th align="right">Actions</Th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {connections.map((row) => (
                  <tr key={row.id}>
                    <Td strong>{row.name}<span className="block text-[10px] font-semibold text-muted-foreground">{row.notes || row.slug}</span></Td>
                    <Td><code className="text-[10px]">{row.key_prefix}…</code></Td>
                    <Td>
                      <span className="block max-w-[220px] truncate text-[10px] font-semibold text-muted-foreground">Push: {row.push_url || "not set"}</span>
                      <span className="block max-w-[220px] truncate text-[10px] font-semibold text-muted-foreground">Pull: {row.orders_pull_url || "not set"}</span>
                    </Td>
                    <Td>{row.order_count}</Td>
                    <Td>{row.last_push_at ? new Date(row.last_push_at).toLocaleString() : "—"}</Td>
                    <Td>{row.last_order_at ? new Date(row.last_order_at).toLocaleString() : "—"}</Td>
                    <Td><StatusPill label={row.enabled ? "Enabled" : "Disabled"} tone={row.enabled ? "positive" : "neutral"} /></Td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button type="button" className={btn} disabled={busy === row.id} onClick={() => run(row.id, () => push({ data: { id: row.id } }), "Products pushed.")}>
                          <Upload className="h-3.5 w-3.5" /> Push
                        </button>
                        <button type="button" className={btn} disabled={busy === row.id} onClick={() => run(row.id, () => pull({ data: { id: row.id } }), "Orders fetched.")}>
                          <RefreshCw className="h-3.5 w-3.5" /> Fetch orders
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
                        <button type="button" className={btn} disabled={busy === row.id} onClick={() => run(row.id, () => update({ data: { id: row.id, enabled: !row.enabled } }), row.enabled ? "Connection disabled." : "Connection enabled.")}>
                          {row.enabled ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          className={`${btn} text-destructive`}
                          disabled={busy === row.id}
                          onClick={() => {
                            if (!window.confirm(`Delete the connection "${row.name}"? Their key stops working immediately.`)) return;
                            void run(row.id, () => remove({ data: { id: row.id } }), "Connection deleted.");
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {connections.length === 0 && (
                  <tr><Td>{isLoading ? "Loading…" : "No projects connected yet."}</Td><Td>—</Td><Td>—</Td><Td>—</Td><Td>—</Td><Td>—</Td><Td>—</Td><Td align="right">—</Td></tr>
                )}
              </tbody>
            </TableWrap>
          </Panel>
        </>
      )}

      {tab === "Shared products" && (
        <>
          <div className="grid gap-2.5 sm:grid-cols-3">
            <StatCard label="Shared with partners" value={String(productsQuery.data?.products.length ?? 0)} icon={Package} />
            <StatCard label="Awaiting approval" value={String(productsQuery.data?.pending ?? 0)} note="Not shared until approved" icon={RefreshCw} />
            <StatCard label="Wholesalers represented" value={String(productsQuery.data?.wholesalers ?? 0)} icon={Link2} />
          </div>
          <Panel
            title="Catalogue shared with connected projects"
            action={
              <button type="button" className={btn} disabled={busy === "all"} onClick={() => run("all", () => push({ data: {} }), "Products pushed to all connections.")}>
                <Upload className="h-3.5 w-3.5" /> Push now
              </button>
            }
          >
            <TableWrap>
              <thead className="bg-secondary/60">
                <tr><Th>Product</Th><Th>SKU</Th><Th>Brand</Th><Th>Category</Th><Th align="right">Wholesale</Th><Th align="right">MOQ</Th><Th align="right">Stock</Th><Th>Warehouse</Th><Th>Updated</Th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(productsQuery.data?.products ?? []).map((row) => (
                  <tr key={row.id}>
                    <Td strong>{row.name}</Td>
                    <Td><code className="text-[10px]">{row.sku || "—"}</code></Td>
                    <Td>{row.brand || "—"}</Td>
                    <Td>{row.category || "—"}</Td>
                    <Td align="right" strong>{row.currency} {row.wholesale_price.toLocaleString()}</Td>
                    <Td align="right">{row.moq}</Td>
                    <Td align="right">{row.stock}</Td>
                    <Td>{row.warehouse || "—"}</Td>
                    <Td>{new Date(row.updated_at).toLocaleDateString()}</Td>
                  </tr>
                ))}
                {(productsQuery.data?.products ?? []).length === 0 && (
                  <tr><Td>{productsQuery.isLoading ? "Loading…" : "No approved products are being shared yet."}</Td><Td>—</Td><Td>—</Td><Td>—</Td><Td align="right">—</Td><Td align="right">—</Td><Td align="right">—</Td><Td>—</Td><Td>—</Td></tr>
                )}
              </tbody>
            </TableWrap>
          </Panel>
        </>
      )}

      {tab === "Synced orders" && (
        <Panel
          title="Orders received from connected projects"
          action={
            <button type="button" className={btn} disabled={busy === "all"} onClick={() => run("all", () => pull({ data: {} }), "Orders fetched from all connections.")}>
              <RefreshCw className="h-3.5 w-3.5" /> Fetch orders
            </button>
          }
        >
          <TableWrap>
            <thead className="bg-secondary/60">
              <tr><Th>Reference</Th><Th>Project</Th><Th>Wholesaler</Th><Th>Items</Th><Th align="right">Qty</Th><Th align="right">Value</Th><Th>Market</Th><Th>Received</Th><Th align="right">Status</Th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(ordersQuery.data?.orders ?? []).map((row) => (
                <tr key={row.id}>
                  <Td strong>
                    {row.reference || row.external_reference}
                    {row.external_status && <span className="block text-[10px] font-semibold text-muted-foreground">Partner status: {row.external_status}</span>}
                  </Td>
                  <Td>{row.connection}</Td>
                  <Td>{row.supplier}</Td>
                  <Td>
                    {row.items.map((item) => (
                      <span key={`${row.id}-${item.sku}`} className="block max-w-[220px] truncate text-[10px] font-semibold text-muted-foreground">
                        {item.quantity} × {item.name} ({item.sku})
                      </span>
                    ))}
                    {row.items.length === 0 && "—"}
                  </Td>
                  <Td align="right" strong>{row.quantity}</Td>
                  <Td align="right" strong>{row.currency} {row.order_value.toLocaleString()}</Td>
                  <Td>{row.buyer_country || "—"}</Td>
                  <Td>{new Date(row.created_at).toLocaleString()}</Td>
                  <td className="px-3 py-2.5 text-right"><StatusPill label={row.status} tone={orderTone[row.status] ?? "neutral"} /></td>
                </tr>
              ))}
              {(ordersQuery.data?.orders ?? []).length === 0 && (
                <tr><Td>{ordersQuery.isLoading ? "Loading…" : "No orders have arrived from connected projects yet."}</Td><Td>—</Td><Td>—</Td><Td>—</Td><Td align="right">—</Td><Td align="right">—</Td><Td>—</Td><Td>—</Td><Td align="right">—</Td></tr>
              )}
            </tbody>
          </TableWrap>
        </Panel>
      )}

      {tab === "Sync activity" && (
        <Panel title="Sync activity" action={<button type="button" className={btn} onClick={refresh}><RefreshCw className="h-3.5 w-3.5" /> Reload</button>}>
          <TableWrap>
            <thead className="bg-secondary/60">
              <tr><Th>When</Th><Th>Direction</Th><Th>Event</Th><Th>Status</Th><Th>Detail</Th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {log.map((entry) => (
                <tr key={entry.id}>
                  <Td>{new Date(entry.created_at).toLocaleString()}</Td>
                  <Td>{entry.direction === "inbound" ? "Incoming" : "Outgoing"}</Td>
                  <Td>{entry.event === "order_import" ? "Order received" : entry.event === "product_feed" ? "Products shared" : entry.event}</Td>
                  <td className="px-3 py-2.5"><StatusPill label={entry.status} tone={entry.status === "ok" ? "positive" : "danger"} /></td>
                  <Td><span className="block max-w-[420px] truncate">{JSON.stringify(entry.detail)}</span></Td>
                </tr>
              ))}
              {log.length === 0 && <tr><Td>No activity yet.</Td><Td>—</Td><Td>—</Td><Td>—</Td><Td>—</Td></tr>}
            </tbody>
          </TableWrap>
        </Panel>
      )}

      {tab === "Documentation" && (
        <>
          <Panel title="How the integration works">
            <div className="space-y-2 p-3 text-[11px] font-semibold leading-relaxed text-muted-foreground">
              <p>Every connected project gets its own secret key. The key identifies the project on each request and can be rotated or disabled at any time without touching the others.</p>
              <ol className="ml-4 list-decimal space-y-1">
                <li>Create the connection here and copy the key once — it is stored hashed and never shown again.</li>
                <li>The partner reads the approved catalogue from the products address, or we push it to their address whenever a product is approved.</li>
                <li>The partner posts their orders to our orders address, or we fetch them from their address on demand.</li>
                <li>Each order line is matched to a wholesaler by SKU; a multi-wholesaler order is split so each wholesaler only sees their own part.</li>
              </ol>
            </div>
          </Panel>

          <Panel title="Endpoints">
            <div className="space-y-3 p-3 text-[11px] font-semibold text-muted-foreground">
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg border border-border bg-background px-2 py-1.5">GET {productsUrl}</code>
                <button type="button" className={btn} onClick={() => copy(productsUrl)}><Copy className="h-3.5 w-3.5" /> Copy</button>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg border border-border bg-background px-2 py-1.5">POST {ordersUrl}</code>
                <button type="button" className={btn} onClick={() => copy(ordersUrl)}><Copy className="h-3.5 w-3.5" /> Copy</button>
              </div>
              <p>Both require the header <code>Authorization: Bearer &lt;key&gt;</code>. A wrong or disabled key returns 401.</p>
            </div>
          </Panel>

          <Panel title="1. Read the catalogue">
            <div className="space-y-2 p-3 text-[11px] font-semibold text-muted-foreground">
              <p>Only approved, active products are returned. Add <code>?updated_since=2026-01-01T00:00:00Z</code> to fetch changes only.</p>
              <Code>{`curl -H "Authorization: Bearer <key>" \\
  "${productsUrl || "https://your-site/api/public/channel/products"}?updated_since=2026-01-01T00:00:00Z"`}</Code>
              <Code>{`{
  "connection": "Partner storefront",
  "count": 1,
  "products": [
    {
      "id": "uuid",
      "name": "Test Sync Widget",
      "sku": "TESTSKU-1",
      "brand": "TestBrand",
      "category": "Electronics",
      "description": "",
      "currency": "AED",
      "wholesale_price": 25,
      "dropship_price": 0,
      "moq": 10,
      "stock": 500,
      "warehouse": "Dubai",
      "images": [],
      "updated_at": "2026-09-17T02:03:00Z"
    }
  ]
}`}</Code>
            </div>
          </Panel>

          <Panel title="2. Send orders">
            <div className="space-y-2 p-3 text-[11px] font-semibold text-muted-foreground">
              <p>Post one order object, or a list under <code>orders</code>. Every line must carry a <code>sku</code> that exists in the catalogue. Sending the same <code>reference</code> again updates the existing order instead of duplicating it.</p>
              <Code>{`curl -X POST "${ordersUrl || "https://your-site/api/public/channel/orders"}" \\
  -H "Authorization: Bearer <key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reference": "PARTNER-1001",
    "status": "confirmed",
    "currency": "AED",
    "buyer_country": "SA",
    "shipping": "Express",
    "items": [
      { "sku": "TESTSKU-1", "quantity": 20, "unit_price": 25 }
    ]
  }'`}</Code>
              <Code>{`{ "accepted": ["PARTNER-1001"], "rejected": [] }`}</Code>
              <p>Accepted partner statuses are mapped to ours: new, confirmed, processing, ready to ship, shipped, delivered, cancelled, returned. Unknown SKUs are reported back in the sync activity tab as unmatched lines.</p>
            </div>
          </Panel>

          <Panel title="3. Optional: let us push and pull">
            <div className="space-y-2 p-3 text-[11px] font-semibold text-muted-foreground">
              <p><strong className="text-foreground">Product push address</strong> — we POST the full approved catalogue to this address whenever a product is approved or you press Push. If a signing secret is set, we add an <code>X-Tejarx-Signature</code> header containing the HMAC-SHA256 of the body so the partner can verify us.</p>
              <p><strong className="text-foreground">Orders address to fetch</strong> — pressing Fetch orders calls this address with the access token as a bearer header and imports whatever orders it returns, in the same format as above.</p>
            </div>
          </Panel>

          <Panel title="Who sees what">
            <div className="space-y-1 p-3 text-[11px] font-semibold text-muted-foreground">
              <p>Keys, addresses, secrets and the sync log are visible to admins only.</p>
              <p>Each wholesaler sees only the orders and order lines that contain their own products, inside their own portal.</p>
              <p>Partners only ever see approved, active products — never wholesaler identities, costs or payout details.</p>
            </div>
          </Panel>
        </>
      )}
    </AdminShell>
  );
}
