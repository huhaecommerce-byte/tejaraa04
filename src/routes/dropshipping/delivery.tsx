import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dropshipping/delivery")({
  head: () => ({
    meta: [
      { title: "Delivery — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dropshipping/fulfillment", search: { tab: "delivery" }, replace: true });
  },
});
