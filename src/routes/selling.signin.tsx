import { createFileRoute } from "@tanstack/react-router";
import Login from "@/pages/Login";

const title = "Dropshipping Sign In — Tejaraa";
const description =
  "Sign in to your Tejaraa dropshipping portal to manage sourcing, orders and fulfillment across Saudi Arabia.";

export const Route = createFileRoute("/selling/signin")({
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
  component: () => <Login audience="dropshipping" />,
});
