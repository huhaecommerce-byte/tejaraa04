import { createFileRoute } from "@tanstack/react-router";
import AdminOrderDetail from "@/pages/admin/OrderDetail";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order Detail — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule module="orders">
      <AdminOrderDetail />
    </RequireModule>
  );
}
