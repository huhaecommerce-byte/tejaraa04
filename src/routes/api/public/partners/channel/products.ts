import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, x-api-key",
  "access-control-allow-methods": "GET, OPTIONS",
};

export const Route = createFileRoute("/api/public/partners/channel/products")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      GET: async ({ request }) => {
        const { bearerToken, connectionFromKey, listFeedProducts, logSync } = await import("@/lib/partners/channel-sync.server");
        const connection = await connectionFromKey(bearerToken(request));
        if (!connection) {
          return Response.json({ error: "Invalid or disabled API key" }, { status: 401, headers: cors });
        }
        try {
          const updatedSince = new URL(request.url).searchParams.get("updated_since") ?? undefined;
          const products = await listFeedProducts(updatedSince ?? undefined);
          await logSync(connection.id, "outbound", "product_feed", "ok", { count: products.length });
          return Response.json(
            { connection: connection.name, count: products.length, products },
            { headers: { ...cors, "cache-control": "no-store" } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await logSync(connection.id, "outbound", "product_feed", "error", { message });
          return Response.json({ error: message }, { status: 500, headers: cors });
        }
      },
    },
  },
});
