import { createFileRoute } from "@tanstack/react-router";
import AgencyFaq from "@/pages/agency/AgencyFaq";

const title = "Agency & VA Programme FAQ — Tejaraa";
const description = "Answers about joining the Tejaraa agency and VA programme: invite links, lifetime commission, payouts, reversals and approval times.";

export const Route = createFileRoute("/agency/faq")({
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
  component: AgencyFaq,
});
