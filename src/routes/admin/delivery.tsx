import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/delivery")({
  head: () => ({
    meta: [
      { title: "Delivery — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/ops-hub", search: { tab: "delivery" }, replace: true });
  },
});
