import { createFileRoute } from "@tanstack/react-router";
import { handler } from "@/lib/edge/sitemap.server";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
    },
  },
});
