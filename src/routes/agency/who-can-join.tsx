import { createFileRoute } from "@tanstack/react-router";
import AgencyWhoCanJoin from "@/pages/agency/AgencyWhoCanJoin";

const title = "Who Can Join the Tejaraa Agency & VA Programme";
const description = "Agencies, virtual assistants, coaches, creators and consultants who work with online sellers can join the Tejaraa partner programme — free, worldwide, reviewed on application.";

export const Route = createFileRoute("/agency/who-can-join")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgencyWhoCanJoin,
});
