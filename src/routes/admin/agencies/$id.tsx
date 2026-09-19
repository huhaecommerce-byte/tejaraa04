import { createFileRoute } from "@tanstack/react-router";
import AgencyDetail from "@/pages/admin/AgencyDetail";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/agencies/$id")({
  head: () => ({
    meta: [
      { title: "Agency — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule module="agencies">
      <AgencyDetail />
    </RequireModule>
  );
}
