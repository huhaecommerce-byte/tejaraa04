import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/suppliers")({
  head: () => ({
    meta: [
      { title: "Suppliers — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/catalog-hub", search: { tab: "suppliers" }, replace: true });
  },
});
