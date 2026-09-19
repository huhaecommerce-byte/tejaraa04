import { createFileRoute } from "@tanstack/react-router";
import Reports from "@/pages/admin/Reports";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule module="reports">
      <Reports />
    </RequireModule>
  );
}
