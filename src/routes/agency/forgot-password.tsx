import { createFileRoute } from "@tanstack/react-router";
import AgencyForgotPassword from "@/pages/agency/AgencyForgotPassword";

const title = "Reset Password — Tejaraa Agency Partner Portal";
const description = "Request a secure password reset link for your Tejaraa agency or VA partner account.";

export const Route = createFileRoute("/agency/forgot-password")({
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
  component: AgencyForgotPassword,
});
