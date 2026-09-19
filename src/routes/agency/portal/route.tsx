import { createFileRoute } from "@tanstack/react-router";
import AgencyLayout from "@/layouts/AgencyLayout";

export const Route = createFileRoute("/agency/portal")({
  head: () => ({
    meta: [
      { title: "Agency Portal — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgencyLayout,
});
