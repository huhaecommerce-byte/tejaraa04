import { createFileRoute } from "@tanstack/react-router";
import AgencyEarnings from "@/pages/agency/AgencyEarnings";

export const Route = createFileRoute("/agency/portal/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings — Tejaraa Agency Portal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgencyEarnings,
});
