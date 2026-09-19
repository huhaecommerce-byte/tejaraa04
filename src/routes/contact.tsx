import { createFileRoute } from "@tanstack/react-router";
import Contact from "@/pages/Contact";

const title = "Contact — Product sourcing, labelling fulfillment and dropshipping for saudi arabia";
const description =
  "Talk to Tejaraa about sourcing and fulfillment. Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://tejaraa.com/contact" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://tejaraa.com/og-cover.jpg" },
      { name: "twitter:image", content: "https://tejaraa.com/og-cover.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://tejaraa.com/contact" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Contact />;
}
