import { createFileRoute } from "@tanstack/react-router";
import CatalogHub from "@/pages/admin/CatalogHub";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/catalog-hub")({
  head: () => ({
    meta: [
      { title: "Catalog Hub — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule>
      <CatalogHub />
    </RequireModule>
  );
}
