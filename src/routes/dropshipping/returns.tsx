import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dropshipping/returns")({
  head: () => ({
    meta: [
      { title: "Returns — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dropshipping/orders", search: { tab: "returns" }, replace: true });
  },
});
