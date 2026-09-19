import { createFileRoute } from "@tanstack/react-router";
import Services from "@/pages/Services";

const title = "Tejaraa — Sourcing & Fulfillment Services — Product sourcing, labelling fulfillment and dropshipping for saudi arabia";
const description =
  "End-to-end services for Saudi sellers. Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://tejaraa.com/services" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://tejaraa.com/og-cover.jpg" },
      { name: "twitter:image", content: "https://tejaraa.com/og-cover.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://tejaraa.com/services" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Services />;
}
