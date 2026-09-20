import { createFileRoute } from "@tanstack/react-router";
import AgencyPayoutsAdmin from "@/pages/admin/AgencyPayoutsAdmin";

export const Route = createFileRoute("/agency-admin/payouts")({
  head: () => ({
    meta: [
      { title: "Agency Payouts — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgencyPayoutsAdmin,
});
