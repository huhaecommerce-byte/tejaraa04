import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dropshipping/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dropshipping/billing", search: { tab: "wallet" }, replace: true });
  },
});
