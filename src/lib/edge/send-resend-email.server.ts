// Generic Resend sender for branded marketing-style emails.
// Calls Resend through the Lovable connector gateway.
//
// Body: { to, templateName, data?, subject?, from? }
//   - to: string | string[]
//   - templateName: one of the keys in TEMPLATES (welcome, announcement, order-update, promo, newsletter, generic)
//   - data: template-specific props (object)
//   - subject: optional override
//   - from: optional override (defaults to "Tejaraa <noreply@notify.tejaraa.com>")

import { createClient } from "@supabase/supabase-js";
import { TEMPLATES } from "@/lib/edge/_shared/resend-templates/registry";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const DEFAULT_FROM = "Tejaraa <noreply@notify.tejaraa.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // Auth: must be a logged-in user (verify_jwt = true also enforces this at the gateway).
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing Authorization header" }, 401);
  }
  try {
    const supabase = createClient(
      process.env['SUPABASE_URL']!,
      (process.env['SUPABASE_ANON_KEY'] ?? process.env['SUPABASE_PUBLISHABLE_KEY'])!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
  } catch (e) {
    return jsonResponse({ error: "Auth check failed" }, 401);
  }

  // Parse + validate body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { to, templateName, data, subject: subjectOverride, from } = body ?? {};

  if (!to || (typeof to !== "string" && !Array.isArray(to))) {
    return jsonResponse({ error: "`to` is required (string or string[])" }, 400);
  }
  if (!templateName || typeof templateName !== "string") {
    return jsonResponse({ error: "`templateName` is required" }, 400);
  }
  const tpl = TEMPLATES[templateName];
  if (!tpl) {
    return jsonResponse(
      { error: `Unknown templateName "${templateName}"`, available: Object.keys(TEMPLATES) },
      400,
    );
  }

  // Render
  let renderedSubject: string;
  let renderedHtml: string;
  try {
    const tplData = data ?? {};
    renderedSubject = (typeof subjectOverride === "string" && subjectOverride.trim())
      ? subjectOverride.trim()
      : tpl.subject(tplData);
    renderedHtml = tpl.html(tplData);
  } catch (e) {
    console.error("Template render error:", e);
    return jsonResponse({ error: "Template render failed", detail: String(e) }, 500);
  }

  // Secrets
  const LOVABLE_API_KEY = process.env['LOVABLE_API_KEY'];
  const RESEND_API_KEY = process.env['RESEND_API_KEY'];
  if (!LOVABLE_API_KEY) {
    return jsonResponse({ error: "LOVABLE_API_KEY is not configured" }, 500);
  }
  if (!RESEND_API_KEY) {
    return jsonResponse({ error: "RESEND_API_KEY is not configured" }, 500);
  }

  // Send via Resend gateway
  const recipients = Array.isArray(to) ? to : [to];
  const payload = {
    from: from || DEFAULT_FROM,
    to: recipients,
    subject: renderedSubject,
    html: renderedHtml,
  };

  try {
    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify(payload),
    });
    const respJson = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Resend gateway error", res.status, respJson);
      return jsonResponse(
        { error: "Resend send failed", status: res.status, detail: respJson },
        502,
      );
    }
    return jsonResponse({ ok: true, id: respJson?.id ?? null, to: recipients });
  } catch (e) {
    console.error("Network error calling Resend:", e);
    return jsonResponse({ error: "Network error", detail: String(e) }, 502);
  }
}
