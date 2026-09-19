import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AppRole } from "@/lib/partners/permissions";

const ROLES: AppRole[] = ["admin", "staff", "finance", "viewer", "supplier"];

type Ctx = { supabase: any; userId: string };

async function assertAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("wl_has_role", { _user_id: context.userId, _role: "admin" });
  if (error) throw error;
  if (!data) throw new Error("Forbidden");
}

function cleanRoles(input: unknown): AppRole[] {
  const list = Array.isArray(input) ? input : [];
  const roles = [...new Set(list.filter((role): role is AppRole => ROLES.includes(role as AppRole)))];
  if (!roles.length) throw new Error("Pick at least one role");
  return roles;
}

function cleanUsername(value: unknown) {
  const username = String(value ?? "").trim();
  if (!username) return "";
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
    throw new Error("Username must be 3-32 characters: letters, numbers, dot, dash or underscore");
  }
  return username;
}

export type PlatformUser = {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  roles: AppRole[];
  suspended: boolean;
  created_at: string;
};

export const listPlatformUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PlatformUser[]> => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profiles }, { data: roleRows }] = await Promise.all([
      supabaseAdmin
        .from("wl_partner_profiles")
        .select("id, first_name, last_name, email, username, suspended_at, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("wl_user_roles").select("user_id, role"),
    ]);

    const roleMap = new Map<string, AppRole[]>();
    (roleRows ?? []).forEach((row: { user_id: string; role: AppRole }) => {
      roleMap.set(row.user_id, [...(roleMap.get(row.user_id) ?? []), row.role]);
    });

    return (profiles ?? []).map((profile: any) => ({
      id: profile.id,
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      username: profile.username ?? "",
      email: profile.email ?? "",
      roles: roleMap.get(profile.id) ?? [],
      suspended: Boolean(profile.suspended_at),
      created_at: profile.created_at,
    }));
  });

export const createPlatformUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    roles: AppRole[];
  }) => {
    const email = String(input?.email ?? "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email address");
    const password = String(input?.password ?? "");
    if (password.length < 8) throw new Error("Password must be at least 8 characters");
    return {
      email,
      password,
      firstName: String(input?.firstName ?? "").trim(),
      lastName: String(input?.lastName ?? "").trim(),
      username: cleanUsername(input?.username),
      roles: cleanRoles(input?.roles),
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.username) {
      const { data: taken } = await supabaseAdmin
        .from("wl_partner_profiles")
        .select("id")
        .ilike("username", data.username)
        .maybeSingle();
      if (taken) throw new Error("That username is already taken");
    }

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { first_name: data.firstName, last_name: data.lastName },
    });
    if (error) throw error;
    const userId = created.user?.id;
    if (!userId) throw new Error("The account could not be created");

    await supabaseAdmin.from("wl_partner_profiles").upsert({
      id: userId,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      username: data.username,
    });

    await supabaseAdmin.from("wl_user_roles").delete().eq("user_id", userId);
    await supabaseAdmin
      .from("wl_user_roles")
      .insert(data.roles.map((role) => ({ user_id: userId, role })));

    return { id: userId };
  });

export const updateUserRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; roles: AppRole[] }) => {
    if (!input?.userId) throw new Error("A user is required");
    return { userId: input.userId, roles: cleanRoles(input.roles) };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    if (data.userId === context.userId && !data.roles.includes("admin")) {
      throw new Error("You cannot remove your own admin role");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!data.roles.includes("admin")) {
      const { count } = await supabaseAdmin
        .from("wl_user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "admin");
      const { data: wasAdmin } = await supabaseAdmin
        .from("wl_user_roles")
        .select("id")
        .eq("user_id", data.userId)
        .eq("role", "admin")
        .maybeSingle();
      if (wasAdmin && (count ?? 0) <= 1) throw new Error("There must always be at least one admin");
    }

    await supabaseAdmin.from("wl_user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin
      .from("wl_user_roles")
      .insert(data.roles.map((role) => ({ user_id: data.userId, role })));
    if (error) throw error;
    return { ok: true };
  });

export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; firstName?: string; lastName?: string; username?: string }) => {
    if (!input?.userId) throw new Error("A user is required");
    return {
      userId: input.userId,
      firstName: String(input?.firstName ?? "").trim(),
      lastName: String(input?.lastName ?? "").trim(),
      username: cleanUsername(input?.username),
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.username) {
      const { data: taken } = await supabaseAdmin
        .from("wl_partner_profiles")
        .select("id")
        .ilike("username", data.username)
        .maybeSingle();
      if (taken && taken.id !== data.userId) throw new Error("That username is already taken");
    }
    const { error } = await supabaseAdmin
      .from("wl_partner_profiles")
      .update({ first_name: data.firstName, last_name: data.lastName, username: data.username })
      .eq("id", data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const setUserSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; suspended: boolean }) => {
    if (!input?.userId) throw new Error("A user is required");
    return { userId: input.userId, suspended: Boolean(input.suspended) };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    if (data.userId === context.userId) throw new Error("You cannot suspend your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.suspended ? "876000h" : "none",
    });
    if (error) throw error;
    await supabaseAdmin
      .from("wl_partner_profiles")
      .update({ suspended_at: data.suspended ? new Date().toISOString() : null })
      .eq("id", data.userId);
    return { ok: true };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; password: string }) => {
    if (!input?.userId) throw new Error("A user is required");
    const password = String(input?.password ?? "");
    if (password.length < 8) throw new Error("Password must be at least 8 characters");
    return { userId: input.userId, password };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.password });
    if (error) throw error;
    return { ok: true };
  });

export const deletePlatformUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (!input?.userId) throw new Error("A user is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    if (data.userId === context.userId) throw new Error("You cannot remove your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: isAdminRow } = await supabaseAdmin
      .from("wl_user_roles")
      .select("id")
      .eq("user_id", data.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (isAdminRow) {
      const { count } = await supabaseAdmin
        .from("wl_user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) throw new Error("There must always be at least one admin");
    }

    await supabaseAdmin.from("wl_products").delete().eq("supplier_id", data.userId);
    await supabaseAdmin.from("wl_payout_requests").delete().eq("supplier_id", data.userId);
    await supabaseAdmin.from("wl_payout_detail_history").delete().eq("supplier_id", data.userId);
    await supabaseAdmin.from("wl_settings").delete().eq("supplier_id", data.userId);
    await supabaseAdmin.from("wl_orders").delete().eq("supplier_id", data.userId);
    await supabaseAdmin.from("wl_applications").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("wl_partner_profiles").delete().eq("id", data.userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    // The sign-in record may already be gone; the app rows above are removed either way.
    if (error && error.status !== 404 && !/user not found/i.test(error.message)) throw error;
    return { ok: true };
  });
