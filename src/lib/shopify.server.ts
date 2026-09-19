import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { Database, Json } from "@/integrations/supabase/types";

type AdminClient = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];
export type ShopifyConnection = Database["public"]["Tables"]["shopify_connections"]["Row"];

const USER_AGENT = "Tejaraa-Shopify-Connector/1.0";

/** Public site origin used to turn stored image paths into links Shopify can download. */
const PUBLIC_SITE_ORIGIN = (process.env["PUBLIC_SITE_URL"] || "https://tejaraa03.lovable.app").replace(/\/+$/, "");

function keyMaterial() {
  const value = process.env["SHOPIFY_CREDENTIAL_ENCRYPTION_KEY"] || process.env["NOON_CREDENTIAL_ENCRYPTION_KEY"];
  if (!value) throw new Error("Shopify credential encryption is not configured");
  return createHash("sha256").update(value).digest();
}

export function encryptCredential(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyMaterial(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(".");
}

function decryptCredential(value: string) {
  const [version, iv, tag, payload] = value.split(".");
  if (version !== "v1" || !iv || !tag || !payload) throw new Error("Stored Shopify credential is invalid");
  const decipher = createDecipheriv("aes-256-gcm", keyMaterial(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(payload, "base64")), decipher.final()]).toString("utf8");
}

/** Accepts "shop", "shop.myshopify.com", an admin.shopify.com/store/<shop> link, or a full store URL. */
export function normaliseShopDomain(raw: string) {
  let value = String(raw ?? "").trim().toLowerCase().replace(/\s+/g, "");
  value = value.replace(/^https?:\/\//, "").replace(/^www\./, "");

  // admin.shopify.com/store/my-shop  ->  my-shop
  const adminMatch = value.match(/^admin\.shopify\.com\/store\/([^/?#]+)/);
  if (adminMatch?.[1]) value = adminMatch[1];
  else value = value.replace(/[/?#].*$/, "");

  value = value.replace(/:\d+$/, "").replace(/\.+$/, "");
  if (!value) throw new Error("Add your Shopify store address, for example my-shop.myshopify.com");
  if (value === "admin.shopify.com") throw new Error("Use your store address like my-shop.myshopify.com, not the admin link");

  // keep only the store handle, then rebuild the canonical host
  const handle = value.endsWith(".myshopify.com") ? value.slice(0, -".myshopify.com".length) : value;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(handle)) {
    throw new Error("That store address does not look right. Use my-shop.myshopify.com");
  }
  return `${handle}.myshopify.com`;
}


export function validateAccessToken(raw: string) {
  const token = String(raw ?? "").trim();
  if (!/^shp(at|ca|ss)_[A-Za-z0-9_-]{10,}$/.test(token)) {
    throw new Error("That access token does not look right. It starts with shpat_ and comes from your custom app's API credentials.");
  }
  return token;
}

export function validateClientCredential(raw: string, label: string) {
  const value = String(raw ?? "").trim();
  if (!/^[A-Za-z0-9_-]{16,}$/.test(value)) throw new Error(`That ${label} does not look right. Copy it from the Dev Dashboard → your app → Settings → Credentials.`);
  return value;
}

/**
 * Dev Dashboard (dev.shopify.com) apps hold a client ID + secret, exchanged for a
 * 24-hour access token via the client credentials grant.
 */
export async function exchangeClientCredentials(shopDomain: string, clientId: string, clientSecret: string) {
  const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", "user-agent": USER_AGENT },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
  });
  const body = await response.text();
  let parsed: { access_token?: string; expires_in?: number; scope?: string; error_description?: string; errors?: unknown } = {};
  try { parsed = JSON.parse(body); } catch { /* leave empty */ }
  if (!response.ok || !parsed.access_token) {
    const reason = parsed.error_description ?? (typeof parsed.errors === "string" ? parsed.errors : "") ?? body.slice(0, 200);
    throw new Error(`Shopify could not exchange those credentials${reason ? `: ${reason}` : ""}. Check the client ID, client secret, and that the app is installed on ${shopDomain}.`);
  }
  const expiresIn = typeof parsed.expires_in === "number" ? parsed.expires_in : 86399;
  return { token: parsed.access_token, expiresAt: new Date(Date.now() + Math.max(60, expiresIn - 300) * 1000).toISOString(), scope: parsed.scope ?? "" };
}

/** Returns a valid access token, renewing Dev Dashboard client-credential tokens when they expire. */
async function resolveAccessToken(connection: ShopifyConnection, forceRefresh = false): Promise<string> {
  if (!connection.client_secret_ciphertext || !connection.client_id) {
    return decryptCredential(connection.access_token_ciphertext);
  }
  const expiresAt = connection.token_expires_at ? Date.parse(connection.token_expires_at) : 0;
  if (!forceRefresh && expiresAt > Date.now() + 5 * 60 * 1000) {
    return decryptCredential(connection.access_token_ciphertext);
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const exchanged = await exchangeClientCredentials(connection.shop_domain, connection.client_id, decryptCredential(connection.client_secret_ciphertext));
  await supabaseAdmin.from("shopify_connections").update({
    access_token_ciphertext: encryptCredential(exchanged.token),
    token_expires_at: exchanged.expiresAt,
    last_auth_at: new Date().toISOString(),
  }).eq("id", connection.id);
  connection.access_token_ciphertext = encryptCredential(exchanged.token);
  connection.token_expires_at = exchanged.expiresAt;
  return exchanged.token;
}

function safeMessage(value: unknown) {
  const text = value instanceof Error ? value.message : String(value);
  return text.replace(/shp(at|ca|ss)_[A-Za-z0-9]+/g, "[redacted]").slice(0, 700);
}

type GraphqlResult<T> = { data?: T; errors?: Array<{ message?: string; extensions?: { code?: string } }>; extensions?: unknown };

export async function shopifyGraphql<T>(connection: ShopifyConnection, query: string, variables: Record<string, unknown> = {}, retried = false): Promise<T> {
  const token = await resolveAccessToken(connection);
  const url = `https://${connection.shop_domain}/admin/api/${connection.api_version}/graphql.json`;
  let response: Response | null = null;
  let body = "";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", "user-agent": USER_AGENT, "x-shopify-access-token": token },
      body: JSON.stringify({ query, variables }),
    });
    body = await response.text();
    const throttled = response.status === 429 || (response.ok && body.includes("THROTTLED"));
    if (!throttled && response.status < 500) break;
    await new Promise((resolve) => setTimeout(resolve, Math.min(8000, 500 * 2 ** attempt + Math.random() * 300)));
  }
  if (!response) throw new Error("Shopify did not respond");
  if ((response.status === 401 || response.status === 403) && !retried && connection.client_secret_ciphertext) {
    // Dev Dashboard token may have been revoked or expired mid-flight — force a fresh exchange and retry once.
    await resolveAccessToken(connection, true);
    return shopifyGraphql(connection, query, variables, true);
  }
  if (response.status === 401 || response.status === 403) {
    let reason = "";
    try {
      const parsedError = JSON.parse(body) as { errors?: unknown };
      reason = typeof parsedError.errors === "string" ? parsedError.errors : JSON.stringify(parsedError.errors ?? "");
    } catch { reason = body.slice(0, 200); }
    const scopes = /access denied|scope/i.test(reason)
      ? " Your custom app is missing a permission — enable read_products, write_products, read_inventory, write_inventory, read_locations, read_orders, write_orders and write_fulfillments, then reinstall the app and paste the new token."
      : "";
    throw new Error(`Shopify rejected the access token${reason ? `: ${reason}` : ""}.${scopes || " Check the token and that the app has the required permissions."}`);
  }

  if (!response.ok) throw new Error(`Shopify returned HTTP ${response.status}: ${body.slice(0, 300)}`);
  let parsed: GraphqlResult<T>;
  try { parsed = JSON.parse(body) as GraphqlResult<T>; } catch { throw new Error("Shopify returned an unreadable response"); }
  if (parsed.errors?.length) {
    const text = parsed.errors.map((error) => error.message).filter(Boolean).join("; ") || "Shopify rejected the request";
    const denied = parsed.errors.some((error) => error.extensions?.code === "ACCESS_DENIED") || /access denied|scope/i.test(text);
    throw new Error(denied
      ? `${text} — your Shopify custom app is missing a permission. Enable read_products, write_products, read_inventory, write_inventory, read_locations, read_orders, write_orders and write_fulfillments, reinstall the app, then paste the new token.`
      : text);
  }

  if (!parsed.data) throw new Error("Shopify returned an empty response");
  return parsed.data;
}

function userErrorMessage(errors: Array<{ field?: string[] | null; message?: string }> | undefined) {
  if (!errors?.length) return null;
  return errors.map((error) => [error.field?.join("."), error.message].filter(Boolean).join(": ")).join(" · ");
}

export async function logShopify(admin: AdminClient, connection: ShopifyConnection, operation: string, status: "ok" | "error", detail: Record<string, unknown> = {}, message = "", startedAt = Date.now()) {
  await admin.from("shopify_sync_log").insert({
    user_id: connection.user_id,
    connection_id: connection.id,
    direction: operation.includes("order") ? "inbound" : "outbound",
    operation,
    status,
    message: safeMessage(message),
    detail: detail as Json,
    duration_ms: Date.now() - startedAt,
  });
}

/** Verifies the token and returns the shop's own details. */
export async function verifyShopifyShop(connection: ShopifyConnection) {
  const data = await shopifyGraphql<{ shop: { name: string; myshopifyDomain: string; currencyCode: string; email?: string } }>(
    connection,
    `{ shop { name myshopifyDomain currencyCode email } }`,
  );
  return data.shop;
}

export async function listShopifyLocations(connection: ShopifyConnection) {
  const data = await shopifyGraphql<{ locations: { nodes: Array<{ id: string; name: string; isActive: boolean; fulfillsOnlineOrders: boolean }> } }>(
    connection,
    `{ locations(first: 50) { nodes { id name isActive fulfillsOnlineOrders } } }`,
  );
  return data.locations.nodes;
}

export function absoluteImageUrls(images: string[] | null | undefined): string[] {
  return (images ?? [])
    .map((raw) => String(raw ?? "").trim())
    .filter(Boolean)
    .map((url) => (/^https?:\/\//i.test(url) ? url : `${PUBLIC_SITE_ORIGIN}/${url.replace(/^\/+/, "")}`))
    .filter((url) => /^https?:\/\//i.test(url));
}

type ProductRowLite = { id: string; name: string; name_ar?: string | null; sku: string; description?: string | null; description_ar?: string | null; images?: string[] | null; price_sar?: number | null; cost_usd?: number | null; stock_qty?: number | null; top_category?: string | null; weight_kg?: number | null };
type LinkRow = Database["public"]["Tables"]["shopify_product_links"]["Row"];

/** Selling price for Shopify: per-product override wins, then the per-product markup, then the store's default markup for its market. */
export function computeShopifyPrice(product: ProductRowLite, link: Pick<LinkRow, "markup_type" | "markup_value" | "override_price"> | null, rules: Record<string, unknown>, market: string) {
  const base = Number(product.price_sar ?? 0);
  if (!base) return null;
  if (link?.override_price) return Number(link.override_price);
  const perMarket = (rules["perMarket"] ?? {}) as Record<string, unknown>;
  const markupType = link?.markup_value != null ? link.markup_type : String(rules["type"] ?? "percent");
  const markupValue = link?.markup_value != null ? Number(link.markup_value) : Number(perMarket[market] ?? rules["value"] ?? 0);
  const price = markupType === "fixed" ? base + markupValue : base * (1 + markupValue / 100);
  return Math.round(price * 100) / 100;
}

export function shopifyReadiness(product: ProductRowLite | undefined, price: number | null, connection: ShopifyConnection) {
  const missing: string[] = [];
  if (!product) return ["Product not found in the catalog"];
  if (!product.images?.length) missing.push("Product image");
  if (!price) missing.push("Selling price");
  if (!connection.location_id) missing.push("Shopify location");
  return missing;
}

export type ShopifySubmissionImage = { url: string; reachable: boolean | null; status: number | null; contentType: string | null };
export type ShopifySubmissionReport = {
  linkId: string;
  productName: string;
  sku: string;
  barcode: string;
  images: ShopifySubmissionImage[];
  price: number | null;
  stock: number;
  issues: string[];
  alreadyPublished: boolean;
  shopifyProductId: string | null;
  payload: Record<string, unknown> | null;
};

async function checkImageUrl(url: string): Promise<ShopifySubmissionImage> {
  try {
    let response = await fetch(url, { method: "HEAD" });
    if (response.status === 405 || response.status === 501) response = await fetch(url, { method: "GET", headers: { range: "bytes=0-0" } });
    const contentType = response.headers.get("content-type");
    return { url, status: response.status, contentType, reachable: response.ok && !!contentType?.startsWith("image/") };
  } catch {
    return { url, status: null, contentType: null, reachable: false };
  }
}

function productSetInput(connection: ShopifyConnection, link: LinkRow, product: ProductRowLite, price: number, images: string[], includeFiles: boolean) {
  const description = [product.description, product.description_ar].filter(Boolean).join("<hr />");
  const input: Record<string, unknown> = {
    title: product.name,
    descriptionHtml: description || product.name,
    vendor: "Tejaraa",
    status: "ACTIVE",
    productType: product.top_category || "General",
    productOptions: [{ name: "Title", values: [{ name: "Default Title" }] }],
    variants: [{
      optionValues: [{ optionName: "Title", name: "Default Title" }],
      price: price.toFixed(2),
      sku: product.sku,
      barcode: product.sku,
      inventoryItem: { tracked: true, sku: product.sku },
    }],
  };
  if (link.shopify_product_id) input["id"] = link.shopify_product_id;
  if (includeFiles && images.length) input["files"] = images.slice(0, 10).map((url) => ({ originalSource: url, contentType: "IMAGE" }));
  return input;
}

/**
 * Builds the exact payload Shopify will receive for each link and validates it.
 * Shared by the submission preview and the publish flow so both always agree.
 */
export async function buildShopifySubmissions(admin: AdminClient, connection: ShopifyConnection, linkIds: string[], options?: { checkImages?: boolean }) {
  const { data: links, error } = await admin.from("shopify_product_links").select("*").eq("connection_id", connection.id).in("id", linkIds);
  if (error) throw error;
  const productIds = (links ?? []).map((link) => link.product_id);
  const { data: products } = await admin.from("products").select("*").in("id", productIds);
  const productsById = new Map((products ?? []).map((product) => [product.id, product]));
  const rules = (connection.pricing_rules ?? {}) as Record<string, unknown>;
  const reports: ShopifySubmissionReport[] = [];

  for (const link of links ?? []) {
    const product = productsById.get(link.product_id) as ProductRowLite | undefined;
    const price = product ? computeShopifyPrice(product, link, rules, connection.market) : null;
    const issues = shopifyReadiness(product, price, connection);
    const urls = absoluteImageUrls(product?.images);
    const images: ShopifySubmissionImage[] = options?.checkImages
      ? await Promise.all(urls.map((url) => checkImageUrl(url)))
      : urls.map((url) => ({ url, reachable: null, status: null, contentType: null }));
    if (!images.length) issues.push("Product image could not be shared publicly — re-upload the photo");
    else if (options?.checkImages && !images.some((image) => image.reachable)) issues.push("Shopify cannot download the product image from its public link");

    const usable = (options?.checkImages ? images.filter((image) => image.reachable !== false) : images).map((image) => image.url);
    const stock = Math.max(0, Math.floor(Number(product?.stock_qty ?? 0) - Number(connection.safety_stock ?? 0)));
    reports.push({
      linkId: link.id,
      productName: product?.name ?? link.partner_sku,
      sku: product?.sku ?? link.partner_sku,
      barcode: product?.sku ?? link.partner_sku,
      images,
      price,
      stock,
      issues,
      alreadyPublished: Boolean(link.shopify_product_id),
      shopifyProductId: link.shopify_product_id,
      payload: issues.length || !product || !price ? null : { input: productSetInput(connection, link, product, price, usable, !link.shopify_product_id) },
    });
  }
  return { reports, links: links ?? [], productsById, rules };
}

type ProductSetResponse = {
  productSet: {
    product: { id: string; handle: string; variants: { nodes: Array<{ id: string; inventoryItem: { id: string } }> } } | null;
    userErrors: Array<{ field?: string[] | null; message?: string }>;
  };
};

const PRODUCT_SET_MUTATION = `mutation TejaraaProductSet($input: ProductSetInput!) {
  productSet(synchronous: true, input: $input) {
    product { id handle variants(first: 1) { nodes { id inventoryItem { id } } } }
    userErrors { field message }
  }
}`;

export async function pushShopifyPrice(admin: AdminClient, connection: ShopifyConnection, link: LinkRow, price: number, barcode: string) {
  const startedAt = Date.now();
  try {
    const data = await shopifyGraphql<{ productVariantsBulkUpdate: { userErrors: Array<{ field?: string[] | null; message?: string }> } }>(
      connection,
      `mutation TejaraaPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) { userErrors { field message } }
      }`,
      { productId: link.shopify_product_id, variants: [{ id: link.shopify_variant_id, price: price.toFixed(2), barcode }] },
    );
    const message = userErrorMessage(data.productVariantsBulkUpdate.userErrors);
    if (message) throw new Error(message);
    await logShopify(admin, connection, "price_push", "ok", { sku: link.partner_sku, price }, "", startedAt);
    return null;
  } catch (error) {
    const message = safeMessage(error);
    await logShopify(admin, connection, "price_push", "error", { sku: link.partner_sku }, message, startedAt);
    return `Price update failed: ${message}`;
  }
}

export async function pushShopifyStock(admin: AdminClient, connection: ShopifyConnection, link: LinkRow, quantity: number) {
  const startedAt = Date.now();
  const setQuantities = async () => {
    const data = await shopifyGraphql<{ inventorySetQuantities: { userErrors: Array<{ field?: string[] | null; message?: string }> } }>(
      connection,
      `mutation TejaraaStock($input: InventorySetQuantitiesInput!) {
        inventorySetQuantities(input: $input) { userErrors { field message } }
      }`,
      { input: { name: "available", reason: "correction", ignoreCompareQuantity: true, quantities: [{ inventoryItemId: link.inventory_item_id, locationId: connection.location_id, quantity }] } },
    );
    return userErrorMessage(data.inventorySetQuantities.userErrors);
  };
  try {
    if (!link.inventory_item_id || !connection.location_id) throw new Error("This product has no stock location yet");
    let message = await setQuantities();
    if (message && /not stocked|does not stock|activate/i.test(message)) {
      await shopifyGraphql(
        connection,
        `mutation TejaraaActivate($inventoryItemId: ID!, $locationId: ID!) {
          inventoryActivate(inventoryItemId: $inventoryItemId, locationId: $locationId) { userErrors { field message } }
        }`,
        { inventoryItemId: link.inventory_item_id, locationId: connection.location_id },
      );
      message = await setQuantities();
    }
    if (message) throw new Error(message);
    await logShopify(admin, connection, "stock_push", "ok", { sku: link.partner_sku, quantity }, "", startedAt);
    return null;
  } catch (error) {
    const message = safeMessage(error);
    await logShopify(admin, connection, "stock_push", "error", { sku: link.partner_sku }, message, startedAt);
    return `Stock update failed: ${message}`;
  }
}

/** Creates or updates the products in Shopify, then pushes price and stock. */
export async function publishShopifyProducts(admin: AdminClient, connection: ShopifyConnection, linkIds: string[]) {
  const { reports, links, productsById, rules } = await buildShopifySubmissions(admin, connection, linkIds, { checkImages: true });
  const reportById = new Map(reports.map((report) => [report.linkId, report]));
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const link of links) {
    const report = reportById.get(link.id)!;
    const product = productsById.get(link.product_id) as ProductRowLite | undefined;
    const startedAt = Date.now();
    try {
      if (report.issues.length) throw new Error(`Not ready: ${report.issues.join(", ")}`);
      const data = await shopifyGraphql<ProductSetResponse>(connection, PRODUCT_SET_MUTATION, (report.payload ?? {}) as Record<string, unknown>);
      const failure = userErrorMessage(data.productSet.userErrors);
      if (failure || !data.productSet.product) throw new Error(failure || "Shopify did not create the product");
      const variant = data.productSet.product.variants.nodes[0];
      const { data: saved } = await admin.from("shopify_product_links").update({
        shopify_product_id: data.productSet.product.id,
        shopify_variant_id: variant?.id ?? null,
        inventory_item_id: variant?.inventoryItem?.id ?? null,
        handle: data.productSet.product.handle,
        content_status: "published",
        sync_status: "published",
        last_pushed_at: new Date().toISOString(),
        last_error: null,
      }).eq("id", link.id).select("*").single();
      await logShopify(admin, connection, "product_publish", "ok", { sku: link.partner_sku, productId: data.productSet.product.id, images: report.images.map((image) => image.url) }, "", startedAt);

      const updated = (saved ?? link) as LinkRow;
      const price = computeShopifyPrice(product!, updated, rules, connection.market)!;
      const followUps = [
        await pushShopifyStock(admin, connection, updated, report.stock),
        await pushShopifyPrice(admin, connection, updated, price, product!.sku),
      ].filter(Boolean) as string[];
      if (followUps.length) {
        await admin.from("shopify_product_links").update({ sync_status: "content_only", last_error: followUps.join(" · ") }).eq("id", link.id);
        results.push({ id: link.id, ok: false, error: followUps.join(" · ") });
      } else {
        results.push({ id: link.id, ok: true });
      }
    } catch (caught) {
      const message = safeMessage(caught);
      await admin.from("shopify_product_links").update({ sync_status: "failed", last_error: message }).eq("id", link.id);
      await logShopify(admin, connection, "product_publish", "error", { linkId: link.id }, message, startedAt);
      results.push({ id: link.id, ok: false, error: message });
    }
  }
  await admin.from("shopify_connections").update({ last_product_sync_at: new Date().toISOString() }).eq("id", connection.id);
  return results;
}

/** Price + stock refresh for one already-published link (used by the automatic sync). */
export async function syncShopifyLink(admin: AdminClient, connection: ShopifyConnection, linkId: string) {
  const { data: link } = await admin.from("shopify_product_links").select("*").eq("id", linkId).eq("connection_id", connection.id).maybeSingle();
  if (!link) return;
  if (!link.shopify_variant_id) { await publishShopifyProducts(admin, connection, [linkId]); return; }
  const { data: product } = await admin.from("products").select("*").eq("id", link.product_id).maybeSingle();
  if (!product) return;
  const rules = (connection.pricing_rules ?? {}) as Record<string, unknown>;
  const price = computeShopifyPrice(product as ProductRowLite, link, rules, connection.market);
  const quantity = Math.max(0, Math.floor(Number(product.stock_qty ?? 0) - Number(connection.safety_stock ?? 0)));
  const errors = [
    await pushShopifyStock(admin, connection, link, quantity),
    price ? await pushShopifyPrice(admin, connection, link, price, product.sku) : "No selling price could be calculated",
  ].filter(Boolean) as string[];
  await admin.from("shopify_product_links").update({
    sync_status: errors.length ? "content_only" : "published",
    last_error: errors.length ? errors.join(" · ") : null,
    last_pushed_at: new Date().toISOString(),
  }).eq("id", link.id);
  await admin.from("shopify_connections").update({ last_inventory_sync_at: new Date().toISOString() }).eq("id", connection.id);
  if (errors.length) throw new Error(errors.join(" · "));
}

const WEBHOOK_TOPICS = ["ORDERS_CREATE", "ORDERS_CANCELLED", "PRODUCTS_DELETE"] as const;

export async function registerShopifyWebhooks(admin: AdminClient, connection: ShopifyConnection, token: string) {
  const startedAt = Date.now();
  const callbackUrl = `${PUBLIC_SITE_ORIGIN}/api/public/shopify/webhook?token=${encodeURIComponent(token)}`;
  const created: string[] = [];
  const skipped: string[] = [];
  for (const topic of WEBHOOK_TOPICS) {
    try {
      const data = await shopifyGraphql<{ webhookSubscriptionCreate: { userErrors: Array<{ field?: string[] | null; message?: string }> } }>(
        connection,
        `mutation TejaraaHook($topic: WebhookSubscriptionTopic!, $sub: WebhookSubscriptionInput!) {
          webhookSubscriptionCreate(topic: $topic, webhookSubscription: $sub) { userErrors { field message } }
        }`,
        { topic, sub: { callbackUrl, format: "JSON" } },
      );
      const message = userErrorMessage(data.webhookSubscriptionCreate.userErrors);
      if (message && !/already/i.test(message)) throw new Error(message);
      if (message) skipped.push(topic); else created.push(topic);
    } catch (error) {
      await logShopify(admin, connection, "webhook_register", "error", { topic }, safeMessage(error), startedAt);
    }
  }
  await admin.from("shopify_connections").update({ webhooks_registered_at: new Date().toISOString() }).eq("id", connection.id);
  await logShopify(admin, connection, "webhook_register", "ok", { created, skipped, callbackUrl: callbackUrl.split("?")[0] }, "", startedAt);
  return { created, skipped };
}

type ShopifyOrderPayload = {
  id?: number | string;
  name?: string;
  order_number?: number | string;
  currency?: string;
  total_price?: string;
  financial_status?: string;
  fulfillment_status?: string | null;
  created_at?: string;
  email?: string;
  customer?: { first_name?: string; last_name?: string; email?: string };
  shipping_address?: Record<string, unknown>;
  line_items?: Array<{ id?: number | string; sku?: string; title?: string; name?: string; quantity?: number; price?: string }>;
};

/** Imports a Shopify order and raises the matching Tejaraa order, paid from the wallet when funds allow. */
export async function importShopifyOrder(admin: AdminClient, connection: ShopifyConnection, payload: ShopifyOrderPayload) {
  const startedAt = Date.now();
  const externalId = String(payload.id ?? "");
  try {
    const items = payload.line_items ?? [];
    const skus = items.map((item) => String(item.sku ?? "")).filter(Boolean);
    const { data: products } = skus.length ? await admin.from("products").select("id,sku,name,price_sar").in("sku", skus) : { data: [] };
    const bySku = new Map((products ?? []).map((product) => [product.sku, product]));
    const address = (payload.shipping_address ?? {}) as Record<string, unknown>;
    const customerName = [payload.customer?.first_name, payload.customer?.last_name].filter(Boolean).join(" ")
      || String(address["name"] ?? "")
      || payload.email
      || "Shopify customer";

    const { data: order, error } = await admin.from("shopify_orders").upsert({
      user_id: connection.user_id,
      connection_id: connection.id,
      external_id: externalId,
      order_number: String(payload.name ?? payload.order_number ?? ""),
      financial_status: payload.financial_status ?? null,
      fulfillment_status: payload.fulfillment_status ?? null,
      currency: payload.currency ?? connection.currency,
      order_total: Number(payload.total_price ?? 0),
      customer_name: customerName,
      customer_email: payload.customer?.email ?? payload.email ?? null,
      shipping_address: address as Json,
      status: "new",
      raw_payload: payload as unknown as Json,
      placed_at: payload.created_at ?? null,
    }, { onConflict: "connection_id,external_id" }).select("*").single();
    if (error) throw error;

    await admin.from("shopify_order_items").delete().eq("order_id", order.id);
    if (items.length) {
      await admin.from("shopify_order_items").insert(items.map((item) => {
        const sku = String(item.sku ?? "");
        const product = bySku.get(sku);
        return {
          user_id: connection.user_id,
          order_id: order.id,
          product_id: product?.id ?? null,
          sku,
          name: String(item.title ?? item.name ?? product?.name ?? sku),
          quantity: Math.max(1, Number(item.quantity ?? 1)),
          unit_price: Number(item.price ?? 0),
          raw_payload: item as unknown as Json,
        };
      }));
    }

    if (!order.tejaraa_order_id) {
      const matched = items.filter((item) => bySku.has(String(item.sku ?? "")));
      if (matched.length) {
        const orderProducts = matched.map((item) => {
          const product = bySku.get(String(item.sku ?? ""))!;
          return { product_id: product.id, name: product.name, sku: product.sku, quantity: Math.max(1, Number(item.quantity ?? 1)), unit_price: Number(product.price_sar ?? 0) };
        });
        const total = orderProducts.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
        const destination = [address["address1"], address["city"], address["country"]].filter(Boolean).join(", ") || "Shopify customer address";
        const { data: tejaraaOrder, error: orderError } = await admin.from("orders").insert({
          user_id: connection.user_id,
          type: "dropship",
          destination,
          customer_name: customerName,
          products: orderProducts as unknown as Json,
          total,
          status: "pending",
          metadata: {
            order_mode: "dropship",
            source: "shopify",
            shopify_connection_id: connection.id,
            shopify_order_id: externalId,
            shopify_order_number: payload.name ?? payload.order_number ?? "",
            end_customer: {
              name: customerName,
              email: payload.customer?.email ?? payload.email ?? null,
              phone: String(address["phone"] ?? ""),
              address: String(address["address1"] ?? ""),
              city: String(address["city"] ?? ""),
            },
          } as unknown as Json,
        }).select("id").single();
        if (orderError) throw orderError;

        const wallet = await admin.rpc("wallet_apply", { _user_id: connection.user_id, _amount: -total, _type: "order", _description: `Shopify order ${payload.name ?? externalId}` });
        const paid = (wallet.data as { ok?: boolean } | null)?.ok === true;
        await admin.from("shopify_orders").update({ tejaraa_order_id: tejaraaOrder.id, status: paid ? "paid" : "awaiting_payment", last_error: paid ? null : "Not enough wallet balance — top up to release this order" }).eq("id", order.id);
        if (!paid) await admin.from("orders").update({ status: "awaiting_payment" }).eq("id", tejaraaOrder.id);
        await admin.rpc("create_notification", {
          _user_id: connection.user_id,
          _title: paid ? "New Shopify order" : "Shopify order needs wallet top-up",
          _body: `Order ${payload.name ?? externalId} from your Shopify store.`,
          _type: "order",
          _link: `/dropshipping/integrations/shopify/${connection.id}?tab=orders`,
          _metadata: { order_id: tejaraaOrder.id } as Json,
        });
      } else {
        await admin.from("shopify_orders").update({ status: "unmatched", last_error: "No Tejaraa products matched this order's SKUs" }).eq("id", order.id);
      }
    }

    await admin.from("shopify_connections").update({ last_order_sync_at: new Date().toISOString() }).eq("id", connection.id);
    await logShopify(admin, connection, "order_import", "ok", { externalId, items: items.length }, "", startedAt);
    return { orderId: order.id };
  } catch (error) {
    await logShopify(admin, connection, "order_import", "error", { externalId }, safeMessage(error), startedAt);
    throw error;
  }
}

/** Pushes Tejaraa tracking back to Shopify and marks the order fulfilled there. */
export async function fulfilShopifyOrder(admin: AdminClient, connection: ShopifyConnection, shopifyOrderRowId: string, tracking: { number?: string; company?: string; url?: string }) {
  const startedAt = Date.now();
  const { data: row } = await admin.from("shopify_orders").select("*").eq("id", shopifyOrderRowId).eq("connection_id", connection.id).maybeSingle();
  if (!row) throw new Error("Shopify order not found");
  try {
    const gid = `gid://shopify/Order/${row.external_id}`;
    const data = await shopifyGraphql<{ order: { fulfillmentOrders: { nodes: Array<{ id: string; status: string }> } } | null }>(
      connection,
      `query TejaraaFulfillmentOrders($id: ID!) { order(id: $id) { fulfillmentOrders(first: 10, query: "status:open") { nodes { id status } } } }`,
      { id: gid },
    );
    const fulfillmentOrders = data.order?.fulfillmentOrders.nodes ?? [];
    if (!fulfillmentOrders.length) throw new Error("Shopify has no open fulfilment for this order");
    const result = await shopifyGraphql<{ fulfillmentCreateV2: { userErrors: Array<{ field?: string[] | null; message?: string }> } }>(
      connection,
      `mutation TejaraaFulfil($fulfillment: FulfillmentV2Input!) {
        fulfillmentCreateV2(fulfillment: $fulfillment) { userErrors { field message } }
      }`,
      {
        fulfillment: {
          lineItemsByFulfillmentOrder: fulfillmentOrders.map((entry) => ({ fulfillmentOrderId: entry.id })),
          notifyCustomer: true,
          ...(tracking.number ? { trackingInfo: { number: tracking.number, ...(tracking.company ? { company: tracking.company } : {}), ...(tracking.url ? { url: tracking.url } : {}) } } : {}),
        },
      },
    );
    const message = userErrorMessage(result.fulfillmentCreateV2.userErrors);
    if (message) throw new Error(message);
    await admin.from("shopify_orders").update({ fulfillment_status: "fulfilled", status: "fulfilled", last_error: null }).eq("id", row.id);
    await logShopify(admin, connection, "order_fulfil", "ok", { externalId: row.external_id, tracking }, "", startedAt);
    return { ok: true };
  } catch (error) {
    const message = safeMessage(error);
    await admin.from("shopify_orders").update({ last_error: message }).eq("id", row.id);
    await logShopify(admin, connection, "order_fulfil", "error", { externalId: row.external_id }, message, startedAt);
    throw new Error(message);
  }
}

export async function processShopifyJobs(admin: AdminClient, limit = 30) {
  const now = new Date().toISOString();
  const { data: jobs } = await admin.from("shopify_sync_jobs").select("*").eq("status", "queued").lte("run_after", now).order("created_at").limit(limit);
  const results: Array<{ id: string; ok: boolean }> = [];
  for (const job of jobs ?? []) {
    const { data: claimed } = await admin.from("shopify_sync_jobs").update({ status: "running", locked_at: now, attempts: job.attempts + 1 }).eq("id", job.id).eq("status", "queued").select("*").maybeSingle();
    if (!claimed) continue;
    const { data: connection } = await admin.from("shopify_connections").select("*").eq("id", claimed.connection_id).eq("status", "healthy").maybeSingle();
    if (!connection) { await admin.from("shopify_sync_jobs").update({ status: "dead", last_error: "Connection is not healthy" }).eq("id", claimed.id); continue; }
    try {
      const payload = (claimed.payload ?? {}) as Record<string, unknown>;
      if (claimed.job_type === "sync_product") await syncShopifyLink(admin, connection, claimed.entity_id);
      if (claimed.job_type === "publish_product") await publishShopifyProducts(admin, connection, [claimed.entity_id]);
      if (claimed.job_type === "import_order") await importShopifyOrder(admin, connection, payload["order"] as ShopifyOrderPayload);
      if (claimed.job_type === "fulfil_order") await fulfilShopifyOrder(admin, connection, claimed.entity_id, { number: String(payload["tracking_number"] ?? "") || undefined, company: String(payload["carrier"] ?? "") || undefined });
      await admin.from("shopify_sync_jobs").update({ status: "completed", completed_at: new Date().toISOString(), last_error: null }).eq("id", claimed.id);
      results.push({ id: claimed.id, ok: true });
    } catch (error) {
      const dead = claimed.attempts >= claimed.max_attempts;
      const delay = Math.min(3600, 2 ** claimed.attempts * 30);
      await admin.from("shopify_sync_jobs").update({ status: dead ? "dead" : "queued", run_after: new Date(Date.now() + delay * 1000).toISOString(), last_error: safeMessage(error) }).eq("id", claimed.id);
      results.push({ id: claimed.id, ok: false });
    }
  }
  return results;
}
