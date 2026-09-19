import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/products/")({
  head: () => ({
    meta: [
      { title: "Products — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/catalog-hub", search: {}, replace: true });
  },
});
