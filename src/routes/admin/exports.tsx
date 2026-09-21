import { createFileRoute } from "@tanstack/react-router";
import ProjectExportsAdmin from "@/pages/admin/ProjectExports";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/exports")({
  head: () => ({
    meta: [
      { title: "Project Exports — Admin — Tejaraa" },
      { name: "description", content: "Download the full Tejaraa project archive and track every export download." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule module="settings">
      <ProjectExportsAdmin />
    </RequireModule>
  );
}
