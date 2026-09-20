import { createFileRoute } from "@tanstack/react-router";
import AgencyCommissions from "@/pages/admin/AgencyCommissions";

export const Route = createFileRoute("/agency-admin/partners/$id/commissions")({
  head: () => ({
    meta: [
      { title: "Commission ledger — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgencyCommissions,
});
