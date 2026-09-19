import { createFileRoute } from "@tanstack/react-router";
import AccountAddresses from "@/pages/account/AccountAddresses";

export const Route = createFileRoute("/account/addresses")({
  head: () => ({
    meta: [
      { title: "Delivery Addresses — Tejaraa Shop" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountAddresses,
});
