import { createFileRoute } from "@tanstack/react-router";
import ShopifyWorkspace from "@/pages/customer/ShopifyWorkspace";

export const Route = createFileRoute("/dropshipping/integrations/shopify/$connectionId")({
  head: () => ({ meta: [
    { title: "Shopify Integration — Tejaraa" },
    { name: "description", content: "Push Tejaraa products to your Shopify store and keep stock, price and orders in sync." },
    { property: "og:title", content: "Shopify Integration — Tejaraa" },
    { property: "og:description", content: "Push Tejaraa products to your Shopify store and keep stock, price and orders in sync." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: RouteComponent,
});

function RouteComponent() {
  const { connectionId } = Route.useParams();
  return <ShopifyWorkspace connectionId={connectionId} />;
}
