import { createFileRoute } from "@tanstack/react-router";
import AgencyAdminOverview from "@/pages/admin/AgencyAdminOverview";

export const Route = createFileRoute("/agency-admin/")({
  head: () => ({
    meta: [
      { title: "Agency Programme Overview — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgencyAdminOverview,
});
