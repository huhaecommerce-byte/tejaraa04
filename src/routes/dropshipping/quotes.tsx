import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dropshipping/quotes")({
  head: () => ({
    meta: [
      { title: "Quotes — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dropshipping/sourcing", search: { tab: "quotes" }, replace: true });
  },
});
