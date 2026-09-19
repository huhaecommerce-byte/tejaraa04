import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminConnection = {
  id: string;
  name: string;
  slug: string;
  notes: string;
  key_prefix: string;
  has_key: boolean;
  push_url: string;
  has_push_secret: boolean;
  orders_pull_url: string;
  has_pull_secret: boolean;
  enabled: boolean;
  last_push_at: string | null;
  last_order_at: string | null;
  created_at: string;
  order_count: number;
};

async function assertAdmin(context: { supabase: { rpc: Function }; userId: string }) {
  const { data, error } = await context.supabase.rpc("wl_has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw error;
  if (!data) throw new Error("Forbidden");
}

export const listChannelConnections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: rows }, { data: orders }] = await Promise.all([
      supabaseAdmin.from("wl_channel_connections").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("wl_orders").select("connection_id"),
    ]);
    const counts = new Map<string, number>();
    for (const row of orders ?? []) {
      if (row.connection_id) counts.set(row.connection_id, (counts.get(row.connection_id) ?? 0) + 1);
    }
    const connections: AdminConnection[] = (rows ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      notes: row.notes,
      key_prefix: row.key_prefix,
      has_key: Boolean(row.key_hash),
      push_url: row.push_url,
      has_push_secret: Boolean(row.push_secret),
      orders_pull_url: row.orders_pull_url,
      has_pull_secret: Boolean(row.orders_pull_secret),
      enabled: row.enabled,
      last_push_at: row.last_push_at,
      last_order_at: row.last_order_at,
      created_at: row.created_at,
      order_count: counts.get(row.id) ?? 0,
    }));

    const { data: log } = await supabaseAdmin
      .from("wl_channel_sync_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    return { connections, log: log ?? [] };
  });

export const listSharedProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { listFeedProducts } = await import("@/lib/partners/channel-sync.server");
    const products = await listFeedProducts();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: suppliers }, { count: pendingCount }] = await Promise.all([
      supabaseAdmin.from("wl_products").select("supplier_id, status, is_active"),
      supabaseAdmin.from("wl_products").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    const shared = new Set((suppliers ?? []).filter((r) => r.status === "active" && r.is_active).map((r) => r.supplier_id));
    return {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        brand: p.brand,
        category: p.category,
        currency: p.currency,
        wholesale_price: Number(p.wholesale_price),
        moq: p.moq,
        stock: p.stock,
        warehouse: p.warehouse,
        updated_at: p.updated_at,
      })),
      totalProducts: (suppliers ?? []).length,
      pending: pendingCount ?? 0,
      wholesalers: shared.size,
    };
  });

export const listChannelOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: orders }, { data: items }, { data: connections }, { data: profiles }] = await Promise.all([
      supabaseAdmin
        .from("wl_orders")
        .select("*")
        .not("connection_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin.from("wl_order_items").select("*"),
      supabaseAdmin.from("wl_channel_connections").select("id, name"),
      supabaseAdmin.from("wl_partner_profiles").select("id, first_name, last_name, email"),
    ]);
    const connectionName = new Map((connections ?? []).map((c) => [c.id, c.name]));
    const supplierName = new Map(
      (profiles ?? []).map((p) => [p.id, [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email]),
    );
    const lines = new Map<string, { sku: string; name: string; quantity: number; line_total: number }[]>();
    for (const item of items ?? []) {
      const list = lines.get(item.order_id) ?? [];
      list.push({ sku: item.sku, name: item.name, quantity: item.quantity, line_total: Number(item.line_total) });
      lines.set(item.order_id, list);
    }
    return {
      orders: (orders ?? []).map((order) => ({
        id: order.id,
        reference: order.reference,
        external_reference: order.external_reference ?? "",
        external_status: order.external_status ?? "",
        status: order.status,
        currency: order.currency,
        order_value: Number(order.order_value),
        quantity: order.quantity,
        buyer_country: order.buyer_country,
        created_at: order.created_at,
        connection: order.connection_id ? connectionName.get(order.connection_id) ?? "Removed project" : "—",
        supplier: supplierName.get(order.supplier_id) ?? "Unknown wholesaler",
        items: lines.get(order.id) ?? [],
      })),
    };
  });

export const createChannelConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; notes?: string; pushUrl?: string; pushSecret?: string; pullUrl?: string; pullSecret?: string }) => {
    if (!input?.name?.trim()) throw new Error("A project name is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { generateKey, slugify } = await import("@/lib/partners/channel-sync.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { key, hash, prefix } = generateKey();
    const { data: row, error } = await supabaseAdmin
      .from("wl_channel_connections")
      .insert({
        name: data.name.trim(),
        slug: `${slugify(data.name)}-${prefix.slice(4, 8)}`,
        notes: data.notes ?? "",
        key_hash: hash,
        key_prefix: prefix,
        push_url: data.pushUrl ?? "",
        push_secret: data.pushSecret ?? "",
        orders_pull_url: data.pullUrl ?? "",
        orders_pull_secret: data.pullSecret ?? "",
      })
      .select("id, name")
      .single();
    if (error) throw error;
    return { id: row.id, name: row.name, apiKey: key };
  });

export const updateChannelConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    id: string;
    name?: string;
    notes?: string;
    pushUrl?: string;
    pushSecret?: string;
    pullUrl?: string;
    pullSecret?: string;
    enabled?: boolean;
  }) => {
    if (!input?.id) throw new Error("A connection id is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.pushUrl !== undefined ? { push_url: data.pushUrl } : {}),
      ...(data.pushSecret !== undefined ? { push_secret: data.pushSecret } : {}),
      ...(data.pullUrl !== undefined ? { orders_pull_url: data.pullUrl } : {}),
      ...(data.pullSecret !== undefined ? { orders_pull_secret: data.pullSecret } : {}),
      ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
    };
    const { error } = await supabaseAdmin.from("wl_channel_connections").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const rotateChannelKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("A connection id is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { generateKey } = await import("@/lib/partners/channel-sync.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { key, hash, prefix } = generateKey();
    const { error } = await supabaseAdmin
      .from("wl_channel_connections")
      .update({ key_hash: hash, key_prefix: prefix })
      .eq("id", data.id);
    if (error) throw error;
    return { apiKey: key };
  });

export const deleteChannelConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("A connection id is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("wl_channel_connections").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const pushProductsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const sync = await import("@/lib/partners/channel-sync.server");
    if (data.id) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row } = await supabaseAdmin.from("wl_channel_connections").select("*").eq("id", data.id).maybeSingle();
      if (!row) throw new Error("Connection not found");
      return { results: [{ connection: row.name, ...(await sync.pushProductsTo(row as never)) }] };
    }
    return { results: await sync.pushProductsToAll() };
  });

export const pullOrdersNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const sync = await import("@/lib/partners/channel-sync.server");
    if (data.id) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row } = await supabaseAdmin.from("wl_channel_connections").select("*").eq("id", data.id).maybeSingle();
      if (!row) throw new Error("Connection not found");
      return { results: [{ connection: row.name, ...(await sync.pullOrdersFrom(row as never)) }] };
    }
    return { results: await sync.pullOrdersFromAll() };
  });
