import Stripe from "stripe";

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

// Live-only mode. The type is kept for backwards compatibility with callers,
// but only 'live' is ever honoured.
export type StripeEnv = 'live';

export function createStripeClient(_env: StripeEnv = 'live'): Stripe {
  const key = process.env['STRIPE_SECRET_KEY'];
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  if (!key.startsWith('sk_live_')) {
    throw new Error(
      `LIVE mode requires an sk_live_ secret key. Got prefix: ${key.substring(0, 8)}`
    );
  }
  return new Stripe(key, { apiVersion: '2025-04-30.basil' as Stripe.LatestApiVersion });
}

export async function verifyWebhook(req: Request, _env: StripeEnv = 'live'): Promise<{ type: string; data: { object: any } }> {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  const secret = process.env['STRIPE_WEBHOOK_SECRET'];

  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  if (!signature || !body) throw new Error("Missing signature or body");

  let timestamp: string | undefined;
  const v1Signatures: string[] = [];
  for (const part of signature.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key === "t") timestamp = value;
    if (key === "v1") v1Signatures.push(value);
  }

  if (!timestamp || v1Signatures.length === 0) throw new Error("Invalid signature format");

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) throw new Error("Webhook timestamp too old");

  const key2 = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key2,
    new TextEncoder().encode(`${timestamp}.${body}`)
  );
  const expected = toHex(new Uint8Array(signed));

  if (!v1Signatures.includes(expected)) throw new Error("Invalid webhook signature");

  return JSON.parse(body);
}
