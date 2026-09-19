import { createFileRoute } from "@tanstack/react-router";
import AgencyLink from "@/pages/agency/AgencyLink";

export const Route = createFileRoute("/agency/portal/link")({
  head: () => ({
    meta: [
      { title: "My Invite Link — Tejaraa Agency Portal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgencyLink,
});
