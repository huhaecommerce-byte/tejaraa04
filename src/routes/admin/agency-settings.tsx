import { createFileRoute } from "@tanstack/react-router";
import AgencySettings from "@/pages/admin/AgencySettings";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/agency-settings")({
  head: () => ({
    meta: [
      { title: "Agency Programme Settings — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule module="agencies">
      <AgencySettings />
    </RequireModule>
  );
}
