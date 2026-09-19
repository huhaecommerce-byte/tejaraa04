import { createFileRoute } from "@tanstack/react-router";
import AgencyContact from "@/pages/agency/AgencyContact";

const title = "Contact Tejaraa Partnerships — Agencies & VAs";
const description = "Get in touch with the Tejaraa partnerships team about the agency and virtual assistant programme, commission rates and onboarding your sellers.";

export const Route = createFileRoute("/agency/contact")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AgencyContact,
});
