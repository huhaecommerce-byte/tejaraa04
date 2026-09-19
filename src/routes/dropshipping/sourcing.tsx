import { createFileRoute } from "@tanstack/react-router";
import SourcingHub from "@/pages/customer/SourcingHub";

export const Route = createFileRoute("/dropshipping/sourcing")({
  head: () => ({
    meta: [
      { title: "Sourcing — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <SourcingHub />;
}
