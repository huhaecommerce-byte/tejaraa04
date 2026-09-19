import { corsHeaders } from "@/lib/edge/_shared/runtime.server";
import { type StripeEnv, createStripeClient } from "@/lib/edge/_shared/stripe";

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { priceId, environment } = await req.json();
    if (!priceId || typeof priceId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(priceId)) {
      return new Response(JSON.stringify({ error: "Invalid priceId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const env: StripeEnv = "live";
    void environment;
    const stripe = createStripeClient(env);

    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!Array.isArray(prices?.data)) {
      console.error("Stripe price lookup failed for key:", priceId, "response:", JSON.stringify(prices));
      const gatewayError = prices as { message?: string; type?: string; props?: { source?: string } };
      const isConnectionIssue = gatewayError?.message === "Credential not found"
        || gatewayError?.type === "unauthorized"
        || gatewayError?.props?.source === "connectors_gateway";

      return new Response(JSON.stringify({
        error: isConnectionIssue ? "Payments connection needs to be reconnected" : "Price lookup failed",
      }), {
        status: isConnectionIssue ? 502 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!prices.data.length) {
      return new Response(JSON.stringify({ error: "Price not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ stripeId: prices.data[0].id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown price lookup error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
