import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "node:crypto";
import type { Json } from "@/integrations/supabase/types";

/**
 * Shopify order/product webhooks. Custom apps created in the Shopify admin do
 * not expose an app secret to us, so the callback URL carries a per-connection
 * token that we verify against its stored hash before touching any data.
 */
export const Route = createFileRoute("/api/public/shopify/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const token = new URL(request.url).searchParams.get("token") ?? "";
        const shopDomain = request.headers.get("x-shopify-shop-domain") ?? "";
        const topic = request.headers.get("x-shopify-topic") ?? "";
        const webhookId = request.headers.get("x-shopify-webhook-id") ?? createHash("sha256").update(rawBody).digest("hex");
        if (!token || !shopDomain || !topic) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: connection } = await supabaseAdmin
          .from("shopify_connections")
          .select("id,user_id,webhook_secret_hash,status")
          .eq("shop_domain", shopDomain.toLowerCase())
          .maybeSingle();
        if (!connection?.webhook_secret_hash) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const expected = Buffer.from(connection.webhook_secret_hash, "hex");
        const supplied = createHash("sha256").update(token).digest();
        if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return Response.json({ error: "Unauthorized" }, { status: 401 });

        let payload: Record<string, unknown>;
        try { payload = JSON.parse(rawBody) as Record<string, unknown>; } catch { return Response.json({ error: "Invalid payload" }, { status: 400 }); }

        const { data: event } = await supabaseAdmin.from("shopify_webhook_events").upsert({
          connection_id: connection.id,
          webhook_id: webhookId,
          topic,
          shop_domain: shopDomain.toLowerCase(),
          raw_payload: payload as Json,
        }, { onConflict: "webhook_id", ignoreDuplicates: true }).select("id").maybeSingle();
        // Duplicate delivery — already accepted.
        if (!event) return Response.json({ accepted: true });

        if (topic === "orders/create") {
          await supabaseAdmin.from("shopify_sync_jobs").insert({
            user_id: connection.user_id,
            connection_id: connection.id,
            job_type: "import_order",
            entity_type: "order",
            entity_id: String(payload["id"] ?? webhookId),
            payload: { order: payload } as Json,
          });
        } else if (topic === "orders/cancelled") {
          await supabaseAdmin.from("shopify_orders").update({ status: "cancelled", fulfillment_status: "cancelled" }).eq("connection_id", connection.id).eq("external_id", String(payload["id"] ?? ""));
        } else if (topic === "products/delete") {
          await supabaseAdmin.from("shopify_product_links").update({ shopify_product_id: null, shopify_variant_id: null, inventory_item_id: null, content_status: "draft", sync_status: "draft", last_error: "Removed in Shopify" }).eq("connection_id", connection.id).eq("shopify_product_id", `gid://shopify/Product/${payload["id"]}`);
        }

        await supabaseAdmin.from("shopify_webhook_events").update({ processed: true }).eq("id", event.id);
        return Response.json({ accepted: true });
      },
    },
  },
});
