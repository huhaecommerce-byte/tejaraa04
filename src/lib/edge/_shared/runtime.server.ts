// Shared runtime helpers for the ported backend functions.
// These used to run as Deno edge functions; they now run inside TanStack
// server routes on the app's own server runtime.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-application-name",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

export const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

export function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...jsonHeaders, ...extraHeaders },
  });
}

export function env(name: string): string | undefined {
  return process.env[name];
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function supabaseUrl(): string {
  return requireEnv("SUPABASE_URL");
}

/** Service-role client. Bypasses row level security — server use only. */
export function adminClient(): SupabaseClient {
  return createClient(supabaseUrl(), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Client scoped to the caller's session, so row level security applies. */
export function userClient(request: Request): SupabaseClient {
  const authorization = request.headers.get("Authorization") ?? "";
  const key = requireEnv("SUPABASE_PUBLISHABLE_KEY");
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: authorization ? { Authorization: authorization } : {},
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        if (authorization) headers.set("Authorization", authorization);
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/** Returns the signed-in user for the request, or null. */
export async function getRequestUser(request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization) return null;
  const token = authorization.replace(/^Bearer\s+/i, "");
  const { data, error } = await adminClient().auth.getUser(token);
  if (error) return null;
  return data.user ?? null;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await adminClient().rpc("has_role", { _user_id: userId, _role: "admin" });
  return data === true;
}
