import { createFileRoute } from "@tanstack/react-router";
import CustomerProductDetail from "@/pages/customer/ProductDetail";

export const Route = createFileRoute("/dropshipping/catalog/$id")({
  head: () => ({
    meta: [
      { title: "Product — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <CustomerProductDetail />;
}
