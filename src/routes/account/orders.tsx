import { createFileRoute } from "@tanstack/react-router";
import AccountOrders from "@/pages/account/AccountOrders";

export const Route = createFileRoute("/account/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — Tejaraa Shop" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountOrders,
});
