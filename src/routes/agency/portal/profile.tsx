import { createFileRoute } from "@tanstack/react-router";
import AgencyProfilePage from "@/pages/agency/AgencyProfile";

export const Route = createFileRoute("/agency/portal/profile")({
  head: () => ({
    meta: [
      { title: "Partner Profile — Tejaraa Agency Portal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgencyProfilePage,
});
