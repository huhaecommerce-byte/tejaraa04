import { createFileRoute } from "@tanstack/react-router";
import { handler } from "@/lib/edge/download-images.server";
import { corsHeaders } from "@/lib/edge/_shared/runtime.server";

export const Route = createFileRoute("/api/fn/download-images")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: corsHeaders }),
      GET: ({ request }) => handler(request),
      POST: ({ request }) => handler(request),
    },
  },
});
