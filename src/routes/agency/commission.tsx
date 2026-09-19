import { createFileRoute } from "@tanstack/react-router";
import AgencyCommission from "@/pages/agency/AgencyCommission";

const title = "Agency Commission & Payouts — Tejaraa Partner Programme";
const description = "How Tejaraa agency and VA commission is calculated, when it becomes available, how reversals work and how to withdraw your earnings in SAR.";

export const Route = createFileRoute("/agency/commission")({
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
  component: AgencyCommission,
});
