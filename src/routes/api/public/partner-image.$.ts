import { createFileRoute } from "@tanstack/react-router";

/**
 * Publicly serves one wholesaler product photo from the private
 * `partner-product-images` bucket, so mirrored shop listings can render it.
 * Read-only: it only streams image objects, nothing else.
 */
export const Route = createFileRoute("/api/public/partner-image/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const raw = (params as Record<string, string | undefined >)["_splat"] ?? "";
        const path = decodeURIComponent(raw).replace(/^\/+/, "");
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("partner-product-images").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        return new Response(await data.arrayBuffer(), {
          headers: {
            "content-type": data.type || "image/jpeg",
            "cache-control": "public, max-age=86400, s-maxage=604800",
          },
        });
      },
    },
  },
});
