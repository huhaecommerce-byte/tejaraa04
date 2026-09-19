import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/promo-codes")({
  head: () => ({
    meta: [
      { title: "Promo Codes — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/internal-hub", search: { tab: "promo" }, replace: true });
  },
});
