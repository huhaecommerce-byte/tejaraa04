import { createFileRoute } from "@tanstack/react-router";
import AccountProfile from "@/pages/account/AccountProfile";

export const Route = createFileRoute("/account/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Tejaraa Shop" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountProfile,
});
