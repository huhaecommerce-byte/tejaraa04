import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/quotes")({
  head: () => ({
    meta: [
      { title: "Quotes — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/sourcing-hub", search: { tab: "quotes" }, replace: true });
  },
});
