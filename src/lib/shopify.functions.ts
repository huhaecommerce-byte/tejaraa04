import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const pricingSchema = z.object({
  type: z.enum(["percent", "fixed"]),
  value: z.number().min(0).max(100000),
  perMarket: z.object({ sa: z.number().min(0).max(100000).optional(), ae: z.number().min(0).max(100000).optional() }).optional(),
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
  if (["no", "false", "0", "disabled"].includes(api)) throw new Error("Your plan does not include store integrations");
  const rawLimit = values.get("store_integrations_max") ?? "unlimited";
  const limit = /^\d+$/.test(rawLimit) ? Number(rawLimit) : Infinity;
  if ((count ?? 0) >= limit) throw new Error("Your connected store limit has been reached");
}

async function ownedConnection(admin: any, userId: string, id: string) {
  const { data, error } = await admin.from("shopify_connections").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Shopify connection not found");
  return data;
}

export const listShopifyConnections = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("shopify_connections")
    .select("id,name,shop_domain,shop_name,status,market,currency,setup_completed_at,last_error,last_product_sync_at,last_inventory_sync_at,last_order_sync_at,created_at")
    .eq("user_id", context.userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return { connections: data ?? [] };
});

export const connectShopify = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
  name: z.string().trim().min(2).max(80),
  shopDomain: z.string().trim().min(3).max(120),
  accessToken: z.string().trim().max(400).optional(),
  clientId: z.string().trim().max(200).optional(),
  clientSecret: z.string().trim().max(400).optional(),
}).parse(input)).handler(async ({ data, context }) => {
  await planAllowsMarketplace(context as never);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { encryptCredential, normaliseShopDomain, validateAccessToken, validateClientCredential, exchangeClientCredentials, verifyShopifyShop, listShopifyLocations, registerShopifyWebhooks } = await import("@/lib/shopify.server");
  const { createHash, randomBytes } = await import("node:crypto");
  const shopDomain = normaliseShopDomain(data.shopDomain);

  // Two credential styles: a permanent custom-app Admin API token (shpat_…), or a
  // Dev Dashboard app whose client ID + secret are exchanged for a 24h token.
  const useClientCredentials = Boolean(data.clientId?.trim() || data.clientSecret?.trim());
  let token: string;
  let clientId: string | null = null;
  let clientSecretCipher: string | null = null;
  let tokenExpiresAt: string | null = null;
  if (useClientCredentials) {
    clientId = validateClientCredential(data.clientId ?? "", "client ID");
    const clientSecret = validateClientCredential(data.clientSecret ?? "", "client secret");
    const exchanged = await exchangeClientCredentials(shopDomain, clientId, clientSecret);
    token = exchanged.token;
    tokenExpiresAt = exchanged.expiresAt;
    clientSecretCipher = encryptCredential(clientSecret);
  } else {
    if (!data.accessToken?.trim()) throw new Error("Paste either an Admin API access token (shpat_…) or your Dev Dashboard client ID and client secret.");
    token = validateAccessToken(data.accessToken);
  }

  const { data: existing } = await supabaseAdmin.from("shopify_connections").select("id").eq("user_id", context.userId).eq("shop_domain", shopDomain).maybeSingle();
  if (existing) throw new Error("That Shopify store is already connected");

  const { data: store, error: storeError } = await supabaseAdmin.from("store_integrations").insert({ user_id: context.userId, platform: "shopify", store_name: data.name, store_url: `https://${shopDomain}`, status: "pending" }).select("id").single();
  if (storeError) throw storeError;

  const webhookToken = randomBytes(32).toString("hex");
  const { data: connection, error } = await supabaseAdmin.from("shopify_connections").insert({
    user_id: context.userId,
    store_integration_id: store.id,
    name: data.name,
    shop_domain: shopDomain,
    access_token_ciphertext: encryptCredential(token),
    client_id: clientId,
    client_secret_ciphertext: clientSecretCipher,
    token_expires_at: tokenExpiresAt,
    webhook_secret_hash: createHash("sha256").update(webhookToken).digest("hex"),
    pricing_rules: { type: "percent", value: 15, perMarket: { sa: 15, ae: 15 } },
  }).select("*").single();
  if (error) { await supabaseAdmin.from("store_integrations").delete().eq("id", store.id); throw error; }

  try {
    const shop = await verifyShopifyShop(connection);
    const locations = await listShopifyLocations(connection);
    const preferred = locations.find((location) => location.isActive && location.fulfillsOnlineOrders) ?? locations.find((location) => location.isActive) ?? locations[0];
    await supabaseAdmin.from("shopify_connections").update({
      status: "healthy",
      shop_name: shop.name,
      currency: shop.currencyCode || "SAR",
      last_auth_at: new Date().toISOString(),
      last_error: null,
      ...(preferred ? { location_id: preferred.id, location_name: preferred.name } : {}),
    }).eq("id", connection.id);
    await supabaseAdmin.from("store_integrations").update({ status: "active" }).eq("id", store.id);
    await registerShopifyWebhooks(supabaseAdmin, { ...connection, status: "healthy" }, webhookToken);
    return { id: connection.id, ok: true, shopName: shop.name, locations: locations.length };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Shopify connection failed";
    await supabaseAdmin.from("shopify_connections").update({ status: "error", last_error: message }).eq("id", connection.id);
    return { id: connection.id, ok: false, error: message };
  }
});

export const getShopifyWorkspace = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.id);
  const { computeShopifyPrice, shopifyReadiness } = await import("@/lib/shopify.server");
  const [{ data: links }, { data: products }, { data: orders }, { data: logs }, { data: locations }] = await Promise.all([
    supabaseAdmin.from("shopify_product_links").select("*").eq("connection_id", data.id).order("created_at", { ascending: false }),
    supabaseAdmin.from("products").select("id,name,name_ar,sku,images,price_sar,cost_usd,stock_qty,top_category,description,description_ar").order("updated_at", { ascending: false }).limit(500),
    supabaseAdmin.from("shopify_orders").select("*,shopify_order_items(*)").eq("connection_id", data.id).order("created_at", { ascending: false }).limit(100),
    supabaseAdmin.from("shopify_sync_log").select("*").eq("connection_id", data.id).order("created_at", { ascending: false }).limit(100),
    Promise.resolve({ data: [] as Array<{ id: string; name: string; isActive: boolean }> }),
  ]);
  const productsById = new Map((products ?? []).map((product) => [product.id, product]));
  const rules = (connection.pricing_rules ?? {}) as Record<string, unknown>;
  const readiness: Record<string, string[]> = {};
  const prices: Record<string, number | null> = {};
  for (const link of links ?? []) {
    const product = productsById.get(link.product_id) as never;
    const price = product ? computeShopifyPrice(product, link, rules, connection.market) : null;
    prices[link.id] = price;
    readiness[link.id] = shopifyReadiness(product, price, connection);
  }
  return {
    connection: { ...connection, access_token_ciphertext: undefined, client_secret_ciphertext: undefined },
    links: links ?? [],
    products: products ?? [],
    orders: orders ?? [],
    logs: logs ?? [],
    locations: locations ?? [],
    readiness,
    prices,
  };
});

export const listShopifyLocationsForConnection = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.id);
  const { listShopifyLocations } = await import("@/lib/shopify.server");
  return { locations: await listShopifyLocations(connection) };
});

export const completeShopifySetup = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
  id: z.string().uuid(),
  locationId: z.string().min(3).max(200),
  locationName: z.string().max(200).optional(),
  market: z.enum(["sa", "ae"]),
  currency: z.string().trim().min(3).max(5),
  safetyStock: z.number().int().min(0).max(100000),
  pricingRules: pricingSchema,
}).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await ownedConnection(supabaseAdmin, context.userId, data.id);
  const { error } = await supabaseAdmin.from("shopify_connections").update({
    location_id: data.locationId,
    location_name: data.locationName ?? null,
    market: data.market,
    currency: data.currency.toUpperCase(),
    safety_stock: data.safetyStock,
    pricing_rules: data.pricingRules,
    setup_completed_at: new Date().toISOString(),
  } as never).eq("id", data.id).eq("user_id", context.userId);
  if (error) throw error;
  return { ok: true };
});

export const selectShopifyProducts = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ connectionId: z.string().uuid(), productIds: z.array(z.string().uuid()).min(1).max(200) }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.connectionId);
  const { data: products, error } = await supabaseAdmin.from("products").select("id,sku").in("id", data.productIds);
  if (error) throw error;
  const { error: upsertError } = await supabaseAdmin.from("shopify_product_links").upsert(
    (products ?? []).map((product) => ({ user_id: context.userId, connection_id: connection.id, product_id: product.id, partner_sku: product.sku })),
    { onConflict: "connection_id,product_id" },
  );
  if (upsertError) throw upsertError;
  return { selected: products?.length ?? 0 };
});

export const removeShopifyProduct = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ connectionId: z.string().uuid(), linkId: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await ownedConnection(supabaseAdmin, context.userId, data.connectionId);
  const { error } = await supabaseAdmin.from("shopify_product_links").delete().eq("id", data.linkId).eq("connection_id", data.connectionId).eq("user_id", context.userId);
  if (error) throw error;
  return { ok: true };
});

export const updateShopifyProduct = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
  connectionId: z.string().uuid(),
  linkId: z.string().uuid(),
  markupType: z.enum(["percent", "fixed"]).optional(),
  markupValue: z.number().min(0).max(100000).nullable().optional(),
  overridePrice: z.number().positive().max(1000000).nullable().optional(),
}).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await ownedConnection(supabaseAdmin, context.userId, data.connectionId);
  const patch: Record<string, unknown> = { last_error: null };
  if (data.markupType) patch["markup_type"] = data.markupType;
  if (data.markupValue !== undefined) patch["markup_value"] = data.markupValue;
  if (data.overridePrice !== undefined) patch["override_price"] = data.overridePrice;
  const { error } = await supabaseAdmin.from("shopify_product_links").update(patch as never).eq("id", data.linkId).eq("connection_id", data.connectionId).eq("user_id", context.userId);
  if (error) throw error;
  return { ok: true };
});

/** Dry run: builds the exact Shopify payload for each selected product and checks its image links. */
export const previewShopifySubmission = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ connectionId: z.string().uuid(), linkIds: z.array(z.string().uuid()).min(1).max(50) }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.connectionId);
  const { buildShopifySubmissions } = await import("@/lib/shopify.server");
  const { reports } = await buildShopifySubmissions(supabaseAdmin, connection, data.linkIds, { checkImages: true });
  return { reports: reports.map((report) => ({ ...report, payload: report.payload ? JSON.stringify(report.payload, null, 2) : null })) };
});

export const publishSelectedShopifyProducts = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ connectionId: z.string().uuid(), linkIds: z.array(z.string().uuid()).min(1).max(100) }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.connectionId);
  const { publishShopifyProducts } = await import("@/lib/shopify.server");
  return { results: await publishShopifyProducts(supabaseAdmin, connection, data.linkIds) };
});

/** Manual fallback for the automatic sync: refresh price and stock for every published product. */
export const syncShopifyNow = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ connectionId: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.connectionId);
  const { syncShopifyLink } = await import("@/lib/shopify.server");
  const { data: links } = await supabaseAdmin.from("shopify_product_links").select("id").eq("connection_id", connection.id).not("shopify_variant_id", "is", null);
  let ok = 0;
  const failures: string[] = [];
  for (const link of links ?? []) {
    try { await syncShopifyLink(supabaseAdmin, connection, link.id); ok += 1; }
    catch (error) { failures.push(error instanceof Error ? error.message : "Sync failed"); }
  }
  return { synced: ok, failed: failures.length, firstError: failures[0] ?? null };
});

export const retryShopifyConnection = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.id);
  const { verifyShopifyShop } = await import("@/lib/shopify.server");
  try {
    const shop = await verifyShopifyShop(connection);
    await supabaseAdmin.from("shopify_connections").update({ status: "healthy", shop_name: shop.name, last_auth_at: new Date().toISOString(), last_error: null }).eq("id", data.id);
    return { ok: true };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Connection test failed";
    await supabaseAdmin.from("shopify_connections").update({ status: "error", last_error: message }).eq("id", data.id);
    return { ok: false, error: message };
  }
});

export const reregisterShopifyWebhooks = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.id);
  const { registerShopifyWebhooks } = await import("@/lib/shopify.server");
  const { createHash, randomBytes } = await import("node:crypto");
  const token = randomBytes(32).toString("hex");
  await supabaseAdmin.from("shopify_connections").update({ webhook_secret_hash: createHash("sha256").update(token).digest("hex") }).eq("id", connection.id);
  const result = await registerShopifyWebhooks(supabaseAdmin, connection, token);
  return { ...result };
});

export const updateShopifySettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(80).optional(),
  accessToken: z.string().trim().min(20).max(400).optional(),
  clientId: z.string().trim().max(200).optional(),
  clientSecret: z.string().trim().max(400).optional(),
  locationId: z.string().min(3).max(200).optional(),
  locationName: z.string().max(200).optional(),
  market: z.enum(["sa", "ae"]).optional(),
  currency: z.string().trim().min(3).max(5).optional(),
  safetyStock: z.number().int().min(0).max(100000).optional(),
  autoSync: z.boolean().optional(),
  pricingRules: pricingSchema.optional(),
}).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.id);
  const patch: Record<string, unknown> = {};
  if (data.name) patch["name"] = data.name;
  if (data.locationId) patch["location_id"] = data.locationId;
  if (data.locationName !== undefined) patch["location_name"] = data.locationName;
  if (data.market) patch["market"] = data.market;
  if (data.currency) patch["currency"] = data.currency.toUpperCase();
  if (data.safetyStock !== undefined) patch["safety_stock"] = data.safetyStock;
  if (data.autoSync !== undefined) patch["auto_sync"] = data.autoSync;
  if (data.pricingRules) patch["pricing_rules"] = data.pricingRules;
  if (data.clientId?.trim() && data.clientSecret?.trim()) {
    // Dev Dashboard credentials: exchange immediately so a bad pair fails here, not during sync.
    const { encryptCredential, validateClientCredential, exchangeClientCredentials } = await import("@/lib/shopify.server");
    const clientId = validateClientCredential(data.clientId, "client ID");
    const clientSecret = validateClientCredential(data.clientSecret, "client secret");
    const exchanged = await exchangeClientCredentials(connection.shop_domain, clientId, clientSecret);
    patch["client_id"] = clientId;
    patch["client_secret_ciphertext"] = encryptCredential(clientSecret);
    patch["access_token_ciphertext"] = encryptCredential(exchanged.token);
    patch["token_expires_at"] = exchanged.expiresAt;
    patch["last_auth_at"] = new Date().toISOString();
    patch["status"] = "healthy";
    patch["last_error"] = null;
  } else if (data.accessToken) {
    const { encryptCredential, validateAccessToken } = await import("@/lib/shopify.server");
    patch["access_token_ciphertext"] = encryptCredential(validateAccessToken(data.accessToken));
    patch["client_id"] = null;
    patch["client_secret_ciphertext"] = null;
    patch["token_expires_at"] = null;
  }
  if (Object.keys(patch).length) {
    const { error } = await supabaseAdmin.from("shopify_connections").update(patch as never).eq("id", connection.id);
    if (error) throw error;
  }
  return { ok: true };
});

export const fulfilShopifyOrderNow = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
  connectionId: z.string().uuid(),
  orderId: z.string().uuid(),
  trackingNumber: z.string().trim().max(120).optional(),
  carrier: z.string().trim().max(80).optional(),
}).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.connectionId);
  const { fulfilShopifyOrder } = await import("@/lib/shopify.server");
  return fulfilShopifyOrder(supabaseAdmin, connection, data.orderId, { number: data.trackingNumber, company: data.carrier });
});

export const deleteShopifyConnection = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const connection = await ownedConnection(supabaseAdmin, context.userId, data.id);
  await supabaseAdmin.from("shopify_connections").delete().eq("id", data.id);
  if (connection.store_integration_id) await supabaseAdmin.from("store_integrations").delete().eq("id", connection.store_integration_id).eq("user_id", context.userId);
  return { ok: true };
});
