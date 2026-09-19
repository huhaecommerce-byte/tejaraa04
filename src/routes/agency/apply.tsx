import { createFileRoute } from "@tanstack/react-router";
import AgencyApply from "@/pages/agency/AgencyApply";

export const Route = createFileRoute("/agency/apply")({
  head: () => ({
    meta: [
      { title: "Apply as an Agency or VA — Tejaraa" },
      { name: "description", content: "Apply to the Tejaraa agency and virtual assistant programme and earn commission on every order your dropshippers place." },
      { property: "og:title", content: "Apply as an Agency or VA — Tejaraa" },
      { property: "og:description", content: "Free to join. Approval usually takes under two working days." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AgencyApply,
});
