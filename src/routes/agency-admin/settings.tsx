import { createFileRoute } from "@tanstack/react-router";
import AgencySettings from "@/pages/admin/AgencySettings";

export const Route = createFileRoute("/agency-admin/settings")({
  head: () => ({
    meta: [
      { title: "Agency Programme Settings — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgencySettings,
});
