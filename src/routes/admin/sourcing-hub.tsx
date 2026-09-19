import { createFileRoute } from "@tanstack/react-router";
import AdminSourcingHub from "@/pages/admin/SourcingHub";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/sourcing-hub")({
  head: () => ({
    meta: [
      { title: "Sourcing Hub — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule>
      <AdminSourcingHub />
    </RequireModule>
  );
}
