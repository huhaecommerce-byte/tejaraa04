import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/homepage")({
  head: () => ({
    meta: [
      { title: "Homepage — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/internal-hub", search: { tab: "homepage" }, replace: true });
  },
});
