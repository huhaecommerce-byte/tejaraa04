import { createFileRoute } from "@tanstack/react-router";
import CheckoutReturn from "@/pages/CheckoutReturn";

export const Route = createFileRoute("/checkout/return")({
  head: () => ({
    meta: [
      { title: "Checkout Status — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <CheckoutReturn />;
}
