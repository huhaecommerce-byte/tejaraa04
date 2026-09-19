import { createFileRoute } from "@tanstack/react-router";
import ProductsHub from "@/pages/customer/ProductsHub";

export const Route = createFileRoute("/dropshipping/catalog/")({
  head: () => ({
    meta: [
      { title: "Catalog — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <ProductsHub />;
}
