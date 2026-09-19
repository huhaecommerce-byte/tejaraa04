import { createFileRoute } from "@tanstack/react-router";
import ProductImport from "@/pages/admin/ProductImport";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/products/import")({
  head: () => ({
    meta: [
      { title: "Import Products — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule module="catalog">
      <ProductImport />
    </RequireModule>
  );
}
