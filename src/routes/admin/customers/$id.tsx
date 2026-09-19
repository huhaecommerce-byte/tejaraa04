import { createFileRoute } from "@tanstack/react-router";
import CustomerDetail from "@/pages/admin/CustomerDetail";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/customers/$id")({
  head: () => ({
    meta: [
      { title: "Customer Detail — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule module="customers">
      <CustomerDetail />
    </RequireModule>
  );
}
