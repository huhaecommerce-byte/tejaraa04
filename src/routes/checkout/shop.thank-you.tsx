import { createFileRoute } from "@tanstack/react-router";
import ShopThankYou from "@/pages/ShopThankYou";

export const Route = createFileRoute("/checkout/shop/thank-you")({
  head: () => ({
    meta: [
      { title: "Order confirmed — Tejaraa" },
      { name: "description", content: "Your Tejaraa order has been received." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ShopThankYou,
});
