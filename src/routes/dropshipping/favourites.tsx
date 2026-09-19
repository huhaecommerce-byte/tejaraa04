import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dropshipping/favourites")({
  head: () => ({
    meta: [
      { title: "Favourites — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dropshipping/catalog", search: { tab: "favourites" }, replace: true });
  },
});
