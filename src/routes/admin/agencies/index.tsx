import { createFileRoute } from "@tanstack/react-router";
import AgenciesAdmin from "@/pages/admin/Agencies";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/agencies/")({
  head: () => ({
    meta: [
      { title: "Agencies & VAs — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule module="agencies">
      <AgenciesAdmin />
    </RequireModule>
  );
}
