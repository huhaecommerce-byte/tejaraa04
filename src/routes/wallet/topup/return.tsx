import { createFileRoute } from "@tanstack/react-router";
import WalletTopupReturn from "@/pages/customer/WalletTopupReturn";

export const Route = createFileRoute("/wallet/topup/return")({
  head: () => ({
    meta: [
      { title: "Wallet Top-up — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <WalletTopupReturn />;
}
