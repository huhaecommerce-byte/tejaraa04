import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "@/lib/edge/_shared/runtime.server";
import { createStripeClient, type StripeEnv } from "@/lib/edge/_shared/stripe";
import { logPaymentEvent } from "@/lib/edge/_shared/payment-events";

type Action = "cancel" | "resume" | "change_plan";

const PRICE_REF_PATTERN = /^(?<plan>[a-z0-9-]+)_(?<cycle>monthly|yearly|annual)$/i;

function normalizePlanName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      process.env['SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    );

    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body.action as Action;
    const env: StripeEnv = "live";
    if (!["cancel", "resume", "change_plan"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, environment, status")
      .eq("user_id", user.id)
      .eq("environment", env)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_subscription_id) {
      // For change_plan with no existing sub, signal client to fall back to a
      // fresh checkout flow so a new subscription is created.
      if (action === "change_plan") {
        return new Response(JSON.stringify({ ok: false, needsCheckout: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "No subscription found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = createStripeClient(env);

    // CHANGE PLAN — swap the existing subscription's price item (no new sub)
    if (action === "change_plan") {
      const priceRef = String(body.priceId || "");
      const m = priceRef.match(PRICE_REF_PATTERN);
      if (!m?.groups) {
        return new Response(JSON.stringify({ error: "Invalid priceId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const planSlug = m.groups.plan.toLowerCase();
      const cycle = m.groups.cycle.toLowerCase() === "annual" ? "yearly" : m.groups.cycle.toLowerCase();
      const interval = cycle === "monthly" ? "month" : "year";

      const { data: plans } = await supabase
        .from("pricing_plans")
        .select("id, name, price, annual_price");
      const plan = plans?.find((p: any) => normalizePlanName(p.name) === planSlug);
      if (!plan) {
        return new Response(JSON.stringify({ error: "Plan not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const rawAmount = cycle === "monthly" ? plan.price : (plan as any).annual_price;
      const amountStr = (rawAmount ?? "").toString().trim();
      if (!/^\d+(\.\d{1,2})?$/.test(amountStr)) {
        return new Response(JSON.stringify({ error: "Plan is not available for online checkout" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const unitAmount = Math.round(Number(amountStr) * 100);

      // Fetch current subscription to get item id
      const current = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
      const currentItem = current.items?.data?.[0];
      if (!currentItem) {
        return new Response(JSON.stringify({ error: "Subscription has no items" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
        items: [{
          id: currentItem.id,
          // Inline price with product_data is valid at runtime; the SDK types are narrower.
          price_data: {
            currency: "sar",
            unit_amount: unitAmount,
            recurring: { interval },
            product_data: {
              name: `${plan.name} ${cycle === "monthly" ? "Monthly" : "Annual"}`,
              metadata: {
                userId: user.id,
                planId: plan.id,
                planName: plan.name,
                planSlug,
                billingCycle: cycle,
              },
            },
          },
        }] as never,
        proration_behavior: "create_prorations",
        cancel_at_period_end: false,
        metadata: {
          userId: user.id,
          planId: plan.id,
          planName: plan.name,
          planSlug,
          billingCycle: cycle,
        },
      });

      // Mirror the swap in our tables
      const updatedPeriodEnd = (updated as unknown as { current_period_end?: number }).current_period_end;
      await supabase
        .from("subscriptions")
        .update({
          status: updated.status,
          cancel_at_period_end: false,
          current_period_end: updatedPeriodEnd
            ? new Date(updatedPeriodEnd * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", sub.stripe_subscription_id);

      const { data: existing } = await supabase
        .from("customer_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("customer_subscriptions")
          .update({
            plan_id: plan.id,
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        await supabase.from("customer_subscriptions").insert({
          user_id: user.id,
          plan_id: plan.id,
          status: "active",
          started_at: new Date().toISOString(),
        });
      }

      await logPaymentEvent({
        userId: user.id,
        kind: "subscription",
        status: "succeeded",
        sessionId: null,
        subscriptionId: sub.stripe_subscription_id,
        planId: plan.id,
        amountSar: unitAmount / 100,
        environment: env,
        metadata: { action: "change_plan", planName: plan.name, cycle, priceRef },
      });

      return new Response(JSON.stringify({
        ok: true,
        planId: plan.id,
        planName: plan.name,
        current_period_end: (updated as unknown as { current_period_end?: number }).current_period_end,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // CANCEL / RESUME (existing behaviour)
    const cancelAtPeriodEnd = action === "cancel";
    const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: cancelAtPeriodEnd,
        status: updated.status,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", sub.stripe_subscription_id);

    await logPaymentEvent({
      userId: user.id,
      kind: "subscription",
      status: cancelAtPeriodEnd ? "cancelled" : "succeeded",
      sessionId: null,
      subscriptionId: sub.stripe_subscription_id,
      environment: env,
      metadata: { action, cancel_at_period_end: cancelAtPeriodEnd },
    });

    return new Response(JSON.stringify({
      ok: true,
      cancel_at_period_end: cancelAtPeriodEnd,
      current_period_end: (updated as unknown as { current_period_end?: number }).current_period_end,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("manage-subscription error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
