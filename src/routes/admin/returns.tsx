import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/returns")({
  head: () => ({
    meta: [
      { title: "Returns — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/ops-hub", search: { tab: "returns" }, replace: true });
  },
});
