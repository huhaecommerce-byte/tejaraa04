import { createFileRoute } from "@tanstack/react-router";
import CustomerTickets from "@/pages/customer/Tickets";

export const Route = createFileRoute("/dropshipping/tickets")({
  head: () => ({
    meta: [
      { title: "Tickets — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <CustomerTickets />;
}
