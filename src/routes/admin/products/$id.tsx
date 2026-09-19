import { createFileRoute } from "@tanstack/react-router";
import ProductEditor from "@/pages/admin/ProductEditor";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/products/$id")({
  head: () => ({
    meta: [
      { title: "Edit Product — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule module="catalog">
      <ProductEditor />
    </RequireModule>
  );
}
