import { createFileRoute, redirect } from "@tanstack/react-router";
import Index from "@/pages/Index";
import { getCurrentHost, isSupplierHost } from "@/lib/siteHosts";

const title = "Tejaraa — Shop Products Online Across Saudi Arabia";
const description =
  "Shop products for delivery across Saudi Arabia, or access dedicated Tejaraa services for online sellers and wholesale suppliers.";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const host = await getCurrentHost();
    if (isSupplierHost(host)) {
      throw redirect({ to: "/partners" });
    }
  },

  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://tejaraa01.lovable.app/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://tejaraa01.lovable.app/" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Index />;
}
