import { createFileRoute } from "@tanstack/react-router";
import CustomersAdmin from "@/pages/admin/Customers";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/customers/")({
  head: () => ({
    meta: [
      { title: "Customers — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule module="customers">
      <CustomersAdmin />
    </RequireModule>
  );
}
