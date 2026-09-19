import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dropshipping/team")({
  head: () => ({
    meta: [
      { title: "Team — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dropshipping/profile", search: { tab: "team" }, replace: true });
  },
});
