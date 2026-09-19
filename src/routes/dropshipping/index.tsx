import { createFileRoute } from "@tanstack/react-router";
import CustomerDashboard from "@/pages/customer/Dashboard";

export const Route = createFileRoute("/dropshipping/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <CustomerDashboard />;
}
