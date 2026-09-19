import { loadStripe, Stripe } from "@stripe/stripe-js";
import { supabase } from "@/integrations/supabase/client";

// Live-only mode. Optional build-time override is used during local Lovable
// preview where the env var may inject a publishable key. In production we
// look up the live publishable key from `platform_settings`.
const buildTimeToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

let stripePromise: Promise<Stripe | null> | null = null;
let envResolved = false;

async function resolveStripeKey(): Promise<string | null> {
  if (buildTimeToken) return buildTimeToken;

  try {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("key, value")
      .eq("key", "stripe_publishable_key_live")
      .maybeSingle();
    if (error) {
      console.error("Failed to load Stripe live publishable key:", error);
      return null;
    }
    return (data?.value as string) || null;
  } catch (err) {
    console.error("Error resolving Stripe publishable key:", err);
    return null;
  }
}

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = (async () => {
      const key = await resolveStripeKey();
      if (!key) {
        console.error(
          "No Stripe LIVE publishable key configured. Set it in Admin → Settings → Integrations.",
        );
        envResolved = true;
        return null;
      }
      if (!key.startsWith("pk_live_")) {
        console.error(
          `Stripe is configured for LIVE mode only, but a non-live key was provided (prefix: ${key.substring(0, 8)}).`,
        );
        envResolved = true;
        return null;
      }
      envResolved = true;
      try {
        return await loadStripe(key);
      } catch (err) {
        console.error("Failed to load Stripe.js:", err);
        return null;
      }
    })();
  }
  return stripePromise;
}

/** Always 'live' — sandbox/test mode is disabled. */
export async function getStripeEnvironment(): Promise<"live"> {
  if (!envResolved) await getStripe();
  return "live";
}

export function isStripeConfigured(): boolean {
  return Boolean(buildTimeToken) || envResolved;
}

export async function getStripePriceId(priceId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("get-stripe-price", {
    body: { priceId, environment: "live" },
  });
  if (error || !data?.stripeId) {
    throw new Error(`Failed to resolve price: ${priceId}`);
  }
  return data.stripeId;
}
