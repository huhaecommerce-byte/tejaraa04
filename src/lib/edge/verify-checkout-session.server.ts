import { createClient } from "@supabase/supabase-js";
import { createStripeClient, type StripeEnv } from "@/lib/edge/_shared/stripe";
import { logPaymentEvent } from "@/lib/edge/_shared/payment-events";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalizePlanName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, environment } = await req.json();
    if (!sessionId || typeof sessionId !== "string") {
      return new Response(JSON.stringify({ error: "sessionId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const env: StripeEnv = "live";
    void environment;
    const stripe = createStripeClient(env);

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "subscription.items.data.price"],
    });

    const paid =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required" ||
      (session.status === "complete" && session.mode === "subscription");

    if (!paid) {
      // Map Stripe state to our terminal status & user-friendly reason
      const meta0 = (session.metadata ?? {}) as Record<string, string>;
      const kind0: "wallet_topup" | "subscription" | "other" =
        meta0.kind === "wallet_topup"
          ? "wallet_topup"
          : session.mode === "subscription"
            ? "subscription"
            : "other";
      const userId0 = meta0.userId || null;
      const amountSar0 = meta0.amountSar ? Number(meta0.amountSar) : null;

      let terminalStatus:
        | "pending"
        | "expired"
        | "cancelled"
        | "failed"
        | null = null;
      let reason: string | null = null;

      const lastErr = (session as any).last_payment_error?.message as
        | string
        | undefined;

      if (session.status === "expired") {
        terminalStatus = "expired";
        reason = "Checkout session expired before payment was completed.";
      } else if (session.status === "complete" && session.payment_status === "unpaid") {
        terminalStatus = "failed";
        reason = lastErr || "Payment was not completed.";
      } else if (lastErr) {
        terminalStatus = "failed";
        reason = lastErr;
      } else if (session.status === "open") {
        // still in progress — don't write a terminal row
        terminalStatus = null;
      }

      if (terminalStatus && kind0 !== "other") {
        await logPaymentEvent({
          userId: userId0,
          kind: kind0,
          status: terminalStatus,
          sessionId: session.id,
          amountSar:
            amountSar0 ??
            (typeof (session as any).amount_total === "number"
              ? (session as any).amount_total / 100
              : null),
          environment: env,
          errorMessage: reason,
        });
      }

      return new Response(
        JSON.stringify({
          status: terminalStatus ?? "pending",
          paymentStatus: session.payment_status,
          sessionStatus: session.status,
          reason,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      process.env['SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    );

    const meta = (session.metadata ?? {}) as Record<string, string>;
    const userId = meta.userId;

    // Wallet top-up flow (one-off payment) — finalise here as a safety net
    // in case the webhook is delayed.
    if (meta.kind === "wallet_topup" && userId) {
      const amountSar = Number(meta.amountSar);
      if (Number.isFinite(amountSar) && amountSar > 0) {
        const { data, error } = await supabase.rpc(
          "wallet_credit_from_payment",
          {
            _user_id: userId,
            _amount: amountSar,
            _description: `Wallet top-up SAR ${amountSar.toFixed(2)} (Stripe)`,
            _stripe_session_id: session.id,
          },
        );
        if (error) console.error("wallet_credit_from_payment error:", error);

        await logPaymentEvent({
          userId,
          kind: "wallet_topup",
          status: "succeeded",
          sessionId: session.id,
          paymentIntentId:
            (session as any).payment_intent &&
            typeof (session as any).payment_intent === "string"
              ? ((session as any).payment_intent as string)
              : null,
          amountSar: amountSar,
          environment: env,
          metadata: { alreadyCredited: (data as any)?.already_credited ?? false },
        });

        return new Response(
          JSON.stringify({
            status: "active",
            kind: "wallet_topup",
            userId,
            amountSar,
            balanceAfter: (data as any)?.balance_after ?? null,
            alreadyCredited: (data as any)?.already_credited ?? false,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const planSlug = meta.planSlug;
    const planNameMeta = meta.planName;
    const planIdMeta = meta.planId;

    // Resolve target plan
    let planId: string | null = planIdMeta || null;
    let planName: string | null = planNameMeta || null;

    if (!planId) {
      const { data: plans } = await supabase
        .from("pricing_plans")
        .select("id, name");
      const match = plans?.find((p: any) =>
        planSlug
          ? normalizePlanName(p.name) === planSlug
          : planNameMeta && p.name === planNameMeta
      );
      if (match) {
        planId = match.id;
        planName = match.name;
      }
    } else if (!planName) {
      const { data: p } = await supabase
        .from("pricing_plans")
        .select("name")
        .eq("id", planId)
        .maybeSingle();
      planName = p?.name ?? null;
    }

    // Upsert subscriptions row (mirror webhook handler)
    const subscription: any = (session as any).subscription;
    if (userId && subscription && typeof subscription === "object") {
      const item = subscription.items?.data?.[0];
      const priceId =
        item?.price?.metadata?.lovable_external_id || item?.price?.id;
      const productId = item?.price?.product;
      const periodStart = subscription.current_period_start;
      const periodEnd = subscription.current_period_end;

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          product_id: productId,
          price_id: priceId,
          status: subscription.status,
          current_period_start: periodStart
            ? new Date(periodStart * 1000).toISOString()
            : null,
          current_period_end: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null,
          environment: env,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_subscription_id" },
      );
    }

    // Flip customer_subscriptions to the purchased plan
    if (userId && planId) {
      const { data: existing } = await supabase
        .from("customer_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("customer_subscriptions")
          .update({
            plan_id: planId,
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      } else {
        await supabase.from("customer_subscriptions").insert({
          user_id: userId,
          plan_id: planId,
          status: "active",
          started_at: new Date().toISOString(),
        });
      }
    }

    await logPaymentEvent({
      userId: userId || null,
      kind: "subscription",
      status: "succeeded",
      sessionId: session.id,
      subscriptionId:
        subscription && typeof subscription === "object"
          ? (subscription as any).id
          : null,
      amountSar:
        typeof (session as any).amount_total === "number"
          ? (session as any).amount_total / 100
          : null,
      planId: planId || null,
      environment: env,
      metadata: { planName },
    });

    return new Response(
      JSON.stringify({
        status: "active",
        planId,
        planName,
        userId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("verify-checkout-session error:", e);
    const msg = e instanceof Error ? e.message : "unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
