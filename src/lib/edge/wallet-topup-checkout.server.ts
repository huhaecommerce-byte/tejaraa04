import { createClient } from "@supabase/supabase-js";
import { createStripeClient, type StripeEnv } from "@/lib/edge/_shared/stripe";
import { logPaymentEvent, expireStaleInitiated } from "@/lib/edge/_shared/payment-events";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      process.env['SUPABASE_URL']!,
      (process.env['SUPABASE_ANON_KEY'] ?? process.env['SUPABASE_PUBLISHABLE_KEY'])!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } =
      await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;
    const email = (claimsData.claims as any).email as string | undefined;

    const body = await req.json().catch(() => ({}));
    const amount = Number(body?.amount);
    const environment: StripeEnv = "live";
    const returnUrl = typeof body?.returnUrl === "string" ? body.returnUrl : null;

    if (!Number.isFinite(amount) || amount < 20 || amount > 50000) {
      return new Response(
        JSON.stringify({ error: "Amount must be between 20 and 50,000 SAR" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const unitAmount = Math.round(amount * 100); // halalas
    const stripe = createStripeClient(environment);

    const requestOrigin = new URL(req.url).origin;
    const headerOrigin = req.headers.get("origin");
    const fallbackOrigin = (() => {
      try {
        const parsed = new URL(headerOrigin || requestOrigin);
        return parsed.protocol === "http:" || parsed.protocol === "https:"
          ? parsed.origin
          : requestOrigin;
      } catch {
        return requestOrigin;
      }
    })();
    const defaultReturnUrl = `${fallbackOrigin}/wallet/topup/return?session_id={CHECKOUT_SESSION_ID}`;
    const returnUrlFinal = (() => {
      if (!returnUrl) return defaultReturnUrl;
      try {
        // Validate without serialising so Stripe's checkout placeholder stays intact.
        const validationUrl = new URL(
          returnUrl.replace("{CHECKOUT_SESSION_ID}", "pending"),
        );
        if (validationUrl.protocol !== "http:" && validationUrl.protocol !== "https:") {
          return defaultReturnUrl;
        }
        return returnUrl;
      } catch {
        return defaultReturnUrl;
      }
    })();

    const metadata = {
      kind: "wallet_topup",
      userId,
      amountSar: amount.toFixed(2),
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      line_items: [
        {
          price_data: {
            currency: "sar",
            unit_amount: unitAmount,
            product_data: {
              name: `Wallet top-up — SAR ${amount.toFixed(2)}`,
              metadata,
            },
          },
          quantity: 1,
        },
      ],
      return_url: returnUrlFinal,
      ...(email ? { customer_email: email } : {}),
      metadata,
      payment_intent_data: { metadata },
    });

    // Sweep stale abandoned attempts so the buyer's activity feed stays clean
    await expireStaleInitiated(userId, "wallet_topup", 30);

    // Audit log: payment attempt initiated
    await logPaymentEvent({
      userId,
      kind: "wallet_topup",
      status: "initiated",
      sessionId: session.id,
      amountSar: amount,
      environment,
      metadata: { email },
    });

    return new Response(
      JSON.stringify({
        clientSecret: session.client_secret,
        sessionId: session.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("wallet-topup-checkout error:", e);
    const msg = e instanceof Error ? e.message : "unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
