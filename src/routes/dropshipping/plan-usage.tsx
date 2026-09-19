import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dropshipping/plan-usage")({
  head: () => ({
    meta: [
      { title: "Plan Usage — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dropshipping", search: {}, replace: true });
  },
});
