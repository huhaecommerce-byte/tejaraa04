import { createFileRoute } from "@tanstack/react-router";
import InternalHub from "@/pages/admin/InternalHub";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/internal-hub")({
  head: () => ({
    meta: [
      { title: "Internal Hub — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule>
      <InternalHub />
    </RequireModule>
  );
}
