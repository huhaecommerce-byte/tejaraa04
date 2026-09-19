import { createFileRoute } from "@tanstack/react-router";
import CustomerLayout from "@/layouts/CustomerLayout";

export const Route = createFileRoute("/dropshipping")({
  head: () => ({
    meta: [
      { title: "Dropshipping Portal — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CustomerLayout,
});
