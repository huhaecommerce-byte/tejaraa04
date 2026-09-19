import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, x-api-key",
  "access-control-allow-methods": "POST, OPTIONS",
};

export const Route = createFileRoute("/api/public/partners/supplier-inventory/updates")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const { bearerToken, integrationFromKey, parseInventoryPayload, applyInventoryBatch } = await import(
          "@/lib/partners/supplier-inventory.server"
        );
        const integration = await integrationFromKey(bearerToken(request));
        if (!integration) {
          return Response.json({ error: "Invalid or disabled API key" }, { status: 401, headers: cors });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Body must be valid JSON" }, { status: 400, headers: cors });
        }

        let payload: { requestId: string; entries: unknown[] };
        try {
          payload = parseInventoryPayload(body);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return Response.json({ error: message }, { status: 400, headers: cors });
        }

        const result = await applyInventoryBatch(integration, payload.entries, payload.requestId, "push");
        const status = result.accepted.length === 0 && !result.duplicate ? 400 : 200;
        return Response.json(
          {
            duplicate: result.duplicate,
            accepted: result.accepted,
            rejected: result.rejected,
          },
          { status, headers: cors },
        );
      },
    },
  },
});
