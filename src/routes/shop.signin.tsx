import { createFileRoute } from "@tanstack/react-router";
import Login from "@/pages/Login";

export const Route = createFileRoute("/shop/signin")({
  head: () => ({
    meta: [
      { title: "Sign In — Tejaraa Shopping" },
      { name: "description", content: "Sign in to your Tejaraa shopping account to track orders, manage your wishlist and check out faster." },
      { property: "og:title", content: "Sign In — Tejaraa Shopping" },
      { property: "og:description", content: "Access your Tejaraa shopping account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Login audience="shop" />;
}
