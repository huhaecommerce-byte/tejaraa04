/**
 * Server-only helpers for partner "channel" connections:
 * key hashing, product feed shaping, outbound product push and order import.
 */
import { createHash, createHmac, randomBytes } from "node:crypto";

export type ChannelConnection = {
  id: string;
  name: string;
  slug: string;
  notes: string;
  key_hash: string;
  key_prefix: string;
  push_url: string;
  push_secret: string;
  orders_pull_url: string;
  orders_pull_secret: string;
  enabled: boolean;
  last_push_at: string | null;
  last_order_at: string | null;
  created_at: string;
  updated_at: string;
};

export function hashKey(key: string) {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

export function generateKey() {
  const key = `tjx_${randomBytes(24).toString("hex")}`;
  return { key, hash: hashKey(key), prefix: key.slice(0, 12) };
}

export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) || `project-${randomBytes(3).toString("hex")}`
  );
}

export function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+([^\s,]+)$/i.exec(header);
  return match?.[1] ?? request.headers.get("x-api-key") ?? "";
}

/** Resolves an enabled connection from a raw API key, or null. */
export async function connectionFromKey(key: string): Promise<ChannelConnection | null> {
  if (!key) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("wl_channel_connections")
    .select("*")
    .eq("key_hash", hashKey(key))
    .eq("enabled", true)
    .maybeSingle();
  return (data as ChannelConnection | null) ?? null;
}

export async function logSync(
  connectionId: string | null,
  direction: "outbound" | "inbound",
  event: string,
  status: "ok" | "error",
  detail: Record<string, unknown> = {},
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("wl_channel_sync_log").insert({
    connection_id: connectionId,
    direction,
    event,
    status,
    detail: detail as never,
  });
}

export type FeedProduct = {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  description: string;
  currency: string;
  wholesale_price: number;
  dropship_price: number;
  moq: number;
  stock: number;
  warehouse: string;
  images: unknown;
  updated_at: string;
};

const FEED_COLUMNS =
  "id, name, sku, brand, category, description, currency, wholesale_price, dropship_price, moq, stock, warehouse, images, updated_at";

export async function listFeedProducts(updatedSince?: string): Promise<FeedProduct[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let query = supabaseAdmin
    .from("wl_products")
    .select(FEED_COLUMNS)
    .eq("status", "active")
    .eq("is_active", true)
    .order("updated_at", { ascending: false });
  if (updatedSince) query = query.gt("updated_at", updatedSince);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as FeedProduct[];
}

function sign(body: string, secret: string) {
  return createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

/** Sends the current active catalogue to one connection's push URL. */
export async function pushProductsTo(connection: ChannelConnection) {
  if (!connection.push_url) return { ok: false, skipped: true, message: "No push address configured" };
  const products = await listFeedProducts();
  const body = JSON.stringify({ source: "tejarx", sent_at: new Date().toISOString(), products });
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (connection.push_secret) headers["x-tejarx-signature"] = sign(body, connection.push_secret);

  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(connection.push_url, { method: "POST", headers, body });
      const text = await response.text();
      if (response.ok) {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin
          .from("wl_channel_connections")
          .update({ last_push_at: new Date().toISOString() })
          .eq("id", connection.id);
        await logSync(connection.id, "outbound", "product_push", "ok", { count: products.length });
        return { ok: true, count: products.length };
      }
      lastError = `HTTP ${response.status}: ${text.slice(0, 500)}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  await logSync(connection.id, "outbound", "product_push", "error", { message: lastError });
  return { ok: false, message: lastError };
}

export async function pushProductsToAll() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("wl_channel_connections")
    .select("*")
    .eq("enabled", true)
    .neq("push_url", "");
  const connections = (data ?? []) as ChannelConnection[];
  const results = [];
  for (const connection of connections) {
    results.push({ connection: connection.name, ...(await pushProductsTo(connection)) });
  }
  return results;
}

export type IncomingItem = { sku: string; name?: string; quantity: number; unit_price?: number };
export type IncomingOrder = {
  reference: string;
  status?: string;
  currency?: string;
  buyer_country?: string;
  shipping?: string;
  placed_at?: string;
  items: IncomingItem[];
};

const STATUS_MAP: Record<string, string> = {
  new: "New",
  pending: "New",
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Processing",
  ready: "Ready to Ship",
  shipped: "Shipped",
  fulfilled: "Shipped",
  delivered: "Delivered",
  completed: "Delivered",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  returned: "Returned",
};

export function parseIncomingOrder(value: unknown): IncomingOrder {
  const raw = value as Record<string, unknown> | null;
  if (!raw || typeof raw !== "object") throw new Error("Order payload must be an object");
  const reference = String(raw['reference'] ?? raw['order_reference'] ?? raw['id'] ?? "").trim();
  if (!reference) throw new Error("An order reference is required");
  const rawItems = raw['items'] ?? raw['line_items'];
  if (!Array.isArray(rawItems) || rawItems.length === 0) throw new Error("At least one order item is required");
  const items: IncomingItem[] = rawItems.map((entry, index) => {
    const item = entry as Record<string, unknown>;
    const sku = String(item['sku'] ?? "").trim();
    if (!sku) throw new Error(`Item ${index + 1} is missing a SKU`);
    const quantity = Number(item['quantity'] ?? item['qty'] ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(`Item ${sku} has an invalid quantity`);
    return {
      sku,
      name: item['name'] ? String(item['name']) : "",
      quantity: Math.floor(quantity),
      unit_price: Number(item['unit_price'] ?? item['price'] ?? 0) || 0,
    };
  });
  return {
    reference,
    status: raw['status'] ? String(raw['status']) : "",
    currency: raw['currency'] ? String(raw['currency']) : "AED",
    buyer_country: raw['buyer_country'] ? String(raw['buyer_country']) : "",
    shipping: raw['shipping'] ? String(raw['shipping']) : "",
    placed_at: raw['placed_at'] ? String(raw['placed_at']) : "",
    items,
  };
}

/**
 * Imports one partner order: maps each SKU to its owning supplier and writes
 * one order row per supplier plus the matching order lines. Idempotent on
 * (connection, external reference, supplier).
 */
export async function importOrder(connection: ChannelConnection, order: IncomingOrder) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const skus = [...new Set(order.items.map((item) => item.sku))];
  const { data: productRows, error: productError } = await supabaseAdmin
    .from("wl_products")
    .select("id, sku, name, supplier_id, currency")
    .in("sku", skus);
  if (productError) throw productError;

  const bySku = new Map((productRows ?? []).map((row) => [row.sku, row]));
  const unmatched = skus.filter((sku) => !bySku.has(sku));

  const groups = new Map<string, { items: IncomingItem[]; products: typeof productRows }>();
  for (const item of order.items) {
    const product = bySku.get(item.sku);
    if (!product) continue;
    const group = groups.get(product.supplier_id) ?? { items: [], products: [] };
    group.items.push(item);
    group.products?.push(product);
    groups.set(product.supplier_id, group);
  }

  if (groups.size === 0) {
    await logSync(connection.id, "inbound", "order_import", "error", {
      reference: order.reference,
      message: "No SKUs matched a product on the platform",
      unmatched,
    });
    throw new Error(`No known SKUs in order ${order.reference}`);
  }

  const status = STATUS_MAP[(order.status ?? "").toLowerCase()] ?? "New";
  const createdOrders: string[] = [];

  for (const [supplierId, group] of groups) {
    const quantity = group.items.reduce((total, item) => total + item.quantity, 0);
    const value = group.items.reduce((total, item) => total + item.quantity * (item.unit_price ?? 0), 0);
    const summary = group.items
      .map((item) => bySku.get(item.sku)?.name || item.name || item.sku)
      .join(", ")
      .slice(0, 300);

    const { data: existing } = await supabaseAdmin
      .from("wl_orders")
      .select("id")
      .eq("connection_id", connection.id)
      .eq("external_reference", order.reference)
      .eq("supplier_id", supplierId)
      .maybeSingle();

    const payload = {
      reference: order.reference,
      supplier_id: supplierId,
      connection_id: connection.id,
      external_reference: order.reference,
      external_status: order.status ?? "",
      channel: connection.name,
      product_summary: summary,
      quantity,
      order_value: value,
      currency: order.currency || "AED",
      buyer_country: order.buyer_country ?? "",
      shipping: order.shipping ?? "",
      raw_payload: order as never,
    };

    let orderId = existing?.id ?? "";
    if (orderId) {
      const { error } = await supabaseAdmin
        .from("wl_orders")
        .update({ ...payload, status })
        .eq("id", orderId);
      if (error) throw error;
      await supabaseAdmin.from("wl_order_items").delete().eq("order_id", orderId);
    } else {
      const { data: inserted, error } = await supabaseAdmin
        .from("wl_orders")
        .insert({ ...payload, status })
        .select("id")
        .single();
      if (error) throw error;
      orderId = inserted.id;
    }

    const lines = group.items.map((item) => {
      const product = bySku.get(item.sku);
      return {
        order_id: orderId,
        product_id: product?.id ?? null,
        supplier_id: supplierId,
        sku: item.sku,
        name: product?.name || item.name || item.sku,
        quantity: item.quantity,
        unit_price: item.unit_price ?? 0,
        line_total: item.quantity * (item.unit_price ?? 0),
      };
    });
    const { error: itemError } = await supabaseAdmin.from("wl_order_items").insert(lines);
    if (itemError) throw itemError;
    createdOrders.push(orderId);
  }

  await supabaseAdmin
    .from("wl_channel_connections")
    .update({ last_order_at: new Date().toISOString() })
    .eq("id", connection.id);

  await logSync(connection.id, "inbound", "order_import", "ok", {
    reference: order.reference,
    suppliers: groups.size,
    unmatched,
  });

  return { orders: createdOrders, suppliers: groups.size, unmatched };
}

/** Fetches orders from a connection's pull URL and imports them. */
export async function pullOrdersFrom(connection: ChannelConnection) {
  if (!connection.orders_pull_url) return { ok: false, skipped: true, message: "No orders address configured" };
  try {
    const headers: Record<string, string> = { accept: "application/json" };
    if (connection.orders_pull_secret) headers["authorization"] = `Bearer ${connection.orders_pull_secret}`;
    const response = await fetch(connection.orders_pull_url, { headers });
    const text = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0, 500)}`);
    const parsed = JSON.parse(text) as unknown;
    const list = Array.isArray(parsed)
      ? parsed
      : ((parsed as Record<string, unknown>)?.['orders'] as unknown[]) ?? [];
    let imported = 0;
    const failures: string[] = [];
    for (const entry of list) {
      try {
        await importOrder(connection, parseIncomingOrder(entry));
        imported += 1;
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
      }
    }
    await logSync(connection.id, "inbound", "order_pull", failures.length ? "error" : "ok", {
      imported,
      failures: failures.slice(0, 10),
    });
    return { ok: true, imported, failures };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logSync(connection.id, "inbound", "order_pull", "error", { message });
    return { ok: false, message };
  }
}

export async function pullOrdersFromAll() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("wl_channel_connections")
    .select("*")
    .eq("enabled", true)
    .neq("orders_pull_url", "");
  const connections = (data ?? []) as ChannelConnection[];
  const results = [];
  for (const connection of connections) {
    results.push({ connection: connection.name, ...(await pullOrdersFrom(connection)) });
  }
  return results;
}
