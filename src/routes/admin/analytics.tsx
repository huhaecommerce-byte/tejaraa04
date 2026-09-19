import { createFileRoute } from "@tanstack/react-router";
import Analytics from "@/pages/admin/Analytics";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule module="analytics">
      <Analytics />
    </RequireModule>
  );
}
