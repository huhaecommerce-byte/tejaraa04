import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/edge/_shared/stripe";
import { logPaymentEvent } from "@/lib/edge/_shared/payment-events";

const supabase = createClient(
  process.env['SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
);

export async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as StripeEnv;

  try {
    const event: any = await verifyWebhook(req, env);
    console.log("Received event:", event.type, "env:", env);

    // Audit log: persist a small summary of every verified event so the
    // admin Webhook Health screen can show reachability + last received event.
    try {
      const obj: any = event.data?.object ?? {};
      const summary = {
        object_id: obj.id ?? null,
        object_type: obj.object ?? null,
        customer: obj.customer ?? null,
        customer_email: obj.customer_email ?? obj.customer_details?.email ?? null,
        subscription: obj.subscription ?? null,
        amount_total: obj.amount_total ?? null,
        currency: obj.currency ?? null,
        mode: obj.mode ?? null,
        status: obj.status ?? null,
      };
      await supabase.from("webhook_events").upsert(
        {
          provider: "stripe",
          event_id: event.id,
          event_type: event.type,
          environment: env,
          payload_summary: summary,
        },
        { onConflict: "provider,event_id" }
      );
    } catch (logErr) {
      console.error("Failed to log webhook_event:", logErr);
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, env);
        break;
      case "checkout.session.expired":
        await handleCheckoutExpired(event.data.object, env);
        break;
      case "checkout.session.async_payment_failed":
        await handleCheckoutFailed(event.data.object, env);
        break;
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object, env);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object, env);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object, env);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object, env);
        break;
      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object, env);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object, env);
        break;
      case "charge.dispute.created":
        await handleDisputeCreated(event.data.object, env);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  console.log("Checkout completed:", session.id, "mode:", session.mode);

  // Wallet top-up (one-off payment)
  if (session.metadata?.kind === "wallet_topup" && session.metadata?.userId) {
    const userId = session.metadata.userId as string;
    const amountSar = Number(session.metadata.amountSar);
    const paid =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required";
    if (!paid || !Number.isFinite(amountSar) || amountSar <= 0) {
      console.warn("Skipping wallet topup credit:", {
        paid: session.payment_status,
        amountSar,
      });
      return;
    }
    const { data, error } = await supabase.rpc("wallet_credit_from_payment", {
      _user_id: userId,
      _amount: amountSar,
      _description: `Wallet top-up SAR ${amountSar.toFixed(2)} (Stripe)`,
      _stripe_session_id: session.id,
    });
    if (error) {
      console.error("wallet_credit_from_payment failed:", error);
    } else {
      console.log("Wallet credited:", data);
    }
    await logPaymentEvent({
      userId,
      kind: "wallet_topup",
      status: "succeeded",
      sessionId: session.id,
      paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
      amountSar,
      environment: env,
      metadata: { source: "webhook", alreadyCredited: (data as any)?.already_credited ?? false },
    });
    return;
  }

  // For subscription checkouts, flip customer_subscriptions to the
  // ACTUAL purchased plan (planId comes from create-checkout metadata).
  if (session.mode === "subscription" && session.metadata?.userId) {
    const userId = session.metadata.userId;
    const planIdFromMeta = session.metadata?.planId as string | undefined;
    const planNameFromMeta = session.metadata?.planName as string | undefined;

    let resolvedPlanId: string | null = planIdFromMeta || null;
    if (!resolvedPlanId && planNameFromMeta) {
      const { data: matchByName } = await supabase
        .from("pricing_plans")
        .select("id")
        .eq("name", planNameFromMeta)
        .maybeSingle();
      resolvedPlanId = matchByName?.id ?? null;
    }

    if (resolvedPlanId) {
      const { data: existing } = await supabase
        .from("customer_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("customer_subscriptions")
          .update({
            plan_id: resolvedPlanId,
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      } else {
        await supabase.from("customer_subscriptions").insert({
          user_id: userId,
          plan_id: resolvedPlanId,
          status: "active",
          started_at: new Date().toISOString(),
        });
      }
    } else {
      console.error("payments-webhook: no planId or matching planName in metadata", session.metadata);
    }

    await logPaymentEvent({
      userId,
      kind: "subscription",
      status: "succeeded",
      sessionId: session.id,
      subscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null,
      amountSar: typeof session.amount_total === "number" ? session.amount_total / 100 : null,
      planId: resolvedPlanId,
      environment: env,
      metadata: { source: "webhook", planName: planNameFromMeta ?? null },
    });
  }
}

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
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
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;

  const periodStart = subscription.current_period_start;
  const periodEnd = subscription.current_period_end;

  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      product_id: productId,
      price_id: priceId,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  // Mark as canceled — user keeps access until period end
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  // Revert customer_subscriptions to Starter plan
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env)
    .single();

  if (sub?.user_id) {
    const { data: starterPlan } = await supabase
      .from("pricing_plans")
      .select("id")
      .eq("name", "Starter")
      .single();

    if (starterPlan) {
      await supabase
        .from("customer_subscriptions")
        .update({
          plan_id: starterPlan.id,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", sub.user_id);
    }
  }
}

// ---------- New event handlers ----------

async function findUserBySession(sessionId: string | null): Promise<string | null> {
  if (!sessionId) return null;
  const { data } = await (supabase.from("payment_events") as any)
    .select("user_id")
    .eq("session_id", sessionId)
    .not("user_id", "is", null)
    .limit(1)
    .maybeSingle();
  return data?.user_id ?? null;
}

async function handleCheckoutExpired(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId || (await findUserBySession(session.id));
  await logPaymentEvent({
    userId,
    kind: session.metadata?.kind === "wallet_topup" ? "wallet_topup" : "subscription",
    status: "expired",
    sessionId: session.id,
    amountSar: typeof session.amount_total === "number" ? session.amount_total / 100 : null,
    environment: env,
    errorMessage: "Checkout session expired without completion",
    metadata: { source: "webhook" },
  });
}

async function handleCheckoutFailed(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId || (await findUserBySession(session.id));
  await logPaymentEvent({
    userId,
    kind: session.metadata?.kind === "wallet_topup" ? "wallet_topup" : "subscription",
    status: "failed",
    sessionId: session.id,
    amountSar: typeof session.amount_total === "number" ? session.amount_total / 100 : null,
    environment: env,
    errorMessage: "Async payment failed",
    metadata: { source: "webhook" },
  });
  if (userId) {
    await supabase.rpc("create_notification", {
      _user_id: userId,
      _type: "broadcast",
      _title: "Payment failed",
      _body: "Your recent payment could not be completed. Please try again.",
      _link: "/dropshipping/wallet",
      _metadata: { session_id: session.id },
    });
  }
}

async function handleInvoicePaid(invoice: any, env: StripeEnv) {
  const userId = invoice.metadata?.userId || invoice.subscription_details?.metadata?.userId || null;
  await logPaymentEvent({
    userId,
    kind: "subscription",
    status: "succeeded",
    sessionId: invoice.id, // use invoice id as the dedup key for renewals
    subscriptionId: typeof invoice.subscription === "string" ? invoice.subscription : null,
    amountSar: typeof invoice.amount_paid === "number" ? invoice.amount_paid / 100 : null,
    environment: env,
    metadata: { source: "webhook", invoice: invoice.id, kind: "renewal" },
  });
}

async function handleInvoiceFailed(invoice: any, env: StripeEnv) {
  const userId = invoice.metadata?.userId || invoice.subscription_details?.metadata?.userId || null;
  await logPaymentEvent({
    userId,
    kind: "subscription",
    status: "failed",
    sessionId: invoice.id,
    subscriptionId: typeof invoice.subscription === "string" ? invoice.subscription : null,
    amountSar: typeof invoice.amount_due === "number" ? invoice.amount_due / 100 : null,
    environment: env,
    errorMessage: invoice.last_finalization_error?.message || "Invoice payment failed",
    metadata: { source: "webhook", attempt_count: invoice.attempt_count },
  });
  if (userId) {
    await supabase.rpc("create_notification", {
      _user_id: userId,
      _type: "broadcast",
      _title: "Subscription payment failed",
      _body: "We could not charge your subscription. Please update your card to keep your plan active.",
      _link: "/dropshipping/billing",
      _metadata: { invoice: invoice.id },
    });
  }
}

async function handleChargeRefunded(charge: any, env: StripeEnv) {
  const sessionId =
    charge.payment_intent && typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.id;
  // Try to find original event for context
  const { data: original } = await (supabase.from("payment_events") as any)
    .select("user_id, kind, session_id, amount_sar")
    .or(`payment_intent_id.eq.${charge.payment_intent},session_id.eq.${sessionId}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  await logPaymentEvent({
    userId: original?.user_id ?? null,
    kind: (original?.kind as any) ?? "other",
    status: "refunded",
    sessionId: original?.session_id ?? sessionId,
    paymentIntentId: typeof charge.payment_intent === "string" ? charge.payment_intent : null,
    amountSar: typeof charge.amount_refunded === "number" ? charge.amount_refunded / 100 : null,
    environment: env,
    metadata: { source: "webhook", charge: charge.id, reason: charge.refunds?.data?.[0]?.reason },
  });
}

async function handleDisputeCreated(dispute: any, env: StripeEnv) {
  await logPaymentEvent({
    userId: null,
    kind: "other",
    status: "disputed",
    sessionId: dispute.charge,
    paymentIntentId: typeof dispute.payment_intent === "string" ? dispute.payment_intent : null,
    amountSar: typeof dispute.amount === "number" ? dispute.amount / 100 : null,
    environment: env,
    errorMessage: dispute.reason,
    metadata: { source: "webhook", dispute_id: dispute.id, status: dispute.status },
  });
  await supabase.rpc("notify_admins", {
    _type: "broadcast",
    _title: "New chargeback dispute",
    _body: `Reason: ${dispute.reason}. Charge: ${dispute.charge}`,
    _link: "/admin/settings",
    _metadata: { dispute_id: dispute.id },
  });
}
