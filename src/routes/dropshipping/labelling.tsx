import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dropshipping/labelling")({
  head: () => ({
    meta: [
      { title: "Labelling — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dropshipping/fulfillment", search: { tab: "labelling" }, replace: true });
  },
});
