import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/public/partners/channel/pull")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = await authenticateCronRequest(request);
        if (unauthorized) return unauthorized;
        const { pullOrdersFromAll } = await import("@/lib/partners/channel-sync.server");
        const results = await pullOrdersFromAll();
        return Response.json({ results });
      },
    },
  },
});
