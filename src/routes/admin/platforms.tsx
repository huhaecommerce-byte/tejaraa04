import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/platforms")({
  head: () => ({
    meta: [
      { title: "Platforms — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/catalog-hub", search: { tab: "platforms" }, replace: true });
  },
});
