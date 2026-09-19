import { createFileRoute } from "@tanstack/react-router";
import Signup from "@/pages/Signup";

const title = "Create Account — Tejaraa Shopping";
const description =
  "Create a free Tejaraa shopping account. Order vetted products across Saudi Arabia with fast delivery and cash on delivery.";

export const Route = createFileRoute("/shop/signup")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://tejaraa.com/shop/signup" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://tejaraa.com/shop/signup" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Signup audience="shop" />;
}
