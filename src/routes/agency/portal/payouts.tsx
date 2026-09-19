import { createFileRoute } from "@tanstack/react-router";
import AgencyPayoutsPage from "@/pages/agency/AgencyPayouts";

export const Route = createFileRoute("/agency/portal/payouts")({
  head: () => ({
    meta: [
      { title: "Payouts — Tejaraa Agency Portal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgencyPayoutsPage,
});
