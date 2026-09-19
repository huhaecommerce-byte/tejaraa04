import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TRYOTO_BASE = "https://api.tryoto.com/rest/v2";

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = process.env['SUPABASE_URL']!;
    const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Read TryOTO refresh token from platform_settings
    const { data: tokenRow } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "tryoto_refresh_token")
      .maybeSingle();

    const refreshToken = tokenRow?.value;
    if (!refreshToken || refreshToken.trim() === '') {
      return new Response(
        JSON.stringify({ success: false, error: "TryOTO refresh token not configured. Please add your token in Settings → Integrations." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, ...params } = body;

    // Get access token
    const tokenRes = await fetch(`${TRYOTO_BASE}/refreshToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || (!tokenData.token && !tokenData.access_token)) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to authenticate with TryOTO", details: tokenData }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = tokenData.access_token || tokenData.token;

    // For refreshToken action, just return success
    if (action === "refreshToken") {
      return new Response(
        JSON.stringify({ success: true, message: "TryOTO connection verified" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Proxy other actions
    const endpoints: Record<string, { path: string; method: string }> = {
      checkOTODeliveryFee: { path: "/checkOTODeliveryFee", method: "POST" },
      checkDeliveryFee: { path: "/checkDeliveryFee", method: "POST" },
      createShipment: { path: "/createShipment", method: "POST" },
      orderStatus: { path: "/orderStatus", method: "POST" },
    };

    const endpoint = endpoints[action];
    if (!endpoint) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiRes = await fetch(`${TRYOTO_BASE}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(params),
    });

    const apiData = await apiRes.json();

    return new Response(
      JSON.stringify({ success: apiRes.ok, data: apiData }),
      { status: apiRes.ok ? 200 : apiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("tryoto-proxy error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
