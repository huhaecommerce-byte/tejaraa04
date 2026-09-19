import { createFileRoute } from "@tanstack/react-router";
import AgencyLanding from "@/pages/agency/AgencyLanding";

export const Route = createFileRoute("/ar/agency")({
  head: () => ({
    meta: [
      { title: "برنامج الوكالات والمساعدين — تجارة" },
      { name: "description", content: "انضم إلى برنامج شركاء تجارة للوكالات والمساعدين الافتراضيين واربح عمولة على كل طلب ينفذه الدروب شيبرز الذين تضمهم." },
      { property: "og:title", content: "برنامج الوكالات والمساعدين — تجارة" },
      { property: "og:description", content: "اجلب الدروب شيبرز إلى تجارة واربح نسبة من الأرباح على كل طلب." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgencyLanding,
});
