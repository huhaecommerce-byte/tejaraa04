/**
 * Server-only helpers for wholesaler inventory integrations:
 * key hashing, payload validation, stock/price batch application,
 * and scheduled feed pulling. Every change is limited to products
 * owned by the integration's wholesaler and written to the audit log.
 */
import { createHash, randomBytes } from "node:crypto";

export type SupplierIntegration = {
  id: string;
  supplier_id: string;
  name: string;
  notes: string;
  key_hash: string;
  key_prefix: string;
  pull_url: string;
  pull_secret: string;
  enabled: boolean;
  last_sync_at: string | null;
  last_status: string;
  last_error: string;
  created_at: string;
  updated_at: string;
};

export function hashIntegrationKey(key: string) {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

export function generateIntegrationKey() {
  const key = `tjx_sup_${randomBytes(24).toString("hex")}`;
  return { key, hash: hashIntegrationKey(key), prefix: key.slice(0, 14) };
}

export function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+([^\s,]+)$/i.exec(header);
  return match?.[1] ?? request.headers.get("x-api-key") ?? "";
}

/** Resolves an enabled integration from a raw API key, or null. */
export async function integrationFromKey(key: string): Promise<SupplierIntegration | null> {
  if (!key) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("wl_integrations")
    .select("*")
    .eq("key_hash", hashIntegrationKey(key))
    .eq("enabled", true)
    .maybeSingle();
  return (data as SupplierIntegration | null) ?? null;
}

const CURRENCIES = new Set(["AED", "SAR", "KWD", "QAR", "BHD", "OMR", "USD"]);
const MAX_BATCH = 500;

export type InventoryItem = {
  sku: string;
  stock?: number;
  wholesale_price?: number;
  currency?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Each update must be an object");
  return value as Record<string, unknown>;
}

/** Validates one raw entry into an inventory update. Throws with a clear message. */
export function parseInventoryItem(value: unknown): InventoryItem {
  const raw = asRecord(value);
  const sku = String(raw["sku"] ?? "").trim();
  if (!sku) throw new Error("An update is missing a SKU");

  const item: InventoryItem = { sku };

  const stockRaw = raw["stock"] ?? raw["quantity"] ?? raw["qty"];
  if (stockRaw !== undefined && stockRaw !== null && stockRaw !== "") {
    const stock = Number(stockRaw);
    if (!Number.isFinite(stock) || stock < 0) throw new Error(`SKU ${sku} has an invalid stock quantity`);
    item.stock = Math.floor(stock);
  }

  const priceRaw = raw["wholesale_price"] ?? raw["price"] ?? raw["unit_price"];
  if (priceRaw !== undefined && priceRaw !== null && priceRaw !== "") {
    const price = Number(priceRaw);
    if (!Number.isFinite(price) || price < 0) throw new Error(`SKU ${sku} has an invalid wholesale price`);
    item.wholesale_price = Math.round(price * 100) / 100;
  }

  if (raw["currency"] !== undefined && raw["currency"] !== null && raw["currency"] !== "") {
    const currency = String(raw["currency"]).trim().toUpperCase();
    if (!CURRENCIES.has(currency)) throw new Error(`SKU ${sku} has an unsupported currency "${currency}"`);
    item.currency = currency;
  }

  if (item.stock === undefined && item.wholesale_price === undefined) {
    throw new Error(`SKU ${sku} needs at least a stock quantity or a wholesale price`);
  }
  return item;
}

/** Accepts an array, or an object with items/updates/products, or a single update object. */
export function parseInventoryPayload(body: unknown): { requestId: string; entries: unknown[] } {
  let requestId = "";
  let entries: unknown[];

  if (Array.isArray(body)) {
    entries = body;
  } else {
    const raw = asRecord(body);
    requestId = String(raw["request_id"] ?? raw["sync_id"] ?? "").trim().slice(0, 120);
    const list = raw["items"] ?? raw["updates"] ?? raw["products"];
    entries = Array.isArray(list) ? list : [body];
  }

  if (entries.length === 0) throw new Error("At least one update is required");
  if (entries.length > MAX_BATCH) throw new Error(`A batch can contain at most ${MAX_BATCH} updates`);
  return { requestId, entries };
}

export type BatchResult = {
  batch_id: string;
  duplicate: boolean;
  accepted: string[];
  rejected: { sku: string; error: string }[];
};

/**
 * Applies one batch of stock/price updates for the integration's wholesaler.
 * Idempotent per (integration, request_id) when a request id is supplied.
 */
export async function applyInventoryBatch(
  integration: SupplierIntegration,
  entries: unknown[],
  requestId: string,
  source: "push" | "pull",
): Promise<BatchResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (requestId) {
    const { data: existing } = await supabaseAdmin
      .from("wl_inventory_batches")
      .select("id, accepted, rejected")
      .eq("integration_id", integration.id)
      .eq("request_id", requestId)
      .maybeSingle();
    if (existing) {
      return { batch_id: existing.id, duplicate: true, accepted: [], rejected: [] };
    }
  }

  const { data: batch, error: batchError } = await supabaseAdmin
    .from("wl_inventory_batches")
    .insert({ integration_id: integration.id, request_id: requestId, source, status: "processing" })
    .select("id")
    .single();
  if (batchError) {
    if (batchError.code === "23505" && requestId) {
      return { batch_id: "", duplicate: true, accepted: [], rejected: [] };
    }
    throw batchError;
  }

  const accepted: string[] = [];
  const rejected: { sku: string; error: string }[] = [];
  const logRows: Record<string, unknown>[] = [];
  let firstError = "";

  for (const entry of entries) {
    let sku = "";
    try {
      const item = parseInventoryItem(entry);
      sku = item.sku;
      const { data: product } = await supabaseAdmin
        .from("wl_products")
        .select("id, sku, stock, wholesale_price, currency")
        .eq("supplier_id", integration.supplier_id)
        .eq("sku", item.sku)
        .maybeSingle();

      if (!product) throw new Error(`No product with SKU ${item.sku} belongs to this wholesaler`);

      const patch: Record<string, unknown> = {};
      if (item.stock !== undefined) patch["stock"] = item.stock;
      if (item.wholesale_price !== undefined) patch["wholesale_price"] = item.wholesale_price;
      if (item.currency) patch["currency"] = item.currency;

      const { error: updateError } = await supabaseAdmin.from("wl_products").update(patch as never).eq("id", product.id);
      if (updateError) throw updateError;

      accepted.push(item.sku);
      logRows.push({
        integration_id: integration.id,
        batch_id: batch.id,
        sku: item.sku,
        status: "ok",
        message: "Updated",
        detail: {
          before: { stock: product.stock, wholesale_price: Number(product.wholesale_price), currency: product.currency },
          after: {
            stock: item.stock ?? product.stock,
            wholesale_price: item.wholesale_price ?? Number(product.wholesale_price),
            currency: item.currency ?? product.currency,
          },
          source,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!firstError) firstError = message;
      rejected.push({ sku: sku || "(missing)", error: message });
      logRows.push({
        integration_id: integration.id,
        batch_id: batch.id,
        sku,
        status: "error",
        message,
        detail: { source },
      });
    }
  }

  if (logRows.length > 0) {
    await supabaseAdmin.from("wl_inventory_log").insert(logRows as never);
  }

  const status = rejected.length === 0 ? "ok" : accepted.length === 0 ? "error" : "partial";
  await supabaseAdmin
    .from("wl_inventory_batches")
    .update({ status, accepted: accepted.length, rejected: rejected.length })
    .eq("id", batch.id);

  await supabaseAdmin
    .from("wl_integrations")
    .update({
      last_sync_at: new Date().toISOString(),
      last_status: status,
      last_error: status === "ok" ? "" : firstError,
    })
    .eq("id", integration.id);

  return { batch_id: batch.id, duplicate: false, accepted, rejected };
}

/** Fetches one integration's feed URL and applies the updates it returns. */
export async function pullFromIntegration(integration: SupplierIntegration) {
  if (!integration.pull_url) return { ok: false, skipped: true, message: "No feed address configured" };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  try {
    const headers: Record<string, string> = { accept: "application/json" };
    if (integration.pull_secret) headers["authorization"] = `Bearer ${integration.pull_secret}`;
    const response = await fetch(integration.pull_url, { headers });
    const text = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);
    const body = text ? JSON.parse(text) : {};
    const { requestId, entries } = parseInventoryPayload(body);
    const result = await applyInventoryBatch(integration, entries, requestId, "pull");
    return {
      ok: result.rejected.length === 0,
      accepted: result.accepted.length,
      rejected: result.rejected.length,
      duplicate: result.duplicate,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await supabaseAdmin
      .from("wl_integrations")
      .update({ last_sync_at: new Date().toISOString(), last_status: "error", last_error: message.slice(0, 500) })
      .eq("id", integration.id);
    await supabaseAdmin.from("wl_inventory_log").insert({
      integration_id: integration.id,
      status: "error",
      message: message.slice(0, 500),
      detail: { source: "pull" },
    } as never);
    return { ok: false, message };
  }
}

export async function pullFromAllIntegrations() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("wl_integrations")
    .select("*")
    .eq("enabled", true)
    .neq("pull_url", "");
  const integrations = (data ?? []) as SupplierIntegration[];
  const results = [];
  for (const integration of integrations) {
    results.push({ integration: integration.name, ...(await pullFromIntegration(integration)) });
  }
  return results;
}
