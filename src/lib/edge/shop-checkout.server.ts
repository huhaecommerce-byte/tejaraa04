import { createClient } from "@supabase/supabase-js";
import { createStripeClient } from "@/lib/edge/_shared/stripe";
import { corsHeaders } from "@/lib/edge/_shared/runtime.server";

/**
 * Public storefront checkout — creates a Stripe hosted Checkout session for a
 * retail/bulk cart. Prices are recomputed server-side from the database so the
 * amount charged never depends on what the browser sent.
 */

interface LineInput {
  productId: string;
  qty: number;
}

const VAT_RATE = 0.15;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const orderRef = typeof body?.orderRef === "string" ? body.orderRef : "";
    const email = typeof body?.email === "string" ? body.email : undefined;
    const rawItems: LineInput[] = Array.isArray(body?.items) ? body.items : [];

    const items = rawItems
      .filter((i) => typeof i?.productId === "string" && Number(i?.qty) > 0)
      .slice(0, 100)
      .map((i) => ({ productId: i.productId, qty: Math.min(10000, Math.round(Number(i.qty))) }));

    if (!orderRef || items.length === 0) return json({ error: "Empty cart" }, 400);

    const key = (process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"])!;
    const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input: any, init: any) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("id, name, price_sar, images")
      .in("id", items.map((i) => i.productId));
    if (prodErr) return json({ error: prodErr.message }, 500);

    const { data: settingsRows } = await supabase
      .from("platform_settings")
      .select("key, value")
      .or("key.like.retail_tier_%,key.eq.retail_shipping_flat_sar,key.eq.retail_free_shipping_over_sar");
    const settings: Record<string, string> = {};
    (settingsRows ?? []).forEach((r: any) => { settings[r.key] = r.value; });

    const tierFlag = (settings["retail_tier_enabled"] ?? "true").toLowerCase();
    const tiersEnabled = !["false", "no", "0", "off"].includes(tierFlag);
    const tiers: { minQty: number; offPercent: number }[] = [];
    for (let i = 1; i <= 3; i++) {
      const q = Number(settings[`retail_tier_qty_${i}`]);
      const o = Number(settings[`retail_tier_off_${i}`]);
      if (q > 1 && o > 0) tiers.push({ minQty: q, offPercent: o });
    }
    const tierList = !tiersEnabled
      ? []
      : tiers.length
      ? tiers.sort((a, b) => a.minQty - b.minQty)
      : [
          { minQty: 10, offPercent: 5 },
          { minQty: 50, offPercent: 10 },
          { minQty: 100, offPercent: 15 },
        ];

    let subtotal = 0;
    const lineItems: any[] = [];
    for (const item of items) {
      const product = (products ?? []).find((p: any) => p.id === item.productId);
      if (!product) continue;
      let off = 0;
      for (const t of tierList) if (item.qty >= t.minQty) off = t.offPercent;
      const unit = Math.round(Number(product.price_sar) * (1 - off / 100) * 100) / 100;
      subtotal += unit * item.qty;
      lineItems.push({
        price_data: {
          currency: "sar",
          unit_amount: Math.round(unit * 100),
          product_data: { name: String(product.name).slice(0, 250) },
        },
        quantity: item.qty,
      });
    }
    if (!lineItems.length) return json({ error: "No valid products in cart" }, 400);

    const flat = Number(settings["retail_shipping_flat_sar"] ?? 25) || 0;
    const freeOver = Number(settings["retail_free_shipping_over_sar"] ?? 500) || 0;
    const shipping = freeOver > 0 && subtotal >= freeOver ? 0 : flat;
    const vat = Math.round((subtotal + shipping) * VAT_RATE * 100) / 100;

    if (shipping > 0) {
      lineItems.push({
        price_data: {
          currency: "sar",
          unit_amount: Math.round(shipping * 100),
          product_data: { name: "Delivery" },
        },
        quantity: 1,
      });
    }
    lineItems.push({
      price_data: {
        currency: "sar",
        unit_amount: Math.round(vat * 100),
        product_data: { name: "VAT (15%)" },
      },
      quantity: 1,
    });

    const origin = req.headers.get("origin") || new URL(req.url).origin;
    const stripe = createStripeClient("live");
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/checkout/shop/thank-you?ref=${encodeURIComponent(orderRef)}&paid=1`,
      cancel_url: `${origin}/cart`,
      ...(email ? { customer_email: email } : {}),
      metadata: { kind: "shop_order", orderRef },
    });

    return json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error("shop-checkout error:", e);
    return json({ error: e instanceof Error ? e.message : "unknown error" }, 500);
  }
}
