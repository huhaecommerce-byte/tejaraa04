import { createFileRoute } from "@tanstack/react-router";
import AccountWishlist from "@/pages/account/AccountWishlist";

export const Route = createFileRoute("/account/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — Tejaraa Shop" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountWishlist,
});
