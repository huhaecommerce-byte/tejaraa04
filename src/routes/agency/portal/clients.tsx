import { createFileRoute } from "@tanstack/react-router";
import AgencyClients from "@/pages/agency/AgencyClients";

export const Route = createFileRoute("/agency/portal/clients")({
  head: () => ({
    meta: [
      { title: "My Dropshippers — Tejaraa Agency Portal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgencyClients,
});
