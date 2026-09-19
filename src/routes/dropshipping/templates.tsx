import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dropshipping/templates")({
  head: () => ({
    meta: [
      { title: "Templates — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dropshipping/orders", search: { tab: "templates" }, replace: true });
  },
});
