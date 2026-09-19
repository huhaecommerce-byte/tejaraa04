import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { canOpenPath, hasConsoleAccess, type AppRole } from "@/lib/partners/permissions";

export const Route = createFileRoute("/partners/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/partners/signin" });

    const { data: roleRows } = await supabase.from("wl_user_roles").select("role").eq("user_id", data.user.id);
    const roles = ((roleRows ?? []) as { role: AppRole }[]).map((row) => row.role);

    if (!hasConsoleAccess(roles)) throw redirect({ to: "/partners/dashboard" });
    if (!canOpenPath(roles, location.pathname)) throw redirect({ to: "/partners/admin" });
    return { user: data.user, roles };
  },
  component: () => <Outlet />,
});
