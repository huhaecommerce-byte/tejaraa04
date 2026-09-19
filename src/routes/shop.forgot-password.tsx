import { createFileRoute } from "@tanstack/react-router";
import ForgotPassword from "@/pages/ForgotPassword";

export const Route = createFileRoute("/shop/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Your Password — Tejaraa" },
      { name: "description", content: "Request a password reset link for your Tejaraa shopping account." },
      { property: "og:title", content: "Reset Your Password — Tejaraa" },
      { property: "og:description", content: "Request a password reset link for your Tejaraa shopping account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <ForgotPassword audience="shop" />;
}
