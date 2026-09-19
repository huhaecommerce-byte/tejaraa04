import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/partners/permissions";

export type AuthState = {
  session: Session | null;
  roles: AppRole[];
  isAdmin: boolean;
  loading: boolean;
};

async function readRoles(userId: string): Promise<AppRole[]> {
  const { data } = await supabase.from("wl_user_roles").select("role").eq("user_id", userId);
  return ((data ?? []) as { role: AppRole }[]).map((row) => row.role);
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const apply = async (next: Session | null) => {
      if (!active) return;
      setSession(next);
      setRoles(next?.user ? await readRoles(next.user.id) : []);
      if (active) setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "TOKEN_REFRESHED") return;
      void apply(next);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { session, roles, isAdmin: roles.includes("admin"), loading };
}

export async function isAdminUser(userId: string) {
  const { data } = await supabase.rpc("wl_has_role", { _user_id: userId, _role: "admin" });
  return Boolean(data);
}

export async function readUserRoles(userId: string) {
  return readRoles(userId);
}
