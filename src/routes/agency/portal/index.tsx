import { createFileRoute } from "@tanstack/react-router";
import AgencyDashboard from "@/pages/agency/AgencyDashboard";

export const Route = createFileRoute("/agency/portal/")({
  head: () => ({
    meta: [
      { title: "Partner Dashboard — Tejaraa Agency Portal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgencyDashboard,
});
