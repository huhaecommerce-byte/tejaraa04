import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dropshipping/addresses")({
  head: () => ({
    meta: [
      { title: "Addresses — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dropshipping/profile", search: { tab: "addresses" }, replace: true });
  },
});
