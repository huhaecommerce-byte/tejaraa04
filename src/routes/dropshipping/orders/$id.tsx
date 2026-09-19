import { createFileRoute } from "@tanstack/react-router";
import CustomerOrderDetail from "@/pages/customer/OrderDetail";

export const Route = createFileRoute("/dropshipping/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order Detail — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <CustomerOrderDetail />;
}
