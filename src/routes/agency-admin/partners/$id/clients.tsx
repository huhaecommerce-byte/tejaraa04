import { createFileRoute } from "@tanstack/react-router";
import AgencyClients from "@/pages/admin/AgencyClients";

export const Route = createFileRoute("/agency-admin/partners/$id/clients")({
  head: () => ({
    meta: [
      { title: "Onboarded dropshippers — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgencyClients,
});
