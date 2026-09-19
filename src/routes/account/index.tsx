import { createFileRoute } from "@tanstack/react-router";
import AccountOverview from "@/pages/account/AccountOverview";

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [
      { title: "Account Overview — Tejaraa Shop" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountOverview,
});
