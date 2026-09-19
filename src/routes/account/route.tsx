import { createFileRoute } from "@tanstack/react-router";
import ShopAccountLayout from "@/layouts/ShopAccountLayout";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — Tejaraa Shop" },
      { name: "description", content: "Track your Tejaraa shop orders, saved products and delivery addresses." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ShopAccountLayout,
});
