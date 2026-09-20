import { createFileRoute } from "@tanstack/react-router";
import AgencyAdminLayout from "@/layouts/AgencyAdminLayout";

export const Route = createFileRoute("/agency-admin")({
  head: () => ({
    meta: [
      { title: "Agency Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgencyAdminLayout,
});
