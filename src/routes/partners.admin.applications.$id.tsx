import { createFileRoute, redirect } from "@tanstack/react-router";
import { brandConfig } from "@/config/partnerBrand";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/partners/admin/applications/$id")({
  head: () => ({
    meta: [
      { title: `Application Detail | ${brandConfig.name}` },
      { name: "description", content: "Wholesaler application records now live inside the unified wholesaler profile." },
      { property: "og:title", content: `Application Detail | ${brandConfig.name}` },
      { property: "og:description", content: "Application details are shown on the wholesaler profile page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  beforeLoad: async ({ params }) => {
    const { data } = await supabase
      .from("wl_applications")
      .select("user_id")
      .eq("id", params.id)
      .maybeSingle();
    if (data?.user_id) throw redirect({ to: "/partners/admin/suppliers/$id", params: { id: data.user_id } });
    throw redirect({ to: "/partners/admin/applications" });
  },
  component: () => null,
});
