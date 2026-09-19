import { createFileRoute } from "@tanstack/react-router";
import ShopCheckout from "@/pages/ShopCheckout";

export const Route = createFileRoute("/checkout/shop/")({
  head: () => ({
    meta: [
      { title: "Checkout — Tejaraa online store" },
      {
        name: "description",
        content: "Guest checkout with cash on delivery or secure card payment in Saudi Arabia.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Secure Checkout — Tejaraa Shop" },
      {
        property: "og:description",
        content:
          "Complete your Tejaraa Shop order with transparent delivery, VAT, and payment details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ShopCheckout,
});
