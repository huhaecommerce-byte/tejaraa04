import { createFileRoute } from "@tanstack/react-router";
import AgencyApply from "@/pages/agency/AgencyApply";

const title = "Create a Partner Account — Tejaraa Agency & VA Programme";
const description = "Create your Tejaraa agency or VA partner account and start earning commission on every order your dropshippers place.";

export const Route = createFileRoute("/agency/signup")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: AgencyApply,
});
