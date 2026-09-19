import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dropshipping/orders/import")({
  head: () => ({
    meta: [
      { title: "Import Orders — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dropshipping/orders", search: { tab: "import" }, replace: true });
  },
});
