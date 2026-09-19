import { createFileRoute } from "@tanstack/react-router";
import AgencyHowItWorks from "@/pages/agency/AgencyHowItWorks";

const title = "How the Agency & VA Programme Works — Tejaraa";
const description = "From application to payout: how agencies and virtual assistants onboard dropshippers to Tejaraa and earn commission on every order they place.";

export const Route = createFileRoute("/agency/how-it-works")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgencyHowItWorks,
});
