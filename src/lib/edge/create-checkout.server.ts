import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "@/lib/edge/_shared/runtime.server";
import { type StripeEnv, createStripeClient } from "@/lib/edge/_shared/stripe";
import { logPaymentEvent, expireStaleInitiated } from "@/lib/edge/_shared/payment-events";

type BillingCycle = "monthly" | "yearly";

const PRICE_REF_PATTERN = /^(?<plan>[a-z0-9-]+)_(?<cycle>monthly|yearly|annual)$/i;
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

function normalizePlanName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePriceReference(priceId: string): { planSlug: string; cycle: BillingCycle } | null {
  const match = priceId.match(PRICE_REF_PATTERN);
  if (!match?.groups) return null;

  const rawCycle = match.groups.cycle.toLowerCase();
  return {
    planSlug: match.groups.plan.toLowerCase(),
    cycle: rawCycle === "annual" ? "yearly" : (rawCycle as BillingCycle),
  };
}

function parseAmountToMinorUnits(value: string | null | undefined): number | null {
  const normalized = (value ?? "").trim();
  if (!MONEY_PATTERN.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { priceId, quantity, customerEmail, userId, returnUrl, environment } = await req.json();

    if (!priceId || typeof priceId !== "string") {
      return new Response(JSON.stringify({ error: "Invalid priceId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsedPrice = parsePriceReference(priceId);
    if (!parsedPrice) {
      return new Response(JSON.stringify({ error: "Invalid price reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resolvedQuantity = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
    // Live-only mode: ignore client-supplied environment.
    const env: StripeEnv = "live";
    void environment;

    const supabaseUrl = process.env['SUPABASE_URL'];
    const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase service role credentials are not configured");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: plans, error: plansError } = await supabase
      .from("pricing_plans")
      .select("id, name, price, annual_price")
      .order("sort_order", { ascending: true });

    if (plansError) {
      console.error("Failed to load pricing plans:", plansError);
      return new Response(JSON.stringify({ error: "Failed to load pricing plans" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const matchedPlan = plans?.find((plan) => normalizePlanName(plan.name) === parsedPrice.planSlug);
    if (!matchedPlan) {
      console.error("Plan slug not found for price reference:", priceId);
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawAmount = parsedPrice.cycle === "monthly" ? matchedPlan.price : matchedPlan.annual_price;
    const unitAmount = parseAmountToMinorUnits(rawAmount);

    if (!unitAmount) {
      console.error("Plan is not configured for online checkout:", {
        plan: matchedPlan.name,
        cycle: parsedPrice.cycle,
        rawAmount,
      });
      return new Response(JSON.stringify({ error: "Selected plan is not available for online checkout" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = createStripeClient(env);
    const interval = parsedPrice.cycle === "monthly" ? "month" : "year";
    const cycleLabel = parsedPrice.cycle === "monthly" ? "Monthly" : "Annual";

    const metadata = {
      ...(userId ? { userId } : {}),
      planId: matchedPlan.id,
      planName: matchedPlan.name,
      planSlug: parsedPrice.planSlug,
      billingCycle: parsedPrice.cycle,
      internalPriceRef: priceId,
    };

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "sar",
            unit_amount: unitAmount,
            recurring: { interval },
            product_data: {
              name: `${matchedPlan.name} ${cycleLabel}`,
              metadata,
            },
          },
          quantity: resolvedQuantity,
        },
      ],
      mode: "subscription",
      ui_mode: "embedded",
      return_url: returnUrl || `${req.headers.get("origin")}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      metadata,
      subscription_data: { metadata },
    });

    if (userId) {
      await expireStaleInitiated(userId, "subscription", 30);
    }

    await logPaymentEvent({
      userId: userId || null,
      kind: "subscription",
      status: "initiated",
      sessionId: session.id,
      amountSar: unitAmount / 100,
      planId: matchedPlan.id,
      environment: env,
      metadata: {
        planName: matchedPlan.name,
        cycle: parsedPrice.cycle,
        priceRef: priceId,
      },
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown checkout error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
