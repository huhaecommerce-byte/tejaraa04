import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const warehouseSchema = z.object({ market: z.enum(["sa", "ae"]), code: z.string().trim().min(1).max(100), processingTime: z.number().int().min(0).max(30), safetyStock: z.number().int().min(0).max(100000) });
const pricingSchema = z.object({ type: z.enum(["percent", "fixed"]), value: z.number().min(0).max(100000), perMarket: z.object({ sa: z.number().min(0).max(100000).optional(), ae: z.number().min(0).max(100000).optional() }).optional(), minimumMargin: z.number().min(0).max(100).optional(), rounding: z.enum(["none", "whole", "ninety_nine"]).optional() });

const connectionSchema = z.object({
  name: z.string().trim().min(2).max(80),
  privateKey: z.string().min(80).max(12000),
  keyId: z.string().trim().min(2).max(200).optional(),
});

const settingsSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(80).optional(),
  mode: z.enum(["sandbox", "production"]).optional(),
  keyId: z.string().trim().min(2).max(200).optional(),
  projectCode: z.string().trim().min(1).max(100).optional(),
  markets: z.array(z.enum(["sa", "ae"])).min(1).max(2).optional(),
  webhookSecret: z.string().min(24).max(256).optional(),
  warehouses: z.array(warehouseSchema).max(4).optional(),
  pricingRules: pricingSchema.optional(),
});

async function planAllowsMarketplace(context: { supabase: any; userId: string }) {
  const [{ data: defaults }, { data: overrides }, { count }] = await Promise.all([
    context.supabase.from("usage_limit_defaults").select("limit_key,limit_value").in("limit_key", ["marketplace_api", "store_integrations_max"]),
    context.supabase.from("customer_usage_limits").select("limit_key,limit_value").eq("user_id", context.userId).in("limit_key", ["marketplace_api", "store_integrations_max"]),
    context.supabase.from("store_integrations").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
  ]);
  const values = new Map<string, string>();
  for (const row of defaults ?? []) values.set(row.limit_key, row.limit_value ?? "unlimited");
  for (const row of overrides ?? []) values.set(row.limit_key, row.limit_value ?? "unlimited");
  const api = (values.get("marketplace_api") ?? "unlimited").toLowerCase();
  if (["no", "false", "0", "disabled"].includes(api)) throw new Error("Your plan does not include marketplace API integrations");
  const rawLimit = values.get("store_integrations_max") ?? "unlimited";
  const limit = /^\d+$/.test(rawLimit) ? Number(rawLimit) : Infinity;
  if ((count ?? 0) >= limit) throw new Error("Your connected store limit has been reached");
}

async function ownedConnection(admin: any, userId: string, id: string) {
  const { data, error } = await admin.from("noon_connections").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Noon connection not found");
  return data;
}

export const listNoonConnections = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("noon_connections").select("id,name,mode,project_code,credential_label,enabled_markets,status,last_auth_at,last_product_sync_at,last_inventory_sync_at,last_order_sync_at,last_error,created_at").eq("user_id", context.userId).order("created_at", { ascending: false });
  if (error) throw error;
  return { connections: data ?? [] };
});

export const connectNoon = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => connectionSchema.parse(input)).handler(async ({ data, context }) => {
  await planAllowsMarketplace(context as never);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { encryptCredential, parseNoonCredential, testNoonConnection, discoverNoonAccount } = await import("@/lib/noon.server");
  const parsed = parseNoonCredential(data.privateKey, data.keyId);
  const { data: store, error: storeError } = await supabaseAdmin.from("store_integrations").insert({ user_id: context.userId, platform: "noon", store_name: data.name, store_url: "https://noon.partners", status: "pending" }).select("id").single();
  if (storeError) throw storeError;
  const { data: connection, error } = await supabaseAdmin.from("noon_connections").insert({ user_id: context.userId, store_integration_id: store.id, name: data.name, mode: "production", key_id: parsed.keyId, private_key_ciphertext: encryptCredential(parsed.privateKey), project_code: parsed.projectCode, credential_label: `${parsed.keyId.slice(0, 6)}…${parsed.keyId.slice(-4)}`, enabled_markets: ["sa"], pricing_rules: { type: "percent", value: 15, perMarket: { sa: 15, ae: 15 } } }).select("*").single();
  if (error) { await supabaseAdmin.from("store_integrations").delete().eq("id", store.id); throw error; }
  try {
    await testNoonConnection(connection);
    await supabaseAdmin.from("noon_connections").update({ status: "healthy", last_auth_at: new Date().toISOString(), last_error: null }).eq("id", connection.id);
    await supabaseAdmin.from("store_integrations").update({ status: "active" }).eq("id", store.id);
    const discovery = await discoverNoonAccount(supabaseAdmin, { ...connection, status: "healthy" });
    return { id: connection.id, ok: true, discovered: { projectCode: discovery.projectCode, markets: discovery.markets, warehouses: discovery.warehouses, categories: discovery.categories } };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Noon connection failed";
    await supabaseAdmin.from("noon_connections").update({ status: "error", last_error: message }).eq("id", connection.id);
    return { id: connection.id, ok: false, error: message };
  }
});

export const getNoonWorkspace = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.id);
  const { noonReadiness } = await import("@/lib/noon.server");
  // The category tree exceeds the API's 1,000-row page size, so load it in pages.
  const fetchCategories = async () => {
    const all: { category_code: string; name_en: string | null; name_ar: string | null; parent_code: string | null; level: number | null; path_en: string | null; path_ar: string | null }[] = [];
    const PAGE = 1000;
    for (let i = 0; i < 20; i++) {
      const { data: batch } = await supabaseAdmin.from("noon_category_cache").select("category_code,name_en,name_ar,parent_code,level,path_en,path_ar").order("path_en").range(i * PAGE, i * PAGE + PAGE - 1);
      const rows = batch ?? [];
      all.push(...rows);
      if (rows.length < PAGE) break;
    }
    return all;
  };
  const [{ data: warehouses }, { data: links }, { data: products }, categories, { data: orders }, { data: logs }, { data: marketSettings }] = await Promise.all([
    supabaseAdmin.from("noon_warehouses").select("*").eq("connection_id", data.id).order("market"),
    supabaseAdmin.from("noon_product_links").select("*").eq("connection_id", data.id),
    supabaseAdmin.from("products").select("id,name,name_ar,sku,gtin,images,price_sar,price_usd,cost_usd,stock_qty,top_category,sub_category,detailed_category,description,description_ar").order("updated_at", { ascending: false }).limit(500),
    fetchCategories(),
    supabaseAdmin.from("noon_orders").select("*,noon_order_items(*)").eq("connection_id", data.id).order("created_at", { ascending: false }).limit(100),
    supabaseAdmin.from("noon_sync_log").select("*").eq("connection_id", data.id).order("created_at", { ascending: false }).limit(100),
    supabaseAdmin.from("noon_product_market_settings").select("*").eq("user_id", context.userId),
  ]);
  const productsById = new Map((products ?? []).map((product) => [product.id, product]));
  const readiness: Record<string, string[]> = {};
  for (const link of links ?? []) readiness[link.id] = noonReadiness(link, productsById.get(link.product_id) as never, (marketSettings ?? []) as never, (warehouses ?? []) as never, connection);
  return { connection: { ...connection, private_key_ciphertext: undefined }, warehouses: warehouses ?? [], links: links ?? [], products: products ?? [], categories: categories ?? [], orders: orders ?? [], logs: logs ?? [], readiness, marketSettings: marketSettings ?? [] };
});

export const syncNoonWarehouses = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.id);
  const { fetchNoonWarehouses } = await import("@/lib/noon.server");
  const count = await fetchNoonWarehouses(supabaseAdmin, connection);
  return { count };
});

export const completeNoonSetup = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
  id: z.string().uuid(),
  markets: z.array(z.enum(["sa", "ae"])).min(1).max(2),
  warehouseIds: z.array(z.string().uuid()).min(1).max(50),
  pricingRules: pricingSchema,
}).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await ownedConnection(supabaseAdmin, context.userId, data.id);
  const { data: warehouses, error: warehouseError } = await supabaseAdmin.from("noon_warehouses").select("id,market").eq("connection_id", data.id);
  if (warehouseError) throw warehouseError;
  const chosen = (warehouses ?? []).filter((warehouse) => data.warehouseIds.includes(warehouse.id));
  if (!chosen.length) throw new Error("Choose at least one warehouse to use");
  const uncovered = data.markets.filter((market) => !chosen.some((warehouse) => warehouse.market === market));
  if (uncovered.length) throw new Error(`Choose a warehouse for ${uncovered.map((market) => market.toUpperCase()).join(" and ")}`);
  for (const warehouse of warehouses ?? []) {
    await supabaseAdmin.from("noon_warehouses").update({ enabled: data.warehouseIds.includes(warehouse.id), updated_at: new Date().toISOString() } as never).eq("id", warehouse.id);
  }
  const { error } = await supabaseAdmin.from("noon_connections").update({ enabled_markets: data.markets, pricing_rules: data.pricingRules, setup_completed_at: new Date().toISOString() } as never).eq("id", data.id).eq("user_id", context.userId);
  if (error) throw error;
  return { ok: true };
});

export const toggleNoonWarehouse = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ warehouseId: z.string().uuid(), enabled: z.boolean(), processingTime: z.number().int().min(0).max(30).optional(), safetyStock: z.number().int().min(0).max(100000).optional() }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const patch: Record<string, unknown> = { enabled: data.enabled, updated_at: new Date().toISOString() };
  if (data.processingTime !== undefined) patch["processing_time"] = data.processingTime;
  if (data.safetyStock !== undefined) patch["safety_stock"] = data.safetyStock;
  const { error } = await supabaseAdmin.from("noon_warehouses").update(patch as never).eq("id", data.warehouseId).eq("user_id", context.userId);
  if (error) throw error;
  return { ok: true };
});

export const syncNoonCategoriesForConnection = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.id);
  const { syncNoonCategories } = await import("@/lib/noon.server");
  return syncNoonCategories(supabaseAdmin, connection);
});

export const selectNoonProducts = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ connectionId: z.string().uuid(), productIds: z.array(z.string().uuid()).min(1).max(200) }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.connectionId);
  const { data: products, error } = await supabaseAdmin.from("products").select("id,sku").in("id", data.productIds);
  if (error) throw error;
  const { error: upsertError } = await supabaseAdmin.from("noon_product_links").upsert((products ?? []).map((product) => ({ user_id: context.userId, connection_id: connection.id, product_id: product.id, partner_sku: product.sku, selected_markets: connection.enabled_markets })), { onConflict: "connection_id,product_id" });
  if (upsertError) throw upsertError;
  return { selected: products?.length ?? 0 };
});

export const updateNoonProduct = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ connectionId: z.string().uuid(), linkId: z.string().uuid(), categoryCode: z.string().min(1).max(200), gtin: z.string().trim().max(40).optional(), markupType: z.enum(["percent", "fixed"]), markupValue: z.number().min(0).max(100000), minimumMargin: z.number().min(0).max(100), saPrice: z.number().positive().optional(), aePrice: z.number().positive().optional(), markups: z.object({ sa: z.number().min(0).max(100000).optional(), ae: z.number().min(0).max(100000).optional() }).optional() }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await ownedConnection(supabaseAdmin, context.userId, data.connectionId);
  const { data: link } = await supabaseAdmin.from("noon_product_links").select("product_id").eq("id", data.linkId).eq("connection_id", data.connectionId).eq("user_id", context.userId).single();
  if (!link) throw new Error("Selected Noon product was not found");
  if (data.gtin !== undefined && data.gtin.trim() === "") {
    // A barcode is optional for KSA/UAE partner-fulfilled selling; clear it when emptied.
    await supabaseAdmin.from("products").update({ gtin: null }).eq("id", link.product_id);
  } else if (data.gtin) {
    const { isValidBarcode, BARCODE_MESSAGE } = await import("@/lib/noon.server");
    const barcode = data.gtin.trim();
    if (!isValidBarcode(barcode)) throw new Error(BARCODE_MESSAGE);
    const { data: duplicates } = await supabaseAdmin.from("products").select("sku").eq("gtin", barcode).neq("id", link.product_id).limit(1);
    if (duplicates?.length) throw new Error(`Barcode "${barcode}" is already used by product ${duplicates[0].sku}`);
    await supabaseAdmin.from("products").update({ gtin: barcode }).eq("id", link.product_id);
  }
  await supabaseAdmin.from("noon_product_links").update({ noon_category_code: data.categoryCode, sync_status: "ready", last_error: null }).eq("id", data.linkId);
  const marketRows = (["sa", "ae"] as const).filter((market) => !data.markups || data.markups[market] !== undefined || (market === "sa" ? data.saPrice : data.aePrice) !== undefined).map((market) => ({ user_id: context.userId, product_link_id: data.linkId, market, markup_type: data.markupType, markup_value: data.markups?.[market] ?? data.markupValue, minimum_margin_percent: data.minimumMargin, override_price: market === "sa" ? data.saPrice ?? null : data.aePrice ?? null }));
  if (marketRows.length) await supabaseAdmin.from("noon_product_market_settings").upsert(marketRows, { onConflict: "product_link_id,market" });
  return { ok: true };
});

export const publishSelectedNoonProducts = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ connectionId: z.string().uuid(), linkIds: z.array(z.string().uuid()).min(1).max(100), force: z.boolean().optional() }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.connectionId);
  const { publishNoonProducts } = await import("@/lib/noon.server");
  return { results: await publishNoonProducts(supabaseAdmin, connection, data.linkIds, { force: data.force === true }) };
});

/** Dry run: builds the exact Noon payload for each selected product and reports image/barcode validity. */
export const previewNoonSubmission = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ connectionId: z.string().uuid(), linkIds: z.array(z.string().uuid()).min(1).max(50) }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.connectionId);
  const { buildNoonSubmissions } = await import("@/lib/noon.server");
  const { reports } = await buildNoonSubmissions(supabaseAdmin, connection, data.linkIds, { checkImages: true });
  return { reports: reports.map((report) => ({
    ...report,
    payload: report.payload ? JSON.stringify(report.payload, null, 2) : null,
    barcodePayload: report.barcodePayload ? JSON.stringify(report.barcodePayload, null, 2) : null,
  })) };
});

export const retryNoonConnection = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.id);
  const { testNoonConnection, discoverNoonAccount } = await import("@/lib/noon.server");
  try { await testNoonConnection(connection); await supabaseAdmin.from("noon_connections").update({ status: "healthy", last_auth_at: new Date().toISOString(), last_error: null }).eq("id", data.id); await discoverNoonAccount(supabaseAdmin, { ...connection, status: "healthy" }); return { ok: true }; }
  catch (caught) { const message = caught instanceof Error ? caught.message : "Connection test failed"; await supabaseAdmin.from("noon_connections").update({ status: "error", last_error: message }).eq("id", data.id); return { ok: false, error: message }; }
});

export const updateNoonSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => settingsSchema.parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.id);
  const patch: Record<string, unknown> = {};
  if (data.name) patch['name'] = data.name;
  if (data.mode) patch['mode'] = data.mode;
  if (data.keyId) { patch['key_id'] = data.keyId; patch['credential_label'] = `${data.keyId.slice(0, 6)}…${data.keyId.slice(-4)}`; }
  if (data.projectCode) patch['project_code'] = data.projectCode;
  if (data.markets) patch['enabled_markets'] = data.markets;
  if (data.pricingRules) patch['pricing_rules'] = data.pricingRules;
  if (data.webhookSecret) {
    const { createHash } = await import("node:crypto");
    patch['webhook_secret_hash'] = createHash("sha256").update(data.webhookSecret).digest("hex");
  }
  if (Object.keys(patch).length) {
    const { error } = await supabaseAdmin.from("noon_connections").update(patch as never).eq("id", connection.id);
    if (error) throw error;
  }
  if (data.warehouses) {
    await supabaseAdmin.from("noon_warehouses").delete().eq("connection_id", connection.id);
    const rows = data.warehouses.filter((warehouse) => warehouse.code);
    if (rows.length) {
      const { error } = await supabaseAdmin.from("noon_warehouses").insert(rows.map((warehouse) => ({ user_id: context.userId, connection_id: connection.id, market: warehouse.market, warehouse_code: warehouse.code, processing_time: warehouse.processingTime, safety_stock: warehouse.safetyStock })));
      if (error) throw error;
    }
  }
  return { ok: true };
});


export const deleteNoonConnection = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.id);
  await supabaseAdmin.from("noon_connections").delete().eq("id", data.id);
  if (connection.store_integration_id) await supabaseAdmin.from("store_integrations").delete().eq("id", connection.store_integration_id).eq("user_id", context.userId);
  return { ok: true };
});
