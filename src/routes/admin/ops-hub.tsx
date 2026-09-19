import { createFileRoute } from "@tanstack/react-router";
import OpsHub from "@/pages/admin/OpsHub";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/ops-hub")({
  head: () => ({
    meta: [
      { title: "Ops Hub — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule>
      <OpsHub />
    </RequireModule>
  );
}
