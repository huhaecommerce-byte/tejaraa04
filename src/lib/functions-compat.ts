// The backend functions from the original project now run as routes inside
// this app (/api/fn/* and /api/public/*). This shim keeps every existing
// `supabase.functions.invoke("name", ...)` call site working unchanged.

import { supabase } from "@/integrations/supabase/client";

const PUBLIC_FUNCTIONS = new Set([
  "payments-webhook",
  "sunsky-callback",
  "wahooks-ticket-webhook",
  "handle-email-suppression",
  "handle-email-unsubscribe",
  "sitemap",
  "auth-email-hook",
  "webhook-ping",
  "process-email-queue",
  "process-scheduled-templates",
  "reconcile-stale-payments",
]);

export function functionUrl(name: string): string {
  return PUBLIC_FUNCTIONS.has(name) ? `/api/public/${name}` : `/api/fn/${name}`;
}

type InvokeOptions = {
  body?: unknown;
  headers?: Record<string, string>;
  method?: string;
};

let installed = false;

export function installFunctionsCompat() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const invoke = async (name: string, options: InvokeOptions = {}) => {

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(functionUrl(name), {
        method: options.method ?? "POST",
        headers,
        body: options.body === undefined ? "{}" : JSON.stringify(options.body),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const message =
          (payload && typeof payload === "object" && "error" in payload
            ? String((payload as { error: unknown }).error)
            : typeof payload === "string" && payload
              ? payload
              : `Request failed with status ${response.status}`);
        return {
          data: null,
          error: Object.assign(new Error(message), { status: response.status, context: payload }),
        };
      }

      return { data: payload, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  // The exported `supabase` client is a Proxy with only a `get` trap, and
  // `client.functions` may hand back a fresh FunctionsClient, so neither the
  // client nor a single instance can be patched. Patch the shared prototype.
  const instance = supabase.functions as unknown as object;
  const proto = Object.getPrototypeOf(instance) as { invoke: typeof invoke } | null;
  if (proto && "invoke" in proto) {
    proto.invoke = invoke;
  } else {
    (instance as { invoke: typeof invoke }).invoke = invoke;
  }
}


