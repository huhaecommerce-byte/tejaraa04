import { createFileRoute } from "@tanstack/react-router";
import FulfillmentHub from "@/pages/customer/FulfillmentHub";

export const Route = createFileRoute("/dropshipping/fulfillment")({
  head: () => ({
    meta: [
      { title: "Fulfillment — Tejaraa" },
      { name: "description", content: "Manage Tejaraa labelling and delivery workflows." },
      { property: "og:title", content: "Fulfillment — Tejaraa" },
      { property: "og:description", content: "Manage Tejaraa labelling and delivery workflows." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <FulfillmentHub />;
}
