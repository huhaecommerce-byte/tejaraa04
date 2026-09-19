import { createFileRoute } from "@tanstack/react-router";
import { handler } from "@/lib/edge/process-email-queue.server";
import { corsHeaders } from "@/lib/edge/_shared/runtime.server";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

async function run(request: Request) {
  const cronFailure = await authenticateCronRequest(request);
  // Cron bearer accepted -> trusted; otherwise fall back to the handler's
  // own service-role JWT check.
  return handler(request, { trusted: cronFailure === null });
}

export const Route = createFileRoute("/api/public/process-email-queue")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: corsHeaders }),
      GET: ({ request }) => run(request),
      POST: ({ request }) => run(request),
    },
  },
});
