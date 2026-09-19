import { createFileRoute } from "@tanstack/react-router";
import OrdersHub from "@/pages/customer/OrdersHub";

export const Route = createFileRoute("/dropshipping/orders/")({
  head: () => ({
    meta: [
      { title: "My Orders — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <OrdersHub />;
}
