import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dropshipping/invoices")({
  head: () => ({
    meta: [
      { title: "Invoices — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dropshipping/billing", search: { tab: "invoices" }, replace: true });
  },
});
