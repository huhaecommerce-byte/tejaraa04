import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/public/partners/supplier-inventory/pull")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = await authenticateCronRequest(request);
        if (unauthorized) return unauthorized;
        const { pullFromAllIntegrations } = await import("@/lib/partners/supplier-inventory.server");
        const results = await pullFromAllIntegrations();
        return Response.json({ results });
      },
    },
  },
});
