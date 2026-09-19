import { createFileRoute } from "@tanstack/react-router";
import { handler } from "@/lib/edge/sitemap.server";
import { corsHeaders } from "@/lib/edge/_shared/runtime.server";

export const Route = createFileRoute("/api/public/sitemap")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: corsHeaders }),
      GET: ({ request }) => handler(request),
      POST: ({ request }) => handler(request),
    },
  },
});
