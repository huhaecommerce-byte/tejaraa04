import { createFileRoute } from "@tanstack/react-router";
import BillingHub from "@/pages/customer/BillingHub";

export const Route = createFileRoute("/dropshipping/billing")({
  head: () => ({
    meta: [
      { title: "Billing — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <BillingHub />;
}
