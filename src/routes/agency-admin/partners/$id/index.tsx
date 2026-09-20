import { createFileRoute } from "@tanstack/react-router";
import AgencyDetail from "@/pages/admin/AgencyDetail";

export const Route = createFileRoute("/agency-admin/partners/$id")({
  head: () => ({
    meta: [
      { title: "Agency — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgencyDetail,
});
