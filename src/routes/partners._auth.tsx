import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SUPPLIER_TIER_ROLES } from "@/lib/access-tiers";

export const Route = createFileRoute("/partners/_auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/partners/signin" });
    const { data: roles, error: roleError } = await supabase
      .from("wl_user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    // Only the supplier tier may open this portal — shop, selling and agency
    // accounts all stop here.
    const allowed = (roles ?? []).some((row) => (SUPPLIER_TIER_ROLES as readonly string[]).includes(row.role));

    // Signed in, but this is a shopper / dropshipping account: send them to the
    // wholesale application instead of bouncing back to sign-in forever.
    if (roleError || !allowed) throw redirect({ to: "/partners/join" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
