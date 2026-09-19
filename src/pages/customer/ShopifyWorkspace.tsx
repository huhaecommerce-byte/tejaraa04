import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertCircle, ArrowLeft, Boxes, CheckCircle2, ExternalLink, PackageCheck, Pencil, RefreshCw, Search, Settings, ShoppingCart, Trash2, Truck } from "lucide-react";
import {
  completeShopifySetup, deleteShopifyConnection, fulfilShopifyOrderNow, getShopifyWorkspace, publishSelectedShopifyProducts,
  removeShopifyProduct, reregisterShopifyWebhooks, retryShopifyConnection, selectShopifyProducts, syncShopifyNow,
  updateShopifyProduct, updateShopifySettings,
} from "@/lib/shopify.functions";
import { ShopifySetupWizard } from "@/components/shopify/ShopifySetupWizard";
import { ShopifySubmissionPreview } from "@/components/shopify/ShopifySubmissionPreview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";

type Workspace = Awaited<ReturnType<typeof getShopifyWorkspace>>;

export default function ShopifyWorkspace({ connectionId }: { connectionId: string }) {
  const navigate = useNavigate();
  const load = useServerFn(getShopifyWorkspace);
  const choose = useServerFn(selectShopifyProducts);
  const drop = useServerFn(removeShopifyProduct);
  const saveProduct = useServerFn(updateShopifyProduct);
  const publish = useServerFn(publishSelectedShopifyProducts);
  const syncNow = useServerFn(syncShopifyNow);
  const retry = useServerFn(retryShopifyConnection);
  const remove = useServerFn(deleteShopifyConnection);
  const saveSettings = useServerFn(updateShopifySettings);
  const finishSetup = useServerFn(completeShopifySetup);
  const rehook = useServerFn(reregisterShopifyWebhooks);
  const fulfil = useServerFn(fulfilShopifyOrderNow);

  const query = useQuery({ queryKey: ["shopify-workspace", connectionId], queryFn: () => load({ data: { id: connectionId } }) });
  const [selected, setSelected] = useState<string[]>([]);
  const [publishIds, setPublishIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const data = query.data as Workspace | undefined;
  const linkedProductIds = new Set((data?.links ?? []).map((link) => link.product_id));
  const filtered = useMemo(
    () => (data?.products ?? []).filter((product) => `${product.name} ${product.name_ar ?? ""} ${product.sku}`.toLowerCase().includes(search.toLowerCase())),
    [data?.products, search],
  );

  const act = async (run: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try { await run(); toast.success(success); await query.refetch(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Action failed"); }
    finally { setBusy(false); }
  };

  if (query.isLoading) return <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-96" /></div>;
  if (!data) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Workspace unavailable</AlertTitle><AlertDescription>Refresh the page or reconnect your Shopify store.</AlertDescription></Alert>;

  const healthy = data.connection.status === "healthy";
  const setupDone = Boolean(data.connection.setup_completed_at);

  if (!setupDone) return <div className="space-y-6">
    <div className="flex items-center gap-3 border-b pb-5">
      <Button variant="ghost" size="icon" asChild><Link to="/dropshipping/integrations" aria-label="Back to integrations"><ArrowLeft /></Link></Button>
      <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold">{data.connection.name}</h1><Badge variant={healthy ? "default" : "destructive"}>{data.connection.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{data.connection.shop_domain}</p></div>
    </div>
    {!healthy && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Shopify needs attention</AlertTitle><AlertDescription>{data.connection.last_error || "Check the access token and try again."}</AlertDescription></Alert>}
    <ShopifySetupWizard connection={data.connection} busy={busy} onSave={(values) => act(() => finishSetup({ data: { id: connectionId, ...values } }), "Setup complete — your Shopify workspace is unlocked")} />
  </div>;

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/dropshipping/integrations" aria-label="Back to integrations"><ArrowLeft /></Link></Button>
        <div>
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold">{data.connection.name}</h1><Badge variant={healthy ? "default" : "destructive"}>{data.connection.status}</Badge></div>
          <p className="mt-1 text-sm text-muted-foreground">{data.connection.shop_domain} · {data.connection.currency} · {data.connection.location_name || "No location"}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" disabled={busy} onClick={() => act(() => retry({ data: { id: connectionId } }), "Connection verified")}><RefreshCw /> Test connection</Button>
        <Button variant="outline" disabled={busy || !healthy} onClick={() => act(async () => { const result = await syncNow({ data: { connectionId } }); if (result.failed) throw new Error(result.firstError ?? "Some products failed to sync"); }, "Stock and prices synced to Shopify")}><RefreshCw /> Sync now</Button>
      </div>
    </div>

    {!healthy && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Shopify needs attention</AlertTitle><AlertDescription>{data.connection.last_error || "Check the access token and try again."}</AlertDescription></Alert>}

    <div className="grid gap-3 sm:grid-cols-4">{([
      ["Selected products", data.links.length, Boxes],
      ["Live in Shopify", data.links.filter((link) => Boolean(link.shopify_product_id)).length, PackageCheck],
      ["Shopify orders", data.orders.length, ShoppingCart],
      ["Recent sync events", data.logs.length, Activity],
    ] as const).map(([label, value, Icon]) => <Card key={label}><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>)}</div>

    <Tabs defaultValue="products" className="space-y-4">
      <TabsList className="w-full overflow-x-auto">
        <TabsTrigger value="products"><Boxes /> Products</TabsTrigger>
        <TabsTrigger value="orders"><ShoppingCart /> Orders</TabsTrigger>
        <TabsTrigger value="activity"><Activity /> Activity</TabsTrigger>
        <TabsTrigger value="settings"><Settings /> Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="products" className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Choose catalog products</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or SKU" className="pl-9" /></div>
            <div className="max-h-72 divide-y overflow-y-auto border">
              <div className="grid grid-cols-[36px_1fr_120px] gap-3 bg-muted/50 px-3 py-2 text-xs font-medium"><span /><span>Product</span><span>Status</span></div>
              {filtered.map((product) => <label key={product.id} className="grid cursor-pointer grid-cols-[36px_1fr_120px] items-center gap-3 px-3 py-3 text-sm hover:bg-muted/40">
                <Checkbox disabled={linkedProductIds.has(product.id)} checked={linkedProductIds.has(product.id) || selected.includes(product.id)} onCheckedChange={(checked) => setSelected((current) => checked ? [...current, product.id] : current.filter((id) => id !== product.id))} />
                <span className="min-w-0"><strong className="block truncate">{product.name}</strong><span className="text-xs text-muted-foreground">{product.sku} · stock {product.stock_qty}</span></span>
                <Badge variant="outline">{linkedProductIds.has(product.id) ? "Selected" : "Available"}</Badge>
              </label>)}
            </div>
            <Button disabled={!selected.length || busy} onClick={() => act(async () => { await choose({ data: { connectionId, productIds: selected } }); setSelected([]); }, "Products added to the Shopify queue")}><PackageCheck /> Add {selected.length || ""} products</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Publishing queue</CardTitle>
              <div className="flex flex-wrap gap-2">
                {(() => { const failedIds = data.links.filter((link) => ["failed", "content_only"].includes(link.sync_status)).map((link) => link.id); return <Button variant="outline" disabled={!failedIds.length || busy || !healthy} onClick={() => setPublishIds(failedIds)}><RefreshCw /> Retry failed only{failedIds.length ? ` (${failedIds.length})` : ""}</Button>; })()}
                <ShopifySubmissionPreview connectionId={connectionId} linkIds={publishIds} disabled={busy || !healthy} />
                <Button disabled={!publishIds.length || busy || !healthy} onClick={() => act(async () => {
                  const result = await publish({ data: { connectionId, linkIds: publishIds } });
                  const failures = result.results.filter((item) => !item.ok);
                  if (failures.length) throw new Error(failures.map((item) => item.error ?? "Needs attention").slice(0, 3).join(" · "));
                  setPublishIds([]);
                }, "Products pushed to Shopify")}><ExternalLink /> Publish selected</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.links.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Select products above to prepare them for Shopify.</p> : data.links.map((link) => {
                const product = data.products.find((entry) => entry.id === link.product_id);
                return <ProductRow
                  key={link.id}
                  link={link}
                  product={product}
                  price={(data.prices as Record<string, number | null>)[link.id] ?? null}
                  missing={(data.readiness as Record<string, string[]>)[link.id] ?? []}
                  defaultMarkup={Number(((data.connection.pricing_rules ?? {}) as Record<string, unknown>)["value"] ?? 15)}
                  currency={data.connection.currency}
                  shopDomain={data.connection.shop_domain}
                  checked={publishIds.includes(link.id)}
                  onChecked={(checked) => setPublishIds((current) => checked ? [...current, link.id] : current.filter((id) => id !== link.id))}
                  onSave={(values) => act(() => saveProduct({ data: { connectionId, linkId: link.id, ...values } }), "Pricing saved")}
                  onRemove={() => act(() => drop({ data: { connectionId, linkId: link.id } }), "Product removed from the queue")}
                />;
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="orders">
        <Card>
          <CardHeader><CardTitle className="text-base">Shopify orders</CardTitle></CardHeader>
          <CardContent>
            {data.orders.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">Orders from your Shopify store will appear here automatically.</p> : <div className="divide-y">{data.orders.map((order) => <OrderRow key={order.id} order={order} busy={busy} onFulfil={(values) => act(() => fulfil({ data: { connectionId, orderId: order.id, ...values } }), "Tracking sent to Shopify")} />)}</div>}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="activity">
        <Card>
          <CardHeader><CardTitle className="text-base">Connection activity</CardTitle></CardHeader>
          <CardContent><div className="divide-y">{data.logs.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No sync activity yet.</p> : data.logs.map((log) => <div key={log.id} className="flex items-start justify-between gap-4 py-3">
            <div className="flex gap-3">{log.status === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> : <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />}<div><p className="text-sm font-medium">{log.operation.replaceAll("_", " ")}</p>{log.message && <p className="text-xs text-muted-foreground">{log.message}</p>}</div></div>
            <time className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</time>
          </div>)}</div></CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings" className="space-y-4">
        <SettingsForm connection={data.connection} busy={busy} onSave={(values) => act(() => saveSettings({ data: { id: connectionId, ...values } }), "Shopify settings saved")} onRehook={() => act(() => rehook({ data: { id: connectionId } }), "Order notifications reconnected")} />
        <Card><CardHeader><CardTitle className="text-base">Danger zone</CardTitle></CardHeader><CardContent><Button variant="destructive" disabled={busy} onClick={() => { if (window.confirm("Disconnect Shopify and remove its integration data from Tejaraa?")) act(async () => { await remove({ data: { id: connectionId } }); await navigate({ to: "/dropshipping/integrations" }); }, "Shopify disconnected"); }}><Trash2 /> Disconnect Shopify</Button></CardContent></Card>
      </TabsContent>
    </Tabs>
  </div>;
}

function ProductRow({ link, product, price, missing, defaultMarkup, currency, shopDomain, checked, onChecked, onSave, onRemove }: {
  link: any; product: any; price: number | null; missing: string[]; defaultMarkup: number; currency: string; shopDomain: string;
  checked: boolean; onChecked: (value: boolean) => void;
  onSave: (values: { markupType: "percent" | "fixed"; markupValue: number | null; overridePrice: number | null }) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [markup, setMarkup] = useState(String(link.markup_value ?? defaultMarkup));
  const [override, setOverride] = useState(link.override_price ? String(link.override_price) : "");
  const ready = missing.length === 0;

  return <div className="border p-4">
    <div className="grid gap-3 lg:grid-cols-[32px_1.4fr_170px_150px_auto] lg:items-end">
      <Checkbox checked={checked} onCheckedChange={(value) => onChecked(value === true)} disabled={!ready} />
      <div className="flex items-start gap-3">
        {Array.isArray(product?.images) && product.images[0]
          ? <img src={product.images[0]} alt={product?.name ?? link.partner_sku} className="h-16 w-16 shrink-0 rounded-md border border-border object-cover" loading="lazy" />
          : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-[10px] text-muted-foreground">No image</div>}
        <div className="min-w-0">
          <p className="font-medium">{product?.name ?? link.partner_sku}</p>
          <p className="text-xs text-muted-foreground">{link.partner_sku} · {String(link.sync_status).replaceAll("_", " ")}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {ready ? <Badge>Ready to publish</Badge> : missing.map((item) => <Badge key={item} variant="outline" className="border-destructive/40 text-destructive">Missing: {item}</Badge>)}
            {link.shopify_product_id && <Badge variant="secondary">Live in Shopify</Badge>}
          </div>
          {link.last_error && <p className="mt-1 text-xs text-destructive">{link.last_error}</p>}
          {link.handle && <a className="mt-1 inline-flex items-center gap-1 text-xs text-primary" href={`https://${shopDomain}/products/${link.handle}`} target="_blank" rel="noreferrer">View in store <ExternalLink className="h-3 w-3" /></a>}
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2"><Label>Markup %</Label><Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setEditing((current) => !current)}><Pencil className="h-3 w-3" /> {editing ? "Lock" : "Edit"}</Button></div>
        <Input type="number" min="0" value={markup} disabled={!editing} onChange={(e) => setMarkup(e.target.value)} />
        <p className="text-[11px] text-muted-foreground">Sells at {price ? `${currency} ${price.toFixed(2)}` : "—"}</p>
      </div>
      <div className="space-y-1">
        <Label>Fixed price <span className="text-[11px] font-normal text-muted-foreground">optional</span></Label>
        <Input type="number" min="0" value={override} disabled={!editing} onChange={(e) => setOverride(e.target.value)} placeholder="Use markup" />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => { onSave({ markupType: "percent", markupValue: markup.trim() === "" ? null : Number(markup) || 0, overridePrice: override.trim() === "" ? null : Number(override) }); setEditing(false); }}>Save</Button>
        <Button variant="ghost" size="icon" aria-label="Remove from queue" onClick={onRemove}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  </div>;
}

function OrderRow({ order, busy, onFulfil }: { order: any; busy: boolean; onFulfil: (values: { trackingNumber?: string; carrier?: string }) => void }) {
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [carrier, setCarrier] = useState("");
  return <div className="grid gap-3 py-4 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-center">
    <div>
      <p className="font-medium">{order.order_number || order.external_id}</p>
      <p className="text-xs text-muted-foreground">{order.customer_name} · {order.shopify_order_items?.length ?? 0} items</p>
      {order.last_error && <p className="text-xs text-destructive">{order.last_error}</p>}
    </div>
    <div className="flex flex-wrap gap-1"><Badge variant="outline">{order.status}</Badge>{order.fulfillment_status && <Badge variant="secondary">{order.fulfillment_status}</Badge>}</div>
    <p className="text-sm">{order.currency} {Number(order.order_total).toFixed(2)}</p>
    <div className="flex gap-2">
      <Input className="w-36" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking no." />
      <Input className="w-28" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Carrier" />
      <Button variant="outline" disabled={busy} onClick={() => onFulfil({ ...(tracking.trim() ? { trackingNumber: tracking.trim() } : {}), ...(carrier.trim() ? { carrier: carrier.trim() } : {}) })}><Truck /> Fulfil</Button>
    </div>
  </div>;
}

type SettingsValues = { name?: string; accessToken?: string; market?: "sa" | "ae"; currency?: string; safetyStock?: number; autoSync?: boolean; pricingRules?: { type: "percent"; value: number; perMarket?: { sa?: number; ae?: number } } };

function SettingsForm({ connection, busy, onSave, onRehook }: { connection: any; busy: boolean; onSave: (values: SettingsValues) => void; onRehook: () => void }) {
  const pricing = (connection.pricing_rules ?? {}) as Record<string, unknown>;
  const [name, setName] = useState(connection.name ?? "");
  const [token, setToken] = useState("");
  const [market, setMarket] = useState<"sa" | "ae">((connection.market as "sa" | "ae") ?? "sa");
  const [currency, setCurrency] = useState(connection.currency ?? "SAR");
  const [safety, setSafety] = useState(String(connection.safety_stock ?? 0));
  const [autoSync, setAutoSync] = useState(Boolean(connection.auto_sync));
  const [markup, setMarkup] = useState(String((pricing["perMarket"] as Record<string, number> | undefined)?.[connection.market] ?? (pricing["value"] as number) ?? 15));

  return <div className="space-y-4">
    <Card><CardHeader><CardTitle className="text-base">Store</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="sh-name">Connection name</Label><Input id="sh-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="space-y-2"><Label>Store address</Label><Input value={connection.shop_domain} readOnly /></div>
      <div className="space-y-2"><Label htmlFor="sh-token">Replace access token</Label><Input id="sh-token" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Saved — paste a new token to replace it" autoComplete="new-password" /></div>
      <div className="space-y-2"><Label>Stock location</Label><Input value={connection.location_name || connection.location_id || ""} readOnly /></div>
    </CardContent></Card>

    <Card><CardHeader><CardTitle className="text-base">Selling and stock</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label>Country</Label><Select value={market} onValueChange={(value: "sa" | "ae") => setMarket(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sa">Saudi Arabia</SelectItem><SelectItem value="ae">United Arab Emirates</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="sh-currency">Currency</Label><Input id="sh-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="sh-markup">Default markup %</Label><Input id="sh-markup" type="number" min="0" value={markup} onChange={(e) => setMarkup(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="sh-safety">Safety stock kept back</Label><Input id="sh-safety" type="number" min="0" value={safety} onChange={(e) => setSafety(e.target.value)} /></div>
      <div className="flex items-center gap-3 sm:col-span-2"><Switch id="sh-auto" checked={autoSync} onCheckedChange={setAutoSync} /><Label htmlFor="sh-auto">Push stock and price to Shopify as soon as they change in Tejaraa</Label></div>
    </CardContent></Card>

    <Card><CardHeader><CardTitle className="text-base">Order notifications</CardTitle></CardHeader><CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">Shopify tells Tejaraa about new and cancelled orders. Reconnect this if orders stop arriving.</p>
      <Button variant="outline" disabled={busy} onClick={onRehook}><RefreshCw /> Reconnect order notifications</Button>
      {connection.webhooks_registered_at && <p className="text-xs text-muted-foreground">Last connected {new Date(connection.webhooks_registered_at).toLocaleString()}</p>}
    </CardContent></Card>

    <div className="flex justify-end"><Button disabled={busy} onClick={() => onSave({
      name,
      ...(token.trim() ? { accessToken: token.trim() } : {}),
      market, currency, safetyStock: Number(safety) || 0, autoSync,
      pricingRules: { type: "percent", value: Number(markup) || 0, perMarket: { [market]: Number(markup) || 0 } },
    })}>Save settings</Button></div>
  </div>;
}
