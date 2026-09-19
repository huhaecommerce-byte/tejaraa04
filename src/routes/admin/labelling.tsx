import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/labelling")({
  head: () => ({
    meta: [
      { title: "Labelling — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/ops-hub", search: { tab: "labelling" }, replace: true });
  },
});
