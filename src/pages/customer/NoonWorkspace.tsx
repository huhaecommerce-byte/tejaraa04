import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertCircle, ArrowLeft, BookOpen, Boxes, CheckCircle2, ExternalLink, PackageCheck, Pencil, RefreshCw, Search, Settings, ShoppingCart, Trash2, Warehouse } from "lucide-react";
import { completeNoonSetup, deleteNoonConnection, getNoonWorkspace, publishSelectedNoonProducts, retryNoonConnection, selectNoonProducts, syncNoonCategoriesForConnection, syncNoonWarehouses, toggleNoonWarehouse, updateNoonProduct, updateNoonSettings } from "@/lib/noon.functions";
import { NoonSubmissionPreview } from "@/components/noon/NoonSubmissionPreview";
import { NoonSetupWizard } from "@/components/noon/NoonSetupWizard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NoonCategorySelect } from "@/components/noon/NoonCategorySelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";

type Workspace = Awaited<ReturnType<typeof getNoonWorkspace>>;

export default function NoonWorkspace({ connectionId }: { connectionId: string }) {
  const navigate = useNavigate();
  const load = useServerFn(getNoonWorkspace);
  const choose = useServerFn(selectNoonProducts);
  const saveProduct = useServerFn(updateNoonProduct);
  const publish = useServerFn(publishSelectedNoonProducts);
  const retry = useServerFn(retryNoonConnection);
  const remove = useServerFn(deleteNoonConnection);
  const saveSettings = useServerFn(updateNoonSettings);
  const syncWarehouses = useServerFn(syncNoonWarehouses);
  const toggleWarehouse = useServerFn(toggleNoonWarehouse);
  const syncCategories = useServerFn(syncNoonCategoriesForConnection);
  const finishSetup = useServerFn(completeNoonSetup);
  const query = useQuery({ queryKey: ["noon-workspace", connectionId], queryFn: () => load({ data: { id: connectionId } }) });
  const [selected, setSelected] = useState<string[]>([]);
  const [publishIds, setPublishIds] = useState<string[]>([]);
  const [forceResubmit, setForceResubmit] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const rowDrafts = useRef<Record<string, { categoryCode: string; gtin: string; markups: Record<string, string> }>>({});
  const data = query.data as Workspace | undefined;
  const linkedProductIds = new Set((data?.links ?? []).map((link) => link.product_id));
  const filtered = useMemo(() => (data?.products ?? []).filter((product) => `${product.name} ${product.name_ar ?? ""} ${product.sku}`.toLowerCase().includes(search.toLowerCase())), [data?.products, search]);

  const act = async (run: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try { await run(); toast.success(success); await query.refetch(); } catch (error) { toast.error(error instanceof Error ? error.message : "Action failed"); } finally { setBusy(false); }
  };
  if (query.isLoading) return <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-96" /></div>;
  if (!data) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Workspace unavailable</AlertTitle><AlertDescription>Refresh the page or reconnect your Noon store.</AlertDescription></Alert>;
  const healthy = data.connection.status === "healthy";
  const setupDone = Boolean((data.connection as any).setup_completed_at);

  if (!setupDone) return <div className="space-y-6">
    <div className="flex items-center gap-3 border-b pb-5">
      <Button variant="ghost" size="icon" asChild><Link to="/dropshipping/fulfillment" search={{ tab: "integrations" }} aria-label="Back to integrations"><ArrowLeft /></Link></Button>
      <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold">{data.connection.name}</h1><Badge variant={healthy ? "default" : "destructive"}>{data.connection.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">Setup required before the workspace opens</p></div>
    </div>
    <NoonSetupWizard
      connection={data.connection}
      warehouses={data.warehouses}
      busy={busy}
      onSyncWarehouses={() => act(async () => { const result = await syncWarehouses({ data: { id: connectionId } }); if (!result.count) toast.info("Noon has no warehouses on this account yet."); }, "Warehouses synced from Noon")}
      onSave={(values) => act(() => finishSetup({ data: { id: connectionId, ...values } }), "Setup complete — your Noon workspace is unlocked")}
    />
  </div>;


  return <div className="space-y-6">
    <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3"><Button variant="ghost" size="icon" asChild><Link to="/dropshipping/fulfillment" search={{ tab: "integrations" }} aria-label="Back to integrations"><ArrowLeft /></Link></Button><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold">{data.connection.name}</h1><Badge variant={healthy ? "default" : "destructive"}>{data.connection.status}</Badge><Badge variant="outline" className="uppercase">{data.connection.mode}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{data.connection.project_code} · {(data.connection.enabled_markets as string[]).map((market) => market.toUpperCase()).join(" + ")}</p></div></div>
      <Button variant="outline" disabled={busy} onClick={() => act(() => retry({ data: { id: connectionId } }), "Connection verified and categories refreshed")}><RefreshCw /> Test connection</Button>
    </div>
    {!healthy && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Noon needs attention</AlertTitle><AlertDescription>{data.connection.last_error || "Check the service-account details and retry."}</AlertDescription></Alert>}
    <div className="grid gap-3 sm:grid-cols-4">{([
      ["Selected products", data.links.length, Boxes], ["Ready or submitted", data.links.filter((link) => ["ready", "submitted"].includes(link.sync_status)).length, PackageCheck], ["Imported orders", data.orders.length, ShoppingCart], ["Recent sync events", data.logs.length, Activity],
    ] as const).map(([label, value, Icon]) => <Card key={label}><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>)}</div>

    <Tabs defaultValue="products" className="space-y-4">
      <TabsList className="w-full overflow-x-auto"><TabsTrigger value="products"><Boxes /> Products</TabsTrigger><TabsTrigger value="orders"><ShoppingCart /> Orders</TabsTrigger><TabsTrigger value="activity"><Activity /> Activity</TabsTrigger><TabsTrigger value="settings"><Settings /> Settings</TabsTrigger><TabsTrigger value="docs"><BookOpen /> Setup guide</TabsTrigger></TabsList>
      <TabsContent value="products" className="space-y-4">
        <Card><CardHeader><CardTitle className="text-base">Choose catalog products</CardTitle></CardHeader><CardContent className="space-y-4"><div className="relative max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or SKU" className="pl-9" /></div><div className="max-h-72 divide-y overflow-y-auto border"><div className="grid grid-cols-[36px_1fr_120px] gap-3 bg-muted/50 px-3 py-2 text-xs font-medium"><span /><span>Product</span><span>Status</span></div>{filtered.map((product) => <label key={product.id} className="grid cursor-pointer grid-cols-[36px_1fr_120px] items-center gap-3 px-3 py-3 text-sm hover:bg-muted/40"><Checkbox disabled={linkedProductIds.has(product.id)} checked={linkedProductIds.has(product.id) || selected.includes(product.id)} onCheckedChange={(checked) => setSelected((current) => checked ? [...current, product.id] : current.filter((id) => id !== product.id))} /><span className="min-w-0"><strong className="block truncate">{product.name}</strong><span className="text-xs text-muted-foreground">{product.sku} · stock {product.stock_qty}</span></span><Badge variant="outline">{linkedProductIds.has(product.id) ? "Selected" : product.gtin ? "Has GTIN" : "No GTIN"}</Badge></label>)}</div><Button disabled={!selected.length || busy} onClick={() => act(async () => { await choose({ data: { connectionId, productIds: selected } }); setSelected([]); }, "Products added to Noon workspace")}><PackageCheck /> Add {selected.length || ""} products</Button></CardContent></Card>
        <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-base">Publishing queue</CardTitle><div className="flex gap-2"><Button variant="outline" disabled={busy || !healthy} onClick={() => act(async () => { await syncCategories({ data: { id: connectionId } }); }, "Noon categories refreshed")}><RefreshCw /> Refresh categories</Button>{(() => { const failedIds = data.links.filter((link) => ["failed", "content_only"].includes(link.sync_status)).map((link) => link.id); return <Button variant="outline" disabled={!failedIds.length || busy || !healthy} onClick={() => setPublishIds(failedIds)}><RefreshCw /> Retry failed only{failedIds.length ? ` (${failedIds.length})` : ""}</Button>; })()}<NoonSubmissionPreview connectionId={connectionId} linkIds={publishIds} disabled={busy || !healthy} /><Button disabled={!publishIds.length || busy || !healthy} onClick={() => act(async () => { for (const linkId of publishIds) { const draft = rowDrafts.current[linkId]; if (draft?.categoryCode) { await saveProduct({ data: { connectionId, linkId, categoryCode: draft.categoryCode, ...(draft.gtin.trim() ? { gtin: draft.gtin.trim() } : {}), markupType: "percent", markupValue: Number(draft.markups['sa'] ?? draft.markups['ae']) || 0, minimumMargin: 0, markups: Object.fromEntries(Object.entries(draft.markups).map(([market, value]) => [market, Number(value) || 0])) } }); } } const result = await publish({ data: { connectionId, linkIds: publishIds, force: forceResubmit } }); const failures = result.results.filter((item) => !item.ok); if (failures.length) throw new Error(failures.map((item) => item.error ?? "Needs attention").slice(0, 3).join(" · ")); setPublishIds([]); }, "Products sent to Noon")}><ExternalLink /> Publish selected</Button><label className="flex items-center gap-2 text-xs text-muted-foreground"><Checkbox checked={forceResubmit} onCheckedChange={(value) => setForceResubmit(value === true)} /> Resubmit already-sent products</label></div></div></CardHeader><CardContent><div className="space-y-3">{data.links.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Select products above to prepare them for Noon.</p> : data.links.map((link) => { const product = data.products.find((entry) => entry.id === link.product_id); return <ProductRow key={link.id} link={link} product={product} categories={data.categories} missing={(data.readiness as Record<string, string[]> | undefined)?.[link.id] ?? []} checked={publishIds.includes(link.id)} markets={(data.connection.enabled_markets as string[]) ?? []} pricing={(data.connection.pricing_rules ?? {}) as Record<string, unknown>} settings={((data as any).marketSettings ?? []).filter((setting: any) => setting.product_link_id === link.id)} onChecked={(checked) => setPublishIds((current) => checked ? [...current, link.id] : current.filter((id) => id !== link.id))} onChange={(values) => { rowDrafts.current[link.id] = values; }} onSave={(values) => act(() => saveProduct({ data: { connectionId, linkId: link.id, ...values } }), "Publishing details saved")} />; })}</div></CardContent></Card>
      </TabsContent>
      <TabsContent value="orders"><Card><CardHeader><CardTitle className="text-base">FBPI orders</CardTitle></CardHeader><CardContent>{data.orders.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">New Noon orders will appear here after the webhook is configured.</p> : <div className="divide-y">{data.orders.map((order) => <div key={order.id} className="grid gap-3 py-4 sm:grid-cols-4"><div><p className="font-medium">{order.external_reference}</p><p className="text-xs text-muted-foreground">{order.market.toUpperCase()} · {order.warehouse_code || "No warehouse"}</p></div><div><Badge variant="outline">{order.external_status || order.status}</Badge></div><p className="text-sm">{order.currency} {Number(order.order_total).toFixed(2)}</p><p className="text-xs text-muted-foreground">{order.noon_order_items?.length ?? 0} items</p></div>)}</div>}</CardContent></Card></TabsContent>
      <TabsContent value="activity"><Card><CardHeader><CardTitle className="text-base">Connection activity</CardTitle></CardHeader><CardContent><div className="divide-y">{data.logs.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No sync activity yet.</p> : data.logs.map((log) => <div key={log.id} className="flex items-start justify-between gap-4 py-3"><div className="flex gap-3">{log.status === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> : <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />}<div><p className="text-sm font-medium">{log.operation.replaceAll("_", " ")}</p>{log.message && <p className="text-xs text-muted-foreground">{log.message}</p>}</div></div><time className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</time></div>)}</div></CardContent></Card></TabsContent>
      <TabsContent value="settings" className="space-y-4">
        <Card><CardHeader><CardTitle className="text-base">Connection settings</CardTitle></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><Info label="Credential" value={data.connection.credential_label} /><Info label="Project code" value={data.connection.project_code} /><Info label="Status" value={data.connection.status} /></div></CardContent></Card>
        <SettingsForm connection={data.connection} warehouses={data.warehouses} busy={busy} onSave={(values) => act(() => saveSettings({ data: { id: connectionId, ...values } }), "Noon settings saved")} onSyncWarehouses={() => act(async () => { const result = await syncWarehouses({ data: { id: connectionId } }); if (!result.count) toast.info("Noon has no warehouses on this account yet — you can add codes manually below."); }, "Warehouses synced from Noon")} onToggleWarehouse={(warehouseId, enabled) => act(() => toggleWarehouse({ data: { warehouseId, enabled } }), enabled ? "Warehouse enabled — stock will be pushed to it" : "Warehouse disabled — it will no longer receive stock")} />
        <Card><CardHeader><CardTitle className="text-base">Danger zone</CardTitle></CardHeader><CardContent><Button variant="destructive" disabled={busy} onClick={() => { if (window.confirm("Disconnect Noon and remove its imported integration data?")) act(async () => { await remove({ data: { id: connectionId } }); await navigate({ to: "/dropshipping/fulfillment", search: { tab: "integrations" } }); }, "Noon disconnected"); }}><Trash2 /> Disconnect Noon</Button></CardContent></Card>
      </TabsContent>
      <TabsContent value="docs"><Card><CardHeader><CardTitle className="text-base">Noon setup guide</CardTitle></CardHeader><CardContent className="space-y-5 text-sm"><Step number="1" title="Create a Noon service account">Create credentials for the correct seller project and copy the Key ID, project code, and private key.</Step><Step number="2" title="Validate in sandbox">Keep this connection in Sandbox while you map categories and submit test products.</Step><Step number="3" title="Add the order webhook">In Noon, register the endpoint shown in Settings for FBPI::ORDER_SYNC and use the verification token entered during connection.</Step><Step number="4" title="Publish selected products">Select only the Tejaraa catalog items you want. Add a Noon category and pricing rules, then publish. A barcode is optional.</Step><Step number="5" title="Move to production">Create a production connection only after Noon accepts your sandbox product and order tests.</Step><Alert><AlertCircle className="h-4 w-4" /><AlertTitle>FBPI scope</AlertTitle><AlertDescription>Orders and shipping are partner-fulfilled. Manifest and pickup scheduling still happens in Noon Seller Lab.</AlertDescription></Alert></CardContent></Card></TabsContent>
    </Tabs>
  </div>;
}

function ProductRow({ link, product, categories, missing, checked, markets, pricing, settings, onChecked, onChange, onSave }: { link: any; product: any; categories: any[]; missing: string[]; checked: boolean; markets: string[]; pricing: Record<string, unknown>; settings: any[]; onChecked: (value: boolean) => void; onChange?: (values: { categoryCode: string; gtin: string; markups: Record<string, string> }) => void; onSave: (values: { categoryCode: string; gtin?: string; markupType: "percent" | "fixed"; markupValue: number; minimumMargin: number; markups?: { sa?: number; ae?: number }; saPrice?: number; aePrice?: number }) => void }) {
  const [categoryCode, setCategoryCode] = useState(link.noon_category_code ?? ""); const [gtin, setGtin] = useState(product?.gtin ?? product?.sku ?? link.partner_sku ?? ""); const [margin, setMargin] = useState("10"); const [editingMarkup, setEditingMarkup] = useState(false);
  const perMarket = (pricing['perMarket'] ?? {}) as Record<string, number>;
  const defaultFor = (market: string) => Number(perMarket[market] ?? pricing['value'] ?? 15);
  const savedFor = (market: string) => settings.find((setting) => setting.market === market);
  const [markups, setMarkups] = useState<Record<string, string>>(() => Object.fromEntries(markets.map((market) => [market, String(savedFor(market)?.markup_value ?? defaultFor(market))])));
  useEffect(() => { onChange?.({ categoryCode, gtin, markups }); }, [categoryCode, gtin, markups]);
  const satisfied = new Set<string>(); if (categoryCode) satisfied.add("Noon category"); const barcodeOk = /^[A-Za-z0-9][A-Za-z0-9-]{4,29}$/.test(gtin.trim()); if (barcodeOk) satisfied.add("GTIN / barcode");
  const stillMissing = (missing as string[]).filter((item) => !satisfied.has(item));
  const completedHere = [...satisfied].filter((item) => missing.includes(item));
  const ready = stillMissing.length === 0;
  const marketLabel = (market: string) => (market === "sa" ? "Saudi" : market === "ae" ? "UAE" : market.toUpperCase());
  return <div className="border p-4"><div className="grid gap-3 lg:grid-cols-[32px_1.2fr_110px_1fr_auto] lg:items-end"><Checkbox checked={checked} onCheckedChange={(value) => onChecked(value === true)} disabled={!ready} /><div className="flex items-start gap-3">{Array.isArray(product?.images) && product.images[0] ? <img src={product.images[0]} alt={product?.name ?? link.partner_sku} className="h-16 w-16 shrink-0 rounded-md border border-border object-cover" loading="lazy" /> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-[10px] text-muted-foreground">No image</div>}<div className="min-w-0"><p className="font-medium">{product?.name ?? link.partner_sku}</p><p className="text-xs text-muted-foreground">{link.partner_sku} · {String(link.sync_status).replaceAll("_", " ")}</p>{link.content_status === "submitted" && link.noon_sku_parent && (link.noon_variant_sku || link.psku_code) && <p className="text-xs text-muted-foreground">Sent to Noon as {link.noon_sku_parent} — waiting for Noon to review and list it. It will not be sent again unless you tick “Resubmit already-sent products”.</p>}<div className="mt-1 flex flex-wrap gap-1">{ready ? <Badge>Ready to publish</Badge> : <>{completedHere.map((item) => <Badge key={item} variant="outline" className="border-primary/40 bg-primary/10 text-primary"><CheckCircle2 className="h-3 w-3" /> {item}</Badge>)}{stillMissing.map((item) => <Badge key={item} variant="outline" className="border-destructive/40 text-destructive">Missing: {item}</Badge>)}</>}</div>{link.last_error && <p className="mt-1 text-xs text-destructive">{link.last_error}</p>}</div></div><div className="space-y-1"><Label>Barcode (GTIN) <span className="text-[11px] font-normal text-muted-foreground">optional</span></Label><Input value={gtin} onChange={(e) => setGtin(e.target.value)} placeholder="Barcode or SKU code" />{gtin.trim() !== "" && !barcodeOk ? <p className="text-[11px] text-destructive">Invalid — use 5 to 30 letters, numbers or dashes, or leave it empty</p> : <p className="text-[11px] text-muted-foreground">Sent to Noon after the product is accepted. Defaults to the product SKU.</p>}</div><div className="space-y-1"><div className="flex items-center justify-between gap-2"><Label>Markup %</Label><Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setEditingMarkup((current) => !current)}><Pencil className="h-3 w-3" /> {editingMarkup ? "Lock" : "Edit"}</Button></div><div className="flex gap-2">{markets.map((market) => <div key={market} className="flex-1 space-y-1"><Label className="text-[11px] text-muted-foreground">{marketLabel(market)}</Label><Input type="number" min="0" value={markups[market] ?? ""} disabled={!editingMarkup} onChange={(e) => setMarkups((current) => ({ ...current, [market]: e.target.value }))} /></div>)}</div></div><Button variant="outline" onClick={() => { onSave({ categoryCode, gtin, markupType: "percent", markupValue: Number(markups['sa'] ?? markups['ae']) || 0, minimumMargin: Number(margin) || 0, markups: Object.fromEntries(markets.map((market) => [market, Number(markups[market]) || 0])) }); setEditingMarkup(false); }}>Save</Button></div><div className="mt-3 space-y-1"><Label>Noon category</Label><NoonCategorySelect rows={categories} value={categoryCode || null} onChange={setCategoryCode} /></div></div>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium capitalize">{value || "—"}</p></div>; }

type SettingsValues = { name: string; mode: "sandbox" | "production"; markets: Array<"sa" | "ae">; webhookSecret?: string; keyId?: string; projectCode?: string; warehouses: Array<{ market: "sa" | "ae"; code: string; processingTime: number; safetyStock: number }>; pricingRules: { type: "percent" | "fixed"; value: number; perMarket?: { sa?: number; ae?: number } } };

function SettingsForm({ connection, warehouses, busy, onSave, onSyncWarehouses, onToggleWarehouse }: { connection: any; warehouses: any[]; busy: boolean; onSave: (values: SettingsValues) => void; onSyncWarehouses: () => void; onToggleWarehouse: (warehouseId: string, enabled: boolean) => void }) {
  const pricing = (connection.pricing_rules ?? {}) as Record<string, unknown>;
  const warehouseFor = (market: string) => warehouses.find((warehouse) => warehouse.market === market);
  const [name, setName] = useState(connection.name ?? "");
  const [mode, setMode] = useState<"sandbox" | "production">(connection.mode ?? "sandbox");
  const [keyId, setKeyId] = useState(connection.key_id ?? "");
  const [projectCode, setProjectCode] = useState(connection.project_code ?? "");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [sa, setSa] = useState(warehouseFor("sa")?.warehouse_code ?? "");
  const [ae, setAe] = useState(warehouseFor("ae")?.warehouse_code ?? "");
  const [processing, setProcessing] = useState(String(warehouseFor("sa")?.processing_time ?? warehouseFor("ae")?.processing_time ?? 1));
  const [safety, setSafety] = useState(String(warehouseFor("sa")?.safety_stock ?? warehouseFor("ae")?.safety_stock ?? 2));
  const perMarket = (pricing['perMarket'] ?? {}) as Record<string, number>;
  const [markupSa, setMarkupSa] = useState(String(perMarket['sa'] ?? (pricing['value'] as number) ?? 15));
  const [markupAe, setMarkupAe] = useState(String(perMarket['ae'] ?? (pricing['value'] as number) ?? 15));

  const submit = () => {
    const list = [sa ? { market: "sa" as const, code: sa } : null, ae ? { market: "ae" as const, code: ae } : null].filter(Boolean) as Array<{ market: "sa" | "ae"; code: string }>;
    if (!list.length) { toast.error("Add at least one warehouse code."); return; }
    if (webhookSecret && webhookSecret.length < 24) { toast.error("The webhook token must be at least 24 characters."); return; }
    onSave({
      name, mode, markets: list.map((entry) => entry.market),
      ...(webhookSecret ? { webhookSecret } : {}),
      ...(keyId.trim() ? { keyId: keyId.trim() } : {}),
      ...(projectCode.trim() ? { projectCode: projectCode.trim() } : {}),
      warehouses: list.map((entry) => ({ ...entry, processingTime: Number(processing) || 0, safetyStock: Number(safety) || 0 })),
      pricingRules: { type: "percent", value: Number(markupSa) || Number(markupAe) || 0, perMarket: { sa: Number(markupSa) || 0, ae: Number(markupAe) || 0 } },
    });
  };

  return <div className="space-y-4">
    <Card><CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="set-name">Connection name</Label><Input id="set-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="space-y-2"><Label>Environment</Label><Select value={mode} onValueChange={(value: "sandbox" | "production") => setMode(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sandbox">Sandbox</SelectItem><SelectItem value="production">Production</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="set-key-id">Key ID (service account)</Label><Input id="set-key-id" value={keyId} onChange={(e) => setKeyId(e.target.value)} placeholder="As shown next to the key in the Noon portal" /></div>
      <div className="space-y-2"><Label htmlFor="set-project">Project code</Label><Input id="set-project" value={projectCode} onChange={(e) => setProjectCode(e.target.value)} placeholder="Filled automatically after a successful login" /></div>
    </CardContent></Card>

    <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-base flex items-center gap-2"><Warehouse className="h-4 w-4" /> Your Noon warehouses</CardTitle><Button variant="outline" size="sm" disabled={busy} onClick={onSyncWarehouses}><RefreshCw /> Sync from Noon</Button></div></CardHeader><CardContent className="space-y-3">
      <p className="text-xs text-muted-foreground">Every warehouse on your Noon account appears here with its status. Turn on the ones we should send stock to.</p>
      {warehouses.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No warehouses yet — sync from Noon or add codes manually below.</p> : <div className="divide-y">{warehouses.map((warehouse) => <div key={warehouse.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-3"><Switch checked={Boolean(warehouse.enabled)} disabled={busy} onCheckedChange={(checked) => onToggleWarehouse(warehouse.id, checked)} aria-label={`Use warehouse ${warehouse.warehouse_code}`} /><div><p className="text-sm font-medium">{warehouse.warehouse_name || warehouse.warehouse_code}</p><p className="text-xs text-muted-foreground">{warehouse.warehouse_code} · {String(warehouse.market).toUpperCase()} · {warehouse.processing_time}d processing · safety {warehouse.safety_stock}</p></div></div>
        <div className="flex items-center gap-2"><Badge variant={warehouse.noon_status === "active" ? "default" : "secondary"}>{warehouse.noon_status === "active" ? "Active on Noon" : "Inactive on Noon"}</Badge><Badge variant={warehouse.enabled ? "default" : "outline"}>{warehouse.enabled ? "In use" : "Not used"}</Badge></div>
      </div>)}</div>}
    </CardContent></Card>

    <Card><CardHeader><CardTitle className="text-base">Markets and warehouses</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="set-sa">Saudi warehouse code</Label><Input id="set-sa" value={sa} onChange={(e) => setSa(e.target.value)} placeholder="Leave empty to skip Saudi Arabia" /></div>
      <div className="space-y-2"><Label htmlFor="set-ae">UAE warehouse code</Label><Input id="set-ae" value={ae} onChange={(e) => setAe(e.target.value)} placeholder="Leave empty to skip UAE" /></div>
      <div className="space-y-2"><Label htmlFor="set-processing">Processing days</Label><Input id="set-processing" type="number" min="0" value={processing} onChange={(e) => setProcessing(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="set-safety">Safety stock</Label><Input id="set-safety" type="number" min="0" value={safety} onChange={(e) => setSafety(e.target.value)} /></div>
    </CardContent></Card>

    <Card><CardHeader><CardTitle className="text-base">Pricing defaults</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="set-markup-sa">Saudi markup %</Label><Input id="set-markup-sa" type="number" min="0" value={markupSa} onChange={(e) => setMarkupSa(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="set-markup-ae">UAE markup %</Label><Input id="set-markup-ae" type="number" min="0" value={markupAe} onChange={(e) => setMarkupAe(e.target.value)} /></div>
    </CardContent></Card>

    <Card><CardHeader><CardTitle className="text-base">Order webhook</CardTitle></CardHeader><CardContent className="space-y-4">
      <Alert><AlertTitle>Webhook endpoint</AlertTitle><AlertDescription className="break-all">https://tejaraa03.lovable.app/api/public/noon/events?token=YOUR_TOKEN</AlertDescription></Alert>
      <div className="space-y-2"><Label htmlFor="set-webhook">Webhook verification token</Label><Input id="set-webhook" type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder={connection.webhook_secret_hash ? "Saved — enter a new token to replace it" : "Create a strong token of at least 24 characters"} autoComplete="new-password" /><p className="text-xs text-muted-foreground">Use this same value in Noon’s webhook URL as <code>?token=YOUR_TOKEN</code>.</p></div>
    </CardContent></Card>

    <div className="flex justify-end"><Button disabled={busy} onClick={submit}>Save settings</Button></div>
  </div>;
}
function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) { return <div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{number}</span><div><p className="font-medium">{title}</p><p className="mt-1 text-muted-foreground">{children}</p></div></div>; }