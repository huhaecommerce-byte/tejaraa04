import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/internal-hub", search: { tab: "contact" }, replace: true });
  },
});
