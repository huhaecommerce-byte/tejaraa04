import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/label-designer")({
  head: () => ({
    meta: [
      { title: "Label Designer — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/catalog-hub", search: { tab: "designer" }, replace: true });
  },
});
