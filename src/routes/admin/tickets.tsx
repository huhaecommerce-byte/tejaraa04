import { createFileRoute } from "@tanstack/react-router";
import AdminTickets from "@/pages/admin/Tickets";
import { RequireModule } from "@/components/auth/RequireModule";

export const Route = createFileRoute("/admin/tickets")({
  head: () => ({
    meta: [
      { title: "Tickets — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireModule module="tickets">
      <AdminTickets />
    </RequireModule>
  );
}
