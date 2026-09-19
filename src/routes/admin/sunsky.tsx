import { createFileRoute } from "@tanstack/react-router";
import SunSkyHub from "@/pages/admin/SunSkyHub";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/sunsky")({
  head: () => ({
    meta: [
      { title: "SunSky — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule module="sunsky">
      <SunSkyHub />
    </RequireModule>
  );
}
