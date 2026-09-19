import { createFileRoute } from "@tanstack/react-router";
import Pricing from "@/pages/Pricing";

const title = "Tejaraa — Pricing — Product sourcing, labelling fulfillment and dropshipping for saudi arabia";
const description =
  "Transparent sourcing and fulfillment pricing. Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://tejaraa.com/pricing" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://tejaraa.com/og-cover.jpg" },
      { name: "twitter:image", content: "https://tejaraa.com/og-cover.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://tejaraa.com/pricing" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Pricing />;
}
