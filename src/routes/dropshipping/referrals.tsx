import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dropshipping/referrals")({
  head: () => ({
    meta: [
      { title: "Referrals — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dropshipping/billing", search: { tab: "referrals" }, replace: true });
  },
});
