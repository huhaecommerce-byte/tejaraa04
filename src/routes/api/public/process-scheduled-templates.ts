import { createFileRoute } from "@tanstack/react-router";
import { handler } from "@/lib/edge/process-scheduled-templates.server";
import { corsHeaders } from "@/lib/edge/_shared/runtime.server";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

async function run(request: Request) {
  const cronFailure = await authenticateCronRequest(request);
  if (cronFailure) return cronFailure;
  return handler(request, { trusted: true });
}

export const Route = createFileRoute("/api/public/process-scheduled-templates")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: corsHeaders }),
      GET: ({ request }) => run(request),
      POST: ({ request }) => run(request),
    },
  },
});
