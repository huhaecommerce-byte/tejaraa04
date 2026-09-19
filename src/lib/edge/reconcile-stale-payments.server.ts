// Reconciles dangling `initiated`/`pending` payment rows for the calling user
// by fetching the live Stripe session state and writing a precise terminal
// status + human-readable reason. Updates rows in place so they never sit as
// "Awaiting payment" in the customer billing UI.

import { createClient } from "@supabase/supabase-js";
import { createStripeClient } from "@/lib/edge/_shared/stripe";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// Rows younger than this are still in-flight — leave them alone.
const MIN_AGE_MS = 60 * 1000;
// Open Stripe sessions older than this are treated as expired.
const OPEN_CUTOFF_MS = 30 * 60 * 1000;
// Rows with no Stripe match older than this are forced to cancelled.
const HARD_CUTOFF_MS = 24 * 60 * 60 * 1000;

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = process.env['SUPABASE_URL']!;
    const anonKey = (process.env['SUPABASE_ANON_KEY'] ?? process.env['SUPABASE_PUBLISHABLE_KEY'])!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      supabaseUrl,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    );

    const now = Date.now();
    const minCutoff = new Date(now - MIN_AGE_MS).toISOString();

    const { data: rows } = await (admin.from("payment_events") as any)
      .select("id, kind, session_id, created_at, amount_sar")
      .eq("user_id", user.id)
      .in("status", ["initiated", "pending"])
      .lt("created_at", minCutoff)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ reconciled: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let stripe: ReturnType<typeof createStripeClient> | null = null;
    try {
      stripe = createStripeClient("live");
    } catch (_e) {
      stripe = null;
    }

    let count = 0;

    for (const row of rows as any[]) {
      const ageMs = now - new Date(row.created_at).getTime();

      let terminal:
        | { status: "expired" | "cancelled" | "failed" | "succeeded"; reason: string | null }
        | null = null;

      if (row.session_id && stripe) {
        try {
          const session = await stripe.checkout.sessions.retrieve(row.session_id);
          const lastErr =
            (session as any).last_payment_error?.message as string | undefined;
          const cancellationReason =
            (session as any).cancellation_details?.reason as string | undefined;

          if (
            session.payment_status === "paid" ||
            session.payment_status === "no_payment_required" ||
            (session.status === "complete" && session.mode === "subscription")
          ) {
            terminal = {
              status: "succeeded",
              reason: "Payment completed successfully.",
            };
          } else if (session.status === "expired") {
            terminal = {
              status: "expired",
              reason: "Checkout session expired before payment was completed.",
            };
          } else if (
            session.status === "complete" &&
            session.payment_status === "unpaid"
          ) {
            terminal = {
              status: "failed",
              reason:
                lastErr ||
                "Your bank declined the payment. Please try a different card.",
            };
          } else if (lastErr) {
            terminal = { status: "failed", reason: lastErr };
          } else if (session.status === "open") {
            // Still open in Stripe — mark expired once it has been sitting too long.
            if (ageMs > OPEN_CUTOFF_MS) {
              terminal = {
                status: "expired",
                reason:
                  "Checkout was abandoned. The session is no longer active.",
              };
            }
          } else if (cancellationReason) {
            terminal = {
              status: "cancelled",
              reason: `Checkout cancelled (${cancellationReason}).`,
            };
          }
        } catch (e) {
          console.error("stripe lookup failed:", row.session_id, e);
        }
      }

      // Fallbacks for rows without session_id or where Stripe gave us nothing.
      if (!terminal) {
        if (!row.session_id && ageMs > HARD_CUTOFF_MS) {
          terminal = {
            status: "cancelled",
            reason: "Checkout was closed without completing payment.",
          };
        } else if (ageMs > OPEN_CUTOFF_MS) {
          terminal = {
            status: "cancelled",
            reason: "You closed the checkout before completing payment.",
          };
        }
      }

      if (terminal) {
        await (admin.from("payment_events") as any)
          .update({
            status: terminal.status,
            error_message: terminal.reason,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        count++;
      }
    }

    return new Response(JSON.stringify({ reconciled: count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("reconcile-stale-payments error:", e);
    const msg = e instanceof Error ? e.message : "unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
