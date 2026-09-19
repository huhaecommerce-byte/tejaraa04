import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/audit-log")({
  head: () => ({
    meta: [
      { title: "Audit Log — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/internal-hub", search: { tab: "audit" }, replace: true });
  },
});
