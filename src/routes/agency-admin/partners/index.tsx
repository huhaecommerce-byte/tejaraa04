import { createFileRoute } from "@tanstack/react-router";
import AgenciesAdmin from "@/pages/admin/Agencies";

export const Route = createFileRoute("/agency-admin/partners/")({
  head: () => ({
    meta: [
      { title: "Agencies & VAs — Admin — Tejaraa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgenciesAdmin,
});
