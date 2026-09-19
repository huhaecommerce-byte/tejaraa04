import { createFileRoute } from "@tanstack/react-router";
import AgencySignIn from "@/pages/agency/AgencySignIn";

export const Route = createFileRoute("/agency/signin")({
  head: () => ({
    meta: [
      { title: "Partner Sign In — Tejaraa Agency Programme" },
      { name: "description", content: "Sign in to your Tejaraa agency partner account to track your dropshippers, earnings and payouts." },
      { property: "og:title", content: "Partner Sign In — Tejaraa Agency Programme" },
      { property: "og:description", content: "Access your Tejaraa partner dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: AgencySignIn,
});
