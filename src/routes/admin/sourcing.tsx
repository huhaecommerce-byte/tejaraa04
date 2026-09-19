import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/sourcing")({
  head: () => ({
    meta: [
      { title: "Sourcing — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/sourcing-hub", search: {}, replace: true });
  },
});
