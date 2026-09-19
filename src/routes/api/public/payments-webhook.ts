import { createFileRoute } from "@tanstack/react-router";
import { handler } from "@/lib/edge/payments-webhook.server";
import { corsHeaders } from "@/lib/edge/_shared/runtime.server";

export const Route = createFileRoute("/api/public/payments-webhook")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: corsHeaders }),
      GET: ({ request }) => handler(request),
      POST: ({ request }) => handler(request),
    },
  },
});
