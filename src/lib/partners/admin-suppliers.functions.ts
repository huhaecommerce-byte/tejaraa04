import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteSupplierAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { supplierId: string }) => {
    if (!input?.supplierId || typeof input.supplierId !== "string") {
      throw new Error("A wholesaler id is required");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("wl_has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw roleError;
    if (!isAdmin) throw new Error("Forbidden");
    if (data.supplierId === context.userId) throw new Error("You cannot remove your own account");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("wl_products").delete().eq("supplier_id", data.supplierId);
    await supabaseAdmin.from("wl_payout_requests").delete().eq("supplier_id", data.supplierId);
    await supabaseAdmin.from("wl_payout_detail_history").delete().eq("supplier_id", data.supplierId);
    await supabaseAdmin.from("wl_settings").delete().eq("supplier_id", data.supplierId);
    await supabaseAdmin.from("wl_orders").delete().eq("supplier_id", data.supplierId);
    await supabaseAdmin.from("wl_applications").delete().eq("user_id", data.supplierId);
    await supabaseAdmin.from("wl_partner_profiles").delete().eq("id", data.supplierId);

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(data.supplierId);
    if (authError) throw authError;

    return { ok: true };
  });
