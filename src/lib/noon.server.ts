import { createCipheriv, createDecipheriv, createHash, createPrivateKey, randomBytes, randomUUID, sign as signBytes } from "node:crypto";
import type { Database, Json } from "@/integrations/supabase/types";

type AdminClient = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];
type NoonConnection = Database["public"]["Tables"]["noon_connections"]["Row"];

const PROD_HOST = "https://noon-api-gateway.noon.partners";
const SANDBOX_HOST = "https://noon-sandbox-api-gateway.noon.partners";
const USER_AGENT = "Tejaraa-Noon-Connector/1.0";

function keyMaterial() {
  const value = process.env["NOON_CREDENTIAL_ENCRYPTION_KEY"];
  if (!value) throw new Error("Noon credential encryption is not configured");
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
  if (version !== "v1" || !iv || !tag || !payload) throw new Error("Stored Noon credential is invalid");
  const decipher = createDecipheriv("aes-256-gcm", keyMaterial(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(payload, "base64")), decipher.final()]).toString("utf8");
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function loginJwt(connection: NoonConnection) {
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT", kid: connection.key_id }));
  const payload = base64Url(JSON.stringify({ sub: connection.key_id, iat: Math.floor(Date.now() / 1000), jti: randomUUID() }));
  const unsigned = `${header}.${payload}`;
  const privateKey = createPrivateKey(decryptCredential(connection.private_key_ciphertext));
  const signature = signBytes("RSA-SHA256", Buffer.from(unsigned), privateKey).toString("base64url");
  return `${unsigned}.${signature}`;
}

/**
 * Noon hands partners a single credential (a PEM private key, or a JSON bundle
 * containing it). Pull out whatever metadata is embedded so the merchant only
 * has to paste one value.
 */
export function parseNoonCredential(raw: string, keyIdHint?: string) {
  const text = raw.trim();
  let keyId = (keyIdHint ?? "").trim();
  let projectCode = "";
  let privateKey = text;
  if (text.startsWith("{")) {
    try {
      const json = JSON.parse(text) as Record<string, unknown>;
      keyId = keyId || String(json["key_id"] ?? json["keyId"] ?? json["kid"] ?? json["client_id"] ?? json["sub"] ?? "");
      projectCode = String(json["project_code"] ?? json["projectCode"] ?? json["default_project_code"] ?? json["project"] ?? "");
      privateKey = String(json["private_key"] ?? json["privateKey"] ?? json["key"] ?? "");
    } catch {
      privateKey = text;
    }
  }
  if (!privateKey.includes("BEGIN")) {
    const match = text.match(/-----BEGIN[\s\S]+?-----END[^-]+-----/);
    if (match) privateKey = match[0];
  }
  privateKey = privateKey.replace(/\\n/g, "\n").trim();
  if (!privateKey.includes("PRIVATE KEY")) throw new Error("That does not look like a Noon private key. Paste the full key including the BEGIN and END lines.");
  if (!keyId) keyId = text.match(/(?:key[_ -]?id|kid)\s*[:=]\s*"?([A-Za-z0-9._-]{4,})/i)?.[1] ?? "";
  if (!projectCode) projectCode = text.match(/project[_ -]?code\s*[:=]\s*"?([A-Za-z0-9._-]{2,})/i)?.[1] ?? "";
  try {
    createPrivateKey(privateKey);
  } catch {
    throw new Error("The private key could not be read. Copy it again from the Noon portal.");
  }
  if (!keyId) throw new Error("Noon also needs the Key ID (service account ID) that came with this key. Add it in the connect form or in Settings.");
  return { privateKey, keyId, projectCode };
}

function safeMessage(value: unknown) {
  const text = value instanceof Error ? value.message : String(value);
  return text.replace(/-----BEGIN[\s\S]*?-----END[^-]+-----/g, "[redacted]").slice(0, 700);
}

function providerError(status: number, body: string) {
  let message = `Noon returned HTTP ${status}`;
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string; code?: string }; message?: string };
    message = [parsed.error?.code, parsed.error?.message ?? parsed.message].filter(Boolean).join(": ") || message;
  } catch { /* keep default */ }
  if (/service account/i.test(message)) {
    return `${message} — check that the Key ID matches this private key and that the service account is active in the Noon portal.`;
  }
  return message;
}

export async function noonLogin(connection: NoonConnection) {
  const body: Record<string, unknown> = { token: loginJwt(connection) };
  if (connection.project_code) body["default_project_code"] = connection.project_code;
  const login = await fetch(`${PROD_HOST}/identity/public/v1/api/login`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", "user-agent": USER_AGENT },
    body: JSON.stringify(body),
  });
  const loginText = await login.text();
  if (!login.ok) throw new Error(providerError(login.status, loginText));
  const cookies = login.headers.getSetCookie?.() ?? [];
  const cookie = cookies.map((part) => part.split(";")[0]).join("; ") || login.headers.get("set-cookie")?.split(";")[0] || "";
  let payload: Record<string, unknown> = {};
  try { payload = loginText ? (JSON.parse(loginText) as Record<string, unknown>) : {}; } catch { payload = {}; }
  return { cookie, payload, requestId: login.headers.get("x-request-id") ?? "" };
}

export async function noonRequest<T>(connection: NoonConnection, path: string, init: RequestInit = {}, useIdentityHost = false): Promise<{ data: T; requestId: string }> {
  const { cookie, requestId: loginRequestId } = await noonLogin(connection);
  if (useIdentityHost && path === "/identity/public/v1/api/login") return { data: {} as T, requestId: loginRequestId };


  const host = connection.mode === "sandbox" ? SANDBOX_HOST : PROD_HOST;
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  headers.set("content-type", "application/json");
  headers.set("user-agent", USER_AGENT);
  if (connection.project_code) headers.set("x-project", connection.project_code);
  if (cookie) headers.set("cookie", cookie);

  let response: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(`${host}${path}`, { ...init, headers });
    if (response.status !== 429 && response.status < 500) break;
    await new Promise((resolve) => setTimeout(resolve, Math.min(4000, 300 * 2 ** attempt + Math.random() * 250)));
  }
  if (!response) throw new Error("Noon did not return a response");
  const text = await response.text();
  if (!response.ok) throw new Error(providerError(response.status, text));
  return { data: (text ? JSON.parse(text) : {}) as T, requestId: response.headers.get("x-request-id") ?? "" };
}

export async function logNoon(admin: AdminClient, connection: NoonConnection, operation: string, status: "ok" | "error", detail: Record<string, unknown> = {}, message = "", startedAt = Date.now()) {
  await admin.from("noon_sync_log").insert({
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

export async function testNoonConnection(connection: NoonConnection) {
  const startedAt = Date.now();
  const result = await noonRequest<Record<string, unknown>>(connection, "/content/v1/categories/list", {
    method: "POST",
    body: JSON.stringify({}),
  });
  return { ok: true, requestId: result.requestId, elapsedMs: Date.now() - startedAt };
}

function collectStrings(value: unknown, keys: string[], sink: Set<string>, depth = 0) {
  if (!value || depth > 4) return;
  if (Array.isArray(value)) { for (const entry of value) collectStrings(entry, keys, sink, depth + 1); return; }
  if (typeof value !== "object") return;
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (keys.includes(key.toLowerCase())) {
      if (typeof entry === "string" && entry.trim()) sink.add(entry.trim());
      if (Array.isArray(entry)) for (const item of entry) { if (typeof item === "string" && item.trim()) sink.add(item.trim()); }
    }
    collectStrings(entry, keys, sink, depth + 1);
  }
}

const WAREHOUSE_LIST_PATH = "/warehouse-platform/v1/warehouses/list";

/**
 * After a successful login, pull everything Noon can tell us about the account
 * (project code, markets, warehouses, categories) so the merchant does not have
 * to type any of it.
 */
export async function discoverNoonAccount(admin: AdminClient, connection: NoonConnection) {
  const startedAt = Date.now();
  const { payload } = await noonLogin(connection);
  const projects = new Set<string>();
  collectStrings(payload, ["project_code", "projectcode", "default_project_code", "code", "project"], projects);
  const markets = new Set<string>();
  collectStrings(payload, ["country_code", "countrycode", "market", "markets", "countries"], markets);

  let current: NoonConnection = connection;
  const patch: Record<string, unknown> = {};
  if (!connection.project_code && projects.size) patch["project_code"] = [...projects][0];
  const marketCodes = [...markets].map((value) => value.toLowerCase()).filter((value) => value === "sa" || value === "ae");
  if (marketCodes.length) patch["enabled_markets"] = [...new Set(marketCodes)];
  if (Object.keys(patch).length) {
    const { data: updated } = await admin.from("noon_connections").update(patch as never).eq("id", connection.id).select("*").maybeSingle();
    if (updated) current = updated;
  }

  const warehouses = await fetchNoonWarehouses(admin, current);

  let categories = 0;
  try { categories = (await syncNoonCategories(admin, current)).count; } catch { categories = 0; }

  await logNoon(admin, current, "account_discovery", "ok", { projects: [...projects].slice(0, 5), markets: marketCodes, warehouses, categories }, "", startedAt);
  return { connection: current, projectCode: current.project_code, markets: current.enabled_markets, warehouses, categories };
}


/**
 * Fetch every warehouse the seller has on Noon (active and inactive) and
 * upsert them, keeping the merchant's own enabled/processing/safety choices.
 */
export async function fetchNoonWarehouses(admin: AdminClient, connection: NoonConnection) {
  const startedAt = Date.now();
  const allRows: Array<Record<string, unknown>> = [];
  let nextToken: string | null = null;
  let requestId = "";

  try {
    for (let page = 0; page < 20; page += 1) {
      const requestBody: Record<string, string> = nextToken ? { next_token: nextToken } : {};
      const response: { data: Record<string, unknown>; requestId: string } = await noonRequest<Record<string, unknown>>(connection, WAREHOUSE_LIST_PATH, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      requestId = response.requestId || requestId;
      const responseData: Record<string, unknown> = response.data;
      const rows = (responseData["warehouses"] ?? []) as Array<Record<string, unknown>>;
      allRows.push(...rows);
      nextToken = typeof responseData["next_token"] === "string" && responseData["next_token"] ? responseData["next_token"] : null;
      if (!nextToken) break;
    }

    const fallbackMarket = connection.enabled_markets?.[0] ?? "sa";
    const mapped = allRows.map((row) => {
      const fulfillmentCode = String(row["fulfillment_system_code"] ?? "").toLowerCase();
      const warehouseCode = String(row["warehouse_code"] ?? row["code"] ?? row["warehouse"] ?? "");
      const marketHint = `${String(row["country_code"] ?? row["market"] ?? "")} ${fulfillmentCode} ${warehouseCode}`.toLowerCase();
      const inferredMarket = marketHint.includes("uae") || marketHint.includes("_ae") || marketHint.endsWith("ae") ? "ae"
        : marketHint.includes("ksa") || marketHint.includes("_sa") || marketHint.endsWith("sa") ? "sa"
          : fallbackMarket;
      const isActive = row["is_active"];
      const rawStatus = String(row["status"] ?? row["state"] ?? (isActive === false || row["active"] === false ? "inactive" : "active")).toLowerCase();
      const noonProcessingCandidates = [row["processing_time"], row["processingTime"], row["processing_days"], row["handling_time"], row["handling_days"], row["fulfillment_time"], row["sla_days"]];
      const noonProcessing = noonProcessingCandidates.map((value) => Number(value)).find((value) => Number.isFinite(value) && value >= 0);
      return {
        user_id: connection.user_id,
        connection_id: connection.id,
        market: inferredMarket,
        warehouse_code: warehouseCode,
        warehouse_name: String(row["display_name"] ?? row["warehouse_name"] ?? row["name"] ?? "") || undefined,
        processing_time: noonProcessing ?? 1,
        safety_stock: Number(row["safety_stock"] ?? 0),
        noon_status: isActive === false || rawStatus.includes("inact") || rawStatus.includes("disable") || rawStatus.includes("suspend") ? "inactive" : "active",
        updated_at: new Date().toISOString(),
      };
    }).filter((row) => row.warehouse_code);

    if (mapped.length) {
      const codes = [...new Set(mapped.map((row) => row.warehouse_code))];
      const { data: existing } = await admin.from("noon_warehouses").select("warehouse_code,enabled,processing_time,safety_stock").eq("connection_id", connection.id).in("warehouse_code", codes);
      const choices = new Map((existing ?? []).map((row) => [row.warehouse_code, row]));
      const rowsToSave = mapped.map((row) => {
        const saved = choices.get(row.warehouse_code);
        if (!saved) return row;
        // Noon is the source of truth for processing time when it returns one;
        // otherwise keep the merchant's saved value.
        const noonsValue = allRows.find((raw) => String(raw["warehouse_code"] ?? raw["code"] ?? "") === row.warehouse_code);
        const noonHasProcessing = noonsValue !== undefined && [noonsValue["processing_time"], noonsValue["processingTime"], noonsValue["processing_days"], noonsValue["handling_time"], noonsValue["handling_days"], noonsValue["fulfillment_time"], noonsValue["sla_days"]].some((value) => Number.isFinite(Number(value)));
        return { ...row, enabled: saved.enabled, safety_stock: saved.safety_stock, processing_time: noonHasProcessing ? row.processing_time : saved.processing_time };
      });
      const { error: deleteError } = await admin.from("noon_warehouses").delete().eq("connection_id", connection.id).in("warehouse_code", codes);
      if (deleteError) throw deleteError;
      const { error } = await admin.from("noon_warehouses").upsert(rowsToSave, { onConflict: "connection_id,market,warehouse_code" });
      if (error) throw error;
    }
    await logNoon(admin, connection, "warehouse_sync", "ok", { count: mapped.length, requestId, sampleKeys: allRows[0] ? Object.keys(allRows[0]) : [], sample: allRows[0] ?? null }, "", startedAt);
    return mapped.length;
  } catch (caught) {
    const message = safeMessage(caught);
    await logNoon(admin, connection, "warehouse_sync", "error", { endpoint: WAREHOUSE_LIST_PATH }, message, startedAt);
    throw new Error(`Noon warehouse sync failed: ${message}`);
  }
}

type FlatNoonCategory = {
  category_code: string;
  name_en: string;
  name_ar: string;
  parent_code: string | null;
  level: number;
  path_en: string;
  path_ar: string | null;
  raw_payload: Json;
  synced_at: string;
};

export async function syncNoonCategories(admin: AdminClient, connection: NoonConnection) {
  const startedAt = Date.now();
  try {
    const { data, requestId } = await noonRequest<unknown>(connection, "/content/v1/categories/list", { method: "POST", body: "{}" });
    const root = (data ?? {}) as Record<string, unknown>;
    let rows: Array<Record<string, unknown>> = [];
    if (Array.isArray(data)) rows = data as Array<Record<string, unknown>>;
    else {
      const known = root["categories"] ?? root["items"] ?? root["results"] ?? root["data"] ?? root["content"] ?? root["category_list"];
      if (Array.isArray(known)) rows = known as Array<Record<string, unknown>>;
      else {
        let best: unknown[] = [];
        for (const value of Object.values(root)) if (Array.isArray(value) && value.length > best.length) best = value;
        rows = best as Array<Record<string, unknown>>;
      }
    }
    const now = new Date().toISOString();
    const flat = new Map<string, FlatNoonCategory>();
    const humanize = (value: string) => value.replace(/[_-]+/g, " ").trim().replace(/\b\w/g, (char) => char.toUpperCase());
    // Noon returns codes like "apparel-blazers_suits-blazer" — each dash is a level.
    if (rows.length && typeof rows[0] === "string") {
      for (const rawCode of rows as unknown as string[]) {
        const code = String(rawCode).trim();
        if (!code) continue;
        const parts = code.split("-").filter(Boolean);
        let prefix = "";
        parts.forEach((part, index) => {
          prefix = prefix ? `${prefix}-${part}` : part;
          if (flat.has(prefix)) return;
          flat.set(prefix, {
            category_code: prefix,
            name_en: humanize(part),
            name_ar: "",
            parent_code: index === 0 ? null : parts.slice(0, index).join("-"),
            level: index,
            path_en: parts.slice(0, index + 1).map(humanize).join(" / "),
            path_ar: null,
            raw_payload: { code: prefix } as Json,
            synced_at: now,
          });
        });
      }
    }
    const visit = (items: Array<Record<string, unknown>>, parentCode: string | null, level: number, ancestors: Array<{ en: string; ar: string }>) => {
      for (const item of items) {
        const code = String(item["code"] ?? item["category_code"] ?? item["category"] ?? "");
        if (!code) continue;
        const nameEn = String(item["name"] ?? item["name_en"] ?? item["category"] ?? "");
        const nameAr = String(item["name_ar"] ?? "");
        const explicitParent = String(item["parent_code"] ?? item["parent"] ?? "") || null;
        const effectiveParent = parentCode ?? explicitParent;
        const effectiveLevel = parentCode != null || explicitParent == null ? level : Number(item["level"] ?? level) || level;
        const pathEn = [...ancestors.map((entry) => entry.en), nameEn].filter(Boolean).join(" / ");
        const pathArParts = [...ancestors.map((entry) => entry.ar), nameAr].filter(Boolean);
        flat.set(code, {
          category_code: code,
          name_en: nameEn,
          name_ar: nameAr,
          parent_code: effectiveParent,
          level: effectiveLevel,
          path_en: pathEn,
          path_ar: pathArParts.length ? pathArParts.join(" / ") : null,
          raw_payload: item as Json,
          synced_at: now,
        });
        const children = (item["children"] ?? item["subcategories"] ?? item["sub_categories"] ?? item["childs"]) as Array<Record<string, unknown>> | undefined;
        if (Array.isArray(children) && children.length && level < 8) {
          visit(children, code, level + 1, [...ancestors, { en: nameEn, ar: nameAr }]);
        }
      }
    };
    visit(rows, null, 0, []);
    const payload = [...flat.values()];
    for (let index = 0; index < payload.length; index += 500) {
      const { error } = await admin.from("noon_category_cache").upsert(payload.slice(index, index + 500), { onConflict: "category_code" });
      if (error) throw error;
    }
    await logNoon(admin, connection, "category_sync", "ok", { count: payload.length, levels: Math.max(0, ...payload.map((row) => row.level)) + 1, requestId, ...(payload.length === 0 ? { responseKeys: Object.keys(root).slice(0, 12), sample: JSON.stringify(root).slice(0, 400) } : {}) }, "", startedAt);
    return { count: payload.length, levels: Math.max(0, ...payload.map((row) => row.level)) + 1 };
  } catch (error) {
    await logNoon(admin, connection, "category_sync", "error", {}, safeMessage(error), startedAt);
    throw error;
  }
}

type ProductRowLite = { id: string; name: string; name_ar?: string | null; description?: string | null; description_ar?: string | null; gtin?: string | null; images?: string[] | null; price_sar?: number | null; cost_usd?: number | null; stock_qty?: number | null };
type WarehouseLite = { market: string; warehouse_code: string; processing_time?: number | null; safety_stock?: number | null };
type MarketSetting = { product_link_id: string; market: string; markup_type: string; markup_value: number; minimum_margin_percent: number | null; override_price: number | null };

/** Compute the Noon selling price for one market: manual override wins, then the link markup, then the per-country connection markup. */
export function computeNoonPrice(product: ProductRowLite, setting: MarketSetting | null, rules: Record<string, unknown>, market?: string) {
  const base = Number(product.price_sar ?? 0);
  if (!base) return null;
  if (setting?.override_price) return Number(setting.override_price);
  const markupType = setting?.markup_type ?? String(rules["type"] ?? "percent");
  const perMarket = (rules["perMarket"] ?? {}) as Record<string, unknown>;
  const markupValue = setting ? Number(setting.markup_value) : Number(perMarket[market ?? ""] ?? rules["value"] ?? 0);
  const minimumMargin = setting?.minimum_margin_percent ?? 0;
  let price = markupType === "fixed" ? base + markupValue : base * (1 + markupValue / 100);
  if (minimumMargin && product.cost_usd) {
    const floor = Number(product.cost_usd) * 3.75 * (1 + minimumMargin / 100);
    price = Math.max(price, floor);
  }
  return Math.round(price * 100) / 100;
}

/** Noon's BarcodeSkuMap accepts any seller barcode string (GTIN or an internal code). */
export const BARCODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{4,29}$/;
export const BARCODE_MESSAGE = "Invalid barcode: use 5 to 30 letters, numbers or dashes";
export function isValidBarcode(value: string | null | undefined): value is string {
  if (!value) return false;
  return BARCODE_PATTERN.test(value.trim());
}

/** Public site origin used to turn stored image paths into links Noon can download. */
const PUBLIC_SITE_ORIGIN = (process.env["PUBLIC_SITE_URL"] || "https://tejaraa03.lovable.app").replace(/\/+$/, "");

/** Absolute, publicly reachable image URLs for a product (relative paths are prefixed with the site origin). */
export function absoluteImageUrls(images: string[] | null | undefined): string[] {
  return (images ?? [])
    .map((raw) => String(raw ?? "").trim())
    .filter(Boolean)
    .map((url) => (/^https?:\/\//i.test(url) ? url : `${PUBLIC_SITE_ORIGIN}/${url.replace(/^\/+/, "")}`))
    .filter((url) => /^https?:\/\//i.test(url));
}

/** What a link still needs before Noon will accept it. Empty array = ready to publish. */
export function noonReadiness(link: { noon_category_code: string | null; partner_sku?: string | null }, product: ProductRowLite | undefined, settings: MarketSetting[], warehouses: WarehouseLite[], connection: NoonConnection) {
  const missing: string[] = [];
  if (!product) return ["Product not found in the catalog"];
  if (!link.noon_category_code) missing.push("Noon category");
  // A barcode is optional for partner-fulfilled selling in KSA/UAE; Noon maps it
  // separately through Catalog BarcodeSkuMap only when the seller provides one.

  if (!product.images?.length) missing.push("Product image");
  const rules = (connection.pricing_rules ?? {}) as Record<string, unknown>;
  const markets = (connection.enabled_markets ?? []) as string[];
  for (const market of markets) {
    const setting = settings.find((entry) => entry.product_link_id === (link as { id?: string }).id && entry.market === market) ?? null;
    if (!computeNoonPrice(product, setting, rules, market)) missing.push(`Price (${market.toUpperCase()})`);
    if (!warehouses.some((warehouse) => warehouse.market === market && warehouse.warehouse_code)) missing.push(`Warehouse (${market.toUpperCase()})`);
  }
  if (markets.length && Number(product.stock_qty ?? 0) <= Math.max(0, ...warehouses.map((warehouse) => Number(warehouse.safety_stock ?? 0)), 0)) missing.push("Stock above safety level");
  return missing;
}

async function pushPrice(admin: AdminClient, connection: NoonConnection, partnerSku: string, prices: Array<{ market: string; price: number }>) {
  const startedAt = Date.now();
  try {
    await noonRequest(connection, "/pricing/v1/pricing/upsert", {
      method: "POST",
      body: JSON.stringify({ items: prices.map((entry) => ({ partner_sku: partnerSku, country_code: entry.market, price: entry.price, is_active: true })) }),
    });
    await logNoon(admin, connection, "price_push", "ok", { partnerSku, prices }, "", startedAt);
    return null;
  } catch (error) {
    const message = safeMessage(error);
    await logNoon(admin, connection, "price_push", "error", { partnerSku }, message, startedAt);
    return `Price push failed: ${message}`;
  }
}

async function pushStock(admin: AdminClient, connection: NoonConnection, partnerSku: string, stockQty: number, warehouses: WarehouseLite[]) {
  const startedAt = Date.now();
  try {
    const stocks = warehouses.map((warehouse) => ({
      warehouse_code: warehouse.warehouse_code,
      partner_sku: partnerSku,
      qty: Math.max(0, Math.floor(stockQty - Number(warehouse.safety_stock ?? 0))),
      processing_time: `${Math.max(0, Number(warehouse.processing_time ?? 1))}d`,
    }));
    await noonRequest(connection, "/stock/v1/stock-update", {
      method: "POST",
      body: JSON.stringify({ items: stocks }),
    });
    await logNoon(admin, connection, "stock_push", "ok", { partnerSku, stocks }, "", startedAt);
    return null;
  } catch (error) {
    const message = safeMessage(error);
    await logNoon(admin, connection, "stock_push", "error", { partnerSku }, message, startedAt);
    return `Stock push failed: ${message}`;
  }
}

export type NoonSubmissionImage = { url: string; reachable: boolean | null; status: number | null; contentType: string | null };
export type NoonSubmissionReport = {
  linkId: string;
  productName: string;
  partnerSku: string;
  barcode: string;
  barcodeValid: boolean;
  categoryCode: string | null;
  images: NoonSubmissionImage[];
  prices: Array<{ market: string; price: number }>;
  stock: Array<{ warehouse_code: string; qty: number; processing_time: string }>;
  issues: string[];
  alreadySubmitted: boolean;
  noonSkuParent: string | null;
  payload: Record<string, unknown> | null;
  barcodePayload: Record<string, unknown> | null;
};

/** Sentinel: Noon has not created the SKU yet, so mapping is queued, not failed. */
const PENDING_BARCODE = "__pending_barcode__";

type NoonBarcodeMapResponse = {
  items?: Array<{
    barcode?: string;
    partner_sku?: string;
    status?: { status_id?: number; status_code?: string; message?: string };
  }>;
};

type NoonContentUpsertResponse = {
  sku_parent?: string;
  variants?: Array<{ sku?: string; partner_sku?: string; psku_code?: string }>;
  status?: { status_id?: number; status_code?: string; message?: string; details?: unknown[] };
};

/**
 * Noon manages barcodes through Catalog BarcodeSkuMap, separately from product
 * content. The SKU only exists once Noon's asynchronous catalog pipeline has
 * created it, so "partner_sku doesn't exist" is a wait, not a failure: we retry
 * briefly, then queue a background job that keeps trying until the SKU appears.
 */
async function pushBarcode(admin: AdminClient, connection: NoonConnection, linkId: string, partnerSku: string, barcode: string, options?: { fromJob?: boolean }) {
  const startedAt = Date.now();
  const payload = { items: [{ partner_sku: partnerSku, barcode }] };
  let lastMessage = "Noon rejected the barcode mapping";
  let waitingForSku = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const { data, requestId } = await noonRequest<NoonBarcodeMapResponse>(connection, "/catplat/v1/barcode/map", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const failed = data.items?.find((item) => {
        const code = String(item.status?.status_code ?? "").toUpperCase();
        return Boolean(code) && !["OK", "SUCCESS", "STATUS_OK"].includes(code);
      });
      if (failed) throw new Error(failed.status?.message || failed.status?.status_code || "Noon rejected the barcode mapping");
      await logNoon(admin, connection, "barcode_map", "ok", { partnerSku, barcode, requestId, response: data, attempt: attempt + 1 }, "", startedAt);
      await admin.from("noon_sync_jobs").update({ status: "completed", completed_at: new Date().toISOString(), last_error: null }).eq("connection_id", connection.id).eq("job_type", "map_barcode").eq("entity_id", linkId).eq("status", "queued");
      return null;
    } catch (error) {
      lastMessage = safeMessage(error);
      const normalised = lastMessage.toLowerCase();
      waitingForSku = normalised.includes("partner_sku doesn't exist") || normalised.includes("partner sku doesn't exist") || normalised.includes("sku does not exist");
      if (!waitingForSku || attempt === 2) break;
      await new Promise((resolve) => setTimeout(resolve, [2000, 5000][attempt]!));
    }
  }
  if (waitingForSku) {
    await logNoon(admin, connection, "barcode_map", "ok", { partnerSku, barcode, linkId, pending: true }, "Noon has not created the SKU yet — barcode mapping queued for retry", startedAt);
    if (!options?.fromJob) {
      const { data: existing } = await admin.from("noon_sync_jobs").select("id").eq("connection_id", connection.id).eq("job_type", "map_barcode").eq("entity_id", linkId).eq("status", "queued").maybeSingle();
      if (!existing) {
        await admin.from("noon_sync_jobs").insert({ user_id: connection.user_id, connection_id: connection.id, job_type: "map_barcode", entity_type: "product_link", entity_id: linkId, status: "queued", max_attempts: 24, run_after: new Date(Date.now() + 15 * 60 * 1000).toISOString(), payload: { partner_sku: partnerSku, barcode } as Json });
      } else {
        await admin.from("noon_sync_jobs").update({ payload: { partner_sku: partnerSku, barcode } as Json, run_after: new Date(Date.now() + 15 * 60 * 1000).toISOString() }).eq("id", existing.id);
      }
    }
    // Not an error for the user: Noon is still creating the SKU.
    return PENDING_BARCODE;
  }
  await logNoon(admin, connection, "barcode_map", "error", { partnerSku, barcode }, lastMessage, startedAt);
  return `Barcode mapping failed: ${lastMessage}`;
}

/** Background retry entry point for a queued barcode mapping. */
async function mapBarcodeJob(admin: AdminClient, connection: NoonConnection, linkId: string, payload: Record<string, unknown>) {
  const { data: link } = await admin.from("noon_product_links").select("partner_sku,product_id").eq("id", linkId).maybeSingle();
  if (!link) return;
  const partnerSku = String(payload["partner_sku"] ?? link.partner_sku ?? "");
  let barcode = String(payload["barcode"] ?? "").trim();
  if (!barcode) {
    const { data: product } = await admin.from("products").select("gtin").eq("id", link.product_id).maybeSingle();
    barcode = String(product?.gtin ?? "").trim();
  }
  if (!partnerSku || !barcode) return;
  const result = await pushBarcode(admin, connection, linkId, partnerSku, barcode, { fromJob: true });
  // Still waiting on Noon's SKU: throw so the queue reschedules this job.
  if (result === PENDING_BARCODE) throw new Error("Noon has not created the SKU yet — will retry");
  if (result) throw new Error(result);
}


/** HEAD-check an image URL so we know Noon can actually download it. */
async function checkImageUrl(url: string): Promise<NoonSubmissionImage> {
  try {
    let response = await fetch(url, { method: "HEAD" });
    if (response.status === 405 || response.status === 501) response = await fetch(url, { method: "GET", headers: { range: "bytes=0-0" } });
    const contentType = response.headers.get("content-type");
    return { url, status: response.status, contentType, reachable: response.ok && !!contentType?.startsWith("image/") };
  } catch {
    return { url, status: null, contentType: null, reachable: false };
  }
}

/**
 * Builds the exact payload Noon will receive for each link and validates it.
 * Shared by the submission preview and the publish flow so both always agree.
 */
export async function buildNoonSubmissions(admin: AdminClient, connection: NoonConnection, linkIds: string[], options?: { checkImages?: boolean; force?: boolean }) {
  const { data: links, error } = await admin.from("noon_product_links").select("*").eq("connection_id", connection.id).in("id", linkIds);
  if (error) throw error;
  const productIds = (links ?? []).map((link) => link.product_id);
  const [{ data: products }, { data: warehouses }, { data: marketSettings }] = await Promise.all([
    admin.from("products").select("*").in("id", productIds),
    admin.from("noon_warehouses").select("*").eq("connection_id", connection.id),
    admin.from("noon_product_market_settings").select("*").in("product_link_id", linkIds),
  ]);
  const productsById = new Map((products ?? []).map((product) => [product.id, product]));
  const settings = (marketSettings ?? []) as MarketSetting[];
  const warehouseRows = (warehouses ?? []) as WarehouseLite[];
  const rules = (connection.pricing_rules ?? {}) as Record<string, unknown>;
  const markets = (connection.enabled_markets ?? []) as string[];
  const seenBarcodes = new Map<string, string>();
  const reports: NoonSubmissionReport[] = [];

  for (const link of links ?? []) {
    const product = productsById.get(link.product_id) as ProductRowLite | undefined;
    const issues = noonReadiness(link, product, settings, warehouseRows, connection);
    const barcode = String(product?.gtin || "").trim();
    const barcodeValid = isValidBarcode(barcode);
    if (barcode && !barcodeValid) issues.push(BARCODE_MESSAGE);
    if (barcodeValid) {
      const batchClaim = seenBarcodes.get(barcode);
      if (batchClaim && batchClaim !== link.partner_sku) issues.push(`Barcode "${barcode}" is used by another product in this batch (${batchClaim})`);
      seenBarcodes.set(barcode, link.partner_sku);
      const { data: duplicates } = await admin.from("products").select("sku").eq("gtin", barcode).neq("id", product?.id ?? "").limit(1);
      if (duplicates?.length) issues.push(`Barcode "${barcode}" is already used by product ${duplicates[0].sku}`);
    }

    const urls = absoluteImageUrls(product?.images);
    const images: NoonSubmissionImage[] = options?.checkImages
      ? await Promise.all(urls.map((url) => checkImageUrl(url)))
      : urls.map((url) => ({ url, reachable: null, status: null, contentType: null }));
    if (!images.length) issues.push("Product image could not be shared publicly — re-upload the photo");
    else if (options?.checkImages && !images.some((image) => image.reachable)) issues.push("Noon cannot download the product image from its public link");

    const prices = markets
      .map((market) => ({ market, price: computeNoonPrice(product!, settings.find((entry) => entry.product_link_id === link.id && entry.market === market) ?? null, rules, market)! }))
      .filter((entry) => entry.price);
    const stock = warehouseRows.filter((warehouse) => markets.includes(warehouse.market)).map((warehouse) => ({
      warehouse_code: warehouse.warehouse_code,
      qty: Math.max(0, Math.floor(Number(product?.stock_qty ?? 0) - Number(warehouse.safety_stock ?? 0))),
      processing_time: `${Math.max(0, Number(warehouse.processing_time ?? 1))}d`,
    }));

    const usableImages = (options?.checkImages ? images.filter((image) => image.reachable !== false) : images).map((image, index) => ({ url: image.url, sort: index + 1 }));
    const savedAttributes = { ...(link.attribute_values as Record<string, unknown>) };
    // Remove legacy fields Noon either derives from the product envelope or
    // rejects as category attributes. Keeping them here prevents SKU creation.
    for (const key of ["title", "gtin", "barcode", "barcodes", "image", "images", "raw_image_url", "product_title", "long_description"]) delete savedAttributes[key];
    const payload = issues.length || !product ? null : {
      skus: [{
        partner_sku: link.partner_sku,
      }],
      brand: "Tejaraa",
      category: link.noon_category_code,
      images: usableImages,
      attributes: {
        ...savedAttributes,
        product_title: { values: [{ value: product.name, language: "LANGUAGE_EN" }, ...(product.name_ar ? [{ value: product.name_ar, language: "LANGUAGE_AR" }] : [])] },
        long_description: { values: [{ value: product.description ?? "", language: "LANGUAGE_EN" }, ...(product.description_ar ? [{ value: product.description_ar, language: "LANGUAGE_AR" }] : [])] },
      },
    };
    const barcodePayload = issues.length || !product || !barcodeValid ? null : { items: [{ partner_sku: link.partner_sku, barcode }] };

    reports.push({
      linkId: link.id,
      productName: product?.name ?? "Unknown product",
      partnerSku: link.partner_sku,
      barcode,
      barcodeValid,
      categoryCode: link.noon_category_code,
      images,
      prices,
      stock,
      issues,
      // Noon can accept content and return the parent SKU before its asynchronous
      // catalog pipeline creates a variant/PSKU. The parent confirms acceptance.
      alreadySubmitted: link.content_status === "submitted" && Boolean(link.noon_sku_parent),
      noonSkuParent: link.noon_sku_parent ?? null,
      payload,
      barcodePayload,
    });
  }
  return { reports, links: links ?? [], productsById, settings, warehouseRows, rules, markets };
}

export async function publishNoonProducts(admin: AdminClient, connection: NoonConnection, linkIds: string[], options?: { force?: boolean }) {
  // Same builder the preview uses, so what the user reviews is exactly what is sent.
  const { reports, links, productsById, settings, warehouseRows, rules, markets } = await buildNoonSubmissions(admin, connection, linkIds, { checkImages: true });
  const reportById = new Map(reports.map((report) => [report.linkId, report]));
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const link of links) {
    const product = productsById.get(link.product_id) as ProductRowLite | undefined;
    const report = reportById.get(link.id)!;
    const startedAt = Date.now();
    try {
      if (report.issues.length) throw new Error(`Not ready: ${report.issues.join(", ")}`);
      const barcode = report.barcodeValid ? report.barcode : "";
      if (barcode && product!.gtin !== barcode) await admin.from("products").update({ gtin: barcode }).eq("id", product!.id);
      // Skip a repeat content submission for a SKU Noon already accepted; only refresh price and stock.
      if (!options?.force && report.alreadySubmitted) {
        await logNoon(admin, connection, "product_publish", "ok", { productId: product!.id, skipped: "already submitted", noonSkuParent: link.noon_sku_parent }, "Content already submitted — refreshed price and stock only", startedAt);
      } else {
        const { data, requestId } = await noonRequest<NoonContentUpsertResponse>(connection, "/content/v1/product/upsert", {
          method: "POST",
          body: JSON.stringify(report.payload),
        });
        const variant = data.variants?.find((entry) => entry.partner_sku === link.partner_sku) ?? data.variants?.[0];
        const statusId = data.status?.status_id;
        const statusCode = String(data.status?.status_code ?? "").toUpperCase();
        const accepted = (statusId === 0 || ["OK", "SUCCESS", "STATUS_OK"].includes(statusCode)) && Boolean(data.sku_parent);
        if (!accepted) {
          const reason = data.status?.message || data.status?.status_code || "Noon did not create the product SKU";
          await admin.from("noon_product_links").update({ noon_sku_parent: data.sku_parent ?? null, noon_variant_sku: null, psku_code: null, sync_status: "failed", content_status: "rejected", last_error: reason }).eq("id", link.id);
          await logNoon(admin, connection, "product_publish", "error", { productId: product!.id, requestId, response: data }, reason, startedAt);
          throw new Error(`Noon rejected the product content: ${reason}`);
        }
        await admin.from("noon_product_links").update({ noon_sku_parent: data.sku_parent ?? null, noon_variant_sku: variant?.sku ?? null, psku_code: variant?.psku_code ?? null, sync_status: "submitted", content_status: "submitted", last_pushed_at: new Date().toISOString(), last_error: null }).eq("id", link.id);
        await logNoon(admin, connection, "product_publish", "ok", { productId: product!.id, requestId, barcode, images: report.images.map((image) => image.url), response: data }, "", startedAt);
      }

      // BarcodeSkuMap is a separate Catalog API. Unknown barcode fields in
      // UpsertProduct are accepted but ignored, so map it explicitly here.
      const barcodeResult = barcode ? await pushBarcode(admin, connection, link.id, link.partner_sku, barcode) : null;
      const barcodeError = barcodeResult === PENDING_BARCODE ? null : barcodeResult;

      // Content accepted — now make it purchasable with price and stock.
      const prices = markets.map((market) => ({ market, price: computeNoonPrice(product!, settings.find((entry) => entry.product_link_id === link.id && entry.market === market) ?? null, rules, market)! })).filter((entry) => entry.price);
      const marketWarehouses = warehouseRows.filter((warehouse) => markets.includes(warehouse.market));
      const followUps = [barcodeError, await pushPrice(admin, connection, link.partner_sku, prices), await pushStock(admin, connection, link.partner_sku, Number(product!.stock_qty ?? 0), marketWarehouses)].filter(Boolean) as string[];
      if (followUps.length) {
        await admin.from("noon_product_links").update({ sync_status: "content_only", last_error: followUps.join(" · ") }).eq("id", link.id);
        results.push({ id: link.id, ok: false, error: followUps.join(" · ") });
      } else {
        results.push({ id: link.id, ok: true });
      }
    } catch (caught) {
      const message = safeMessage(caught);
      await admin.from("noon_product_links").update({ sync_status: "failed", last_error: message }).eq("id", link.id);
      await logNoon(admin, connection, "product_publish", "error", { linkId: link.id }, message, startedAt);
      results.push({ id: link.id, ok: false, error: message });
    }
  }
  return results;
}

function firstArray(value: unknown, keys: string[]) {
  if (Array.isArray(value)) return value;
  const record = value as Record<string, unknown> | null;
  for (const key of keys) if (Array.isArray(record?.[key])) return record[key] as unknown[];
  return [];
}

export async function fetchAndSaveOrder(admin: AdminClient, connection: NoonConnection, orderReference: string) {
  const startedAt = Date.now();
  try {
    const { data, requestId } = await noonRequest<Record<string, unknown>>(connection, `/fbpi/v1/fbpi-order/${encodeURIComponent(orderReference)}/get`, { method: "GET" });
    const items = firstArray(data["items"] ?? data["order_items"], ["items"]) as Array<Record<string, unknown>>;
    const total = items.reduce((sum, item) => sum + Number(item["price"] ?? item["unit_price"] ?? 0) * Number(item["quantity"] ?? item["qty"] ?? 1), 0);
    const { data: order, error } = await admin.from("noon_orders").upsert({
      user_id: connection.user_id,
      connection_id: connection.id,
      external_reference: orderReference,
      market: String(data["country_code"] ?? data["market"] ?? ""),
      warehouse_code: String(data["warehouse_code"] ?? ""),
      status: "new",
      external_status: String(data["status"] ?? ""),
      currency: String(data["currency"] ?? "SAR"),
      order_total: total,
      raw_payload: data as Json,
      placed_at: typeof data["created_at"] === "string" ? data["created_at"] : null,
    }, { onConflict: "connection_id,external_reference" }).select("id").single();
    if (error) throw error;
    await admin.from("noon_order_items").delete().eq("order_id", order.id);
    const skus = items.map((item) => String(item["partner_sku"] ?? item["sku"] ?? "")).filter(Boolean);
    const { data: products } = skus.length ? await admin.from("products").select("id,sku,name").in("sku", skus) : { data: [] };
    const bySku = new Map((products ?? []).map((product) => [product.sku, product]));
    if (items.length) await admin.from("noon_order_items").insert(items.map((item) => {
      const sku = String(item["partner_sku"] ?? item["sku"] ?? "");
      const product = bySku.get(sku);
      return { user_id: connection.user_id, order_id: order.id, product_id: product?.id ?? null, partner_sku: sku, name: String(item["name"] ?? product?.name ?? sku), quantity: Math.max(1, Number(item["quantity"] ?? item["qty"] ?? 1)), unit_price: Number(item["price"] ?? item["unit_price"] ?? 0), status: String(item["status"] ?? ""), raw_payload: item as Json };
    }));
    await admin.from("noon_connections").update({ last_order_sync_at: new Date().toISOString(), last_error: null }).eq("id", connection.id);
    await admin.rpc("create_notification", { _user_id: connection.user_id, _title: "New Noon order", _body: `Order ${orderReference} is ready to review.`, _type: "order", _link: `/dropshipping/integrations/noon/${connection.id}?tab=orders`, _metadata: { order_id: order.id } });
    await logNoon(admin, connection, "order_import", "ok", { orderReference, itemCount: items.length, requestId }, "", startedAt);
    return { orderId: order.id };
  } catch (error) {
    await logNoon(admin, connection, "order_import", "error", { orderReference }, safeMessage(error), startedAt);
    throw error;
  }
}

export async function processNoonJobs(admin: AdminClient, limit = 20) {
  const now = new Date().toISOString();
  const { data: jobs } = await admin.from("noon_sync_jobs").select("*").eq("status", "queued").lte("run_after", now).order("created_at").limit(limit);
  const results = [];
  for (const job of jobs ?? []) {
    const { data: claimed } = await admin.from("noon_sync_jobs").update({ status: "running", locked_at: now, attempts: job.attempts + 1 }).eq("id", job.id).eq("status", "queued").select("*").maybeSingle();
    if (!claimed?.connection_id) continue;
    const { data: connection } = await admin.from("noon_connections").select("*").eq("id", claimed.connection_id).eq("status", "healthy").maybeSingle();
    if (!connection) continue;
    try {
      if (claimed.job_type === "fetch_order") await fetchAndSaveOrder(admin, connection, String((claimed.payload as Record<string, unknown>)["order_reference"] ?? claimed.entity_id));
      if (claimed.job_type === "publish_products") await publishNoonProducts(admin, connection, [claimed.entity_id]);
      if (claimed.job_type === "map_barcode") await mapBarcodeJob(admin, connection, claimed.entity_id, (claimed.payload ?? {}) as Record<string, unknown>);
      await admin.from("noon_sync_jobs").update({ status: "completed", completed_at: new Date().toISOString(), last_error: null }).eq("id", claimed.id);
      results.push({ id: claimed.id, ok: true });
    } catch (error) {
      const dead = claimed.attempts >= claimed.max_attempts;
      const delay = Math.min(3600, 2 ** claimed.attempts * 30);
      await admin.from("noon_sync_jobs").update({ status: dead ? "dead" : "queued", run_after: new Date(Date.now() + delay * 1000).toISOString(), last_error: safeMessage(error) }).eq("id", claimed.id);
      results.push({ id: claimed.id, ok: false });
    }
  }
  return results;
}
