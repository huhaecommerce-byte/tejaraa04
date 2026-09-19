import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, x-api-key",
  "access-control-allow-methods": "POST, OPTIONS",
};

export const Route = createFileRoute("/api/public/partners/channel/orders")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const { bearerToken, connectionFromKey, importOrder, parseIncomingOrder, logSync } = await import(
          "@/lib/partners/channel-sync.server"
        );
        const connection = await connectionFromKey(bearerToken(request));
        if (!connection) {
          return Response.json({ error: "Invalid or disabled API key" }, { status: 401, headers: cors });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Body must be valid JSON" }, { status: 400, headers: cors });
        }

        const list = Array.isArray(body)
          ? body
          : Array.isArray((body as Record<string, unknown>)?.['orders'])
            ? ((body as Record<string, unknown>)['orders'] as unknown[])
            : [body];

        const accepted: string[] = [];
        const rejected: { reference: string; error: string }[] = [];

        for (const entry of list) {
          let reference = "";
          try {
            const order = parseIncomingOrder(entry);
            reference = order.reference;
            await importOrder(connection, order);
            accepted.push(reference);
          } catch (error) {
            rejected.push({ reference, error: error instanceof Error ? error.message : String(error) });
          }
        }

        if (accepted.length === 0) {
          await logSync(connection.id, "inbound", "order_intake", "error", { rejected });
          return Response.json({ accepted, rejected }, { status: 400, headers: cors });
        }

        return Response.json({ accepted, rejected }, { status: 200, headers: cors });
      },
    },
  },
});
