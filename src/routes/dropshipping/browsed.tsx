import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dropshipping/browsed")({
  head: () => ({
    meta: [
      { title: "Recently Browsed — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dropshipping/catalog", search: { tab: "browsed" }, replace: true });
  },
});
