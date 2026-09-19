import { createFileRoute } from "@tanstack/react-router";
import { handler } from "@/lib/edge/shop-checkout.server";
import { corsHeaders } from "@/lib/edge/_shared/runtime.server";

export const Route = createFileRoute("/api/fn/shop-checkout")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: corsHeaders }),
      POST: ({ request }) => handler(request),
    },
  },
});
