import { createFileRoute } from "@tanstack/react-router";
import AgencyPayoutsAdmin from "@/pages/admin/AgencyPayoutsAdmin";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/agency-payouts")({
  head: () => ({
    meta: [
      { title: "Agency Payouts — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule module="agencies">
      <AgencyPayoutsAdmin />
    </RequireModule>
  );
}
