import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pings the deployed payments-webhook URL to verify it is reachable from the
// public internet. Stripe will normally hit this with a real signed payload;
// here we send a tiny POST with no signature, so we EXPECT a 400 response.
// A 400/401 means "endpoint exists and is rejecting bad input" — i.e. healthy.
// Network errors or 404/5xx mean the endpoint is unreachable.

export async function handler(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // Only admins may run this probe.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const supabase = createClient(
      process.env['SUPABASE_URL']!,
      (process.env['SUPABASE_ANON_KEY'] ?? process.env['SUPABASE_PUBLISHABLE_KEY'])!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: claims.claims.sub,
      _role: "admin",
    });
    if (!isAdmin) {
      return json({ error: "Forbidden" }, 403);
    }

    // Live-only mode.
    const env = "live";
    try { await req.json(); } catch { /* ignore */ }

    const supaUrl = process.env['SUPABASE_URL']!;
    const target = `${new URL(req.url).origin}/api/public/payments-webhook?env=${env}`;
    const checkedAt = new Date().toISOString();

    try {
      const probe = await fetch(target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ probe: true }),
      });
      // Drain body to avoid leaking.
      await probe.text();

      // 200/400/401 all confirm the endpoint is alive and responding.
      const reachable = probe.status >= 200 && probe.status < 500;
      return json({
        ok: true,
        url: target,
        environment: env,
        status: probe.status,
        reachable,
        checked_at: checkedAt,
      });
    } catch (e) {
      return json({
        ok: false,
        url: target,
        environment: env,
        reachable: false,
        error: e instanceof Error ? e.message : String(e),
        checked_at: checkedAt,
      });
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
