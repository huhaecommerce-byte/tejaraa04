import { createFileRoute } from "@tanstack/react-router";
import CartPage from "@/pages/Cart";

const title = "Your cart — Tejaraa online store";
const description =
  "Review your items, see bulk discounts and check out with cash on delivery or secure card payment across Saudi Arabia.";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CartPage,
});
