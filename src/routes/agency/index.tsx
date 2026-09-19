import { createFileRoute } from "@tanstack/react-router";
import AgencyLanding from "@/pages/agency/AgencyLanding";

export const Route = createFileRoute("/agency/")({
  head: () => ({
    meta: [
      { title: "Agency & VA Partner Programme — Tejaraa" },
      { name: "description", content: "Onboard dropshippers to Tejaraa and earn lifetime commission on every order they place. Free to join, paid in SAR." },
      { property: "og:title", content: "Agency & VA Partner Programme — Tejaraa" },
      { property: "og:description", content: "Bring dropshippers to Tejaraa and earn a share of profit on every order they ever place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgencyLanding,
});
