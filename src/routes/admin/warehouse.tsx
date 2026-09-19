import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/warehouse")({
  head: () => ({
    meta: [
      { title: "Warehouse — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/ops-hub", search: { tab: "warehouse" }, replace: true });
  },
});
