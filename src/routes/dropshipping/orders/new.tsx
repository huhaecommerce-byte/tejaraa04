import { createFileRoute } from "@tanstack/react-router";
import PlaceOrder from "@/pages/customer/PlaceOrder";

export const Route = createFileRoute("/dropshipping/orders/new")({
  head: () => ({
    meta: [
      { title: "New Order — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <PlaceOrder />;
}
