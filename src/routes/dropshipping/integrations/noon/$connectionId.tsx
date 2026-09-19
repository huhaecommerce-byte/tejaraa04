import { createFileRoute } from "@tanstack/react-router";
import NoonWorkspace from "@/pages/customer/NoonWorkspace";

export const Route = createFileRoute("/dropshipping/integrations/noon/$connectionId")({
  head: () => ({ meta: [
    { title: "Noon Integration — Tejaraa" },
    { name: "description", content: "Manage Noon products, pricing, inventory, and FBPI orders from Tejaraa." },
    { property: "og:title", content: "Noon Integration — Tejaraa" },
    { property: "og:description", content: "Manage Noon products, pricing, inventory, and FBPI orders from Tejaraa." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: RouteComponent,
});

function RouteComponent() {
  const { connectionId } = Route.useParams();
  return <NoonWorkspace connectionId={connectionId} />;
}