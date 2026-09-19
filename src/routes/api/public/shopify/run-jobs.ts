import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/public/shopify/run-jobs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = await authenticateCronRequest(request);
        if (unauthorized) return unauthorized;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { processShopifyJobs } = await import("@/lib/shopify.server");
        return Response.json({ results: await processShopifyJobs(supabaseAdmin) });
      },
    },
  },
});
