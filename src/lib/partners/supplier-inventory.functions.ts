import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: { rpc: Function }; userId: string }) {
  const { data, error } = await context.supabase.rpc("wl_has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw error;
  if (!data) throw new Error("Forbidden");
}

export const listSupplierIntegrations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: rows }, { data: profiles }, { data: roles }, { data: batches }] = await Promise.all([
      supabaseAdmin.from("wl_integrations").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("wl_partner_profiles").select("id, first_name, last_name, email"),
      supabaseAdmin.from("wl_user_roles").select("user_id").eq("role", "supplier"),
      supabaseAdmin.from("wl_inventory_batches").select("integration_id, accepted, rejected"),
    ]);

    const profileName = new Map(
      (profiles ?? []).map((p) => [p.id, [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email]),
    );
    const stats = new Map<string, { batches: number; applied: number }>();
    for (const batch of batches ?? []) {
      const entry = stats.get(batch.integration_id) ?? { batches: 0, applied: 0 };
      entry.batches += 1;
      entry.applied += batch.accepted;
      stats.set(batch.integration_id, entry);
    }

    const integrations = (rows ?? []).map((row) => ({
      id: row.id,
      supplier_id: row.supplier_id,
      supplier: profileName.get(row.supplier_id) ?? "Unknown wholesaler",
      name: row.name,
      notes: row.notes,
      key_prefix: row.key_prefix,
      pull_url: row.pull_url,
      has_pull_secret: Boolean(row.pull_secret),
      enabled: row.enabled,
      last_sync_at: row.last_sync_at,
      last_status: row.last_status,
      last_error: row.last_error,
      created_at: row.created_at,
      batches: stats.get(row.id)?.batches ?? 0,
      applied: stats.get(row.id)?.applied ?? 0,
    }));

    const supplierIds = new Set((roles ?? []).map((r) => r.user_id));
    const suppliers = (profiles ?? [])
      .filter((p) => supplierIds.has(p.id))
      .map((p) => ({ id: p.id, name: profileName.get(p.id) ?? p.email, email: p.email }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { integrations, suppliers };
  });

export const listInventoryActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: batches }, { data: log }, { data: integrations }] = await Promise.all([
      supabaseAdmin.from("wl_inventory_batches").select("*").order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("wl_inventory_log").select("*").order("created_at", { ascending: false }).limit(100),
      supabaseAdmin.from("wl_integrations").select("id, name"),
    ]);
    const name = new Map((integrations ?? []).map((row) => [row.id, row.name]));
    return {
      batches: (batches ?? []).map((row) => ({
        id: row.id,
        integration: name.get(row.integration_id) ?? "Removed integration",
        request_id: row.request_id,
        source: row.source,
        status: row.status,
        accepted: row.accepted,
        rejected: row.rejected,
        created_at: row.created_at,
      })),
      log: (log ?? []).map((row) => ({
        id: row.id,
        integration: row.integration_id ? name.get(row.integration_id) ?? "Removed integration" : "—",
        sku: row.sku,
        status: row.status,
        message: row.message,
        detail: row.detail,
        created_at: row.created_at,
      })),
    };
  });

export const createSupplierIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { supplierId: string; name: string; notes?: string; pullUrl?: string; pullSecret?: string }) => {
    if (!input?.supplierId) throw new Error("Choose a wholesaler");
    if (!input?.name?.trim()) throw new Error("An integration name is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { generateIntegrationKey } = await import("@/lib/partners/supplier-inventory.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { key, hash, prefix } = generateIntegrationKey();
    const { data: row, error } = await supabaseAdmin
      .from("wl_integrations")
      .insert({
        supplier_id: data.supplierId,
        name: data.name.trim(),
        notes: data.notes ?? "",
        key_hash: hash,
        key_prefix: prefix,
        pull_url: data.pullUrl ?? "",
        pull_secret: data.pullSecret ?? "",
      })
      .select("id, name")
      .single();
    if (error) throw error;
    return { id: row.id, name: row.name, apiKey: key };
  });

export const updateSupplierIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    id: string;
    name?: string;
    notes?: string;
    pullUrl?: string;
    pullSecret?: string;
    enabled?: boolean;
  }) => {
    if (!input?.id) throw new Error("An integration id is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.pullUrl !== undefined ? { pull_url: data.pullUrl } : {}),
      ...(data.pullSecret !== undefined ? { pull_secret: data.pullSecret } : {}),
      ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
    };
    const { error } = await supabaseAdmin.from("wl_integrations").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const rotateSupplierIntegrationKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("An integration id is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { generateIntegrationKey } = await import("@/lib/partners/supplier-inventory.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { key, hash, prefix } = generateIntegrationKey();
    const { error } = await supabaseAdmin
      .from("wl_integrations")
      .update({ key_hash: hash, key_prefix: prefix })
      .eq("id", data.id);
    if (error) throw error;
    return { apiKey: key };
  });

export const deleteSupplierIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("An integration id is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("wl_integrations").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const pullSupplierInventoryNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const sync = await import("@/lib/partners/supplier-inventory.server");
    if (data.id) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row } = await supabaseAdmin.from("wl_integrations").select("*").eq("id", data.id).maybeSingle();
      if (!row) throw new Error("Integration not found");
      return { results: [{ integration: row.name, ...(await sync.pullFromIntegration(row as never)) }] };
    }
    return { results: await sync.pullFromAllIntegrations() };
  });
