// Shared helper to write entries to the unified `payment_events` log.
// Idempotent on (provider, session_id, status) — safe to call from webhooks
// and verify polling.

import { createClient } from "@supabase/supabase-js";

export type PaymentEventStatus =
  | "initiated"
  | "pending"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "refunded"
  | "disputed"
  | "expired";

export type PaymentEventKind = "subscription" | "wallet_topup" | "other";

export interface PaymentEventInput {
  userId?: string | null;
  kind: PaymentEventKind;
  status: PaymentEventStatus;
  sessionId?: string | null;
  paymentIntentId?: string | null;
  subscriptionId?: string | null;
  amountSar?: number | null;
  currency?: string | null;
  planId?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
  environment?: string;
}

let cached: ReturnType<typeof createClient> | null = null;
function admin() {
  if (cached) return cached;
  cached = createClient(
    process.env['SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  );
  return cached;
}

/**
 * Mark previous `initiated` payment events for this user/kind as `expired`
 * when they're older than `olderThanMinutes`. Used to keep the customer-facing
 * activity feed clean when a buyer abandons a Stripe checkout session.
 */
export async function expireStaleInitiated(
  userId: string,
  kind: PaymentEventKind,
  olderThanMinutes = 30,
): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString();
    const { error } = await (admin().from("payment_events") as any)
      .update({
        status: "cancelled",
        error_message: "Checkout was closed without completing payment.",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("kind", kind)
      .in("status", ["initiated", "pending"])
      .lt("created_at", cutoff);
    if (error) console.error("expireStaleInitiated failed:", error);
  } catch (e) {
    console.error("expireStaleInitiated crashed:", e);
  }
}

/**
 * Insert (or upsert) a payment event. Failures are logged but never throw —
 * payment side effects must always succeed even if logging is briefly down.
 */
export async function logPaymentEvent(input: PaymentEventInput): Promise<void> {
  try {
    const row = {
      user_id: input.userId ?? null,
      kind: input.kind,
      status: input.status,
      provider: "stripe",
      session_id: input.sessionId ?? null,
      payment_intent_id: input.paymentIntentId ?? null,
      subscription_id: input.subscriptionId ?? null,
      amount_sar: input.amountSar ?? null,
      currency: (input.currency ?? "sar").toLowerCase(),
      plan_id: input.planId ?? null,
      error_message: input.errorMessage ?? null,
      metadata: input.metadata ?? {},
      environment: input.environment ?? "sandbox",
      updated_at: new Date().toISOString(),
    };

    if (input.sessionId) {
      // Idempotent path: same (provider, session_id, status) collapses.
      const { error } = await (admin().from("payment_events") as any)
        .upsert(row, { onConflict: "provider,session_id,status" });
      if (error) console.error("payment_events upsert failed:", error);
    } else {
      const { error } = await (admin().from("payment_events") as any).insert(row);
      if (error) console.error("payment_events insert failed:", error);
    }
  } catch (e) {
    console.error("logPaymentEvent crashed:", e);
  }
}
