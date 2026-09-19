import { createFileRoute } from "@tanstack/react-router";
import PlanUsageAdmin from "@/pages/admin/PlanUsage";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/plan-usage")({
  head: () => ({
    meta: [
      { title: "Plan Usage & Limits — Admin — Tejaraa" },
      { name: "description", content: "Set general usage limits for all buyers or override limits for a specific customer." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule module="customers">
      <PlanUsageAdmin />
    </RequireModule>
  );
}
