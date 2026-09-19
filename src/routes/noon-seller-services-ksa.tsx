import { createFileRoute } from "@tanstack/react-router";
import NoonSellerServices from "@/pages/NoonSellerServices";

const title = "Noon Seller Services — Product sourcing, labelling fulfillment and dropshipping for saudi arabia";
const description =
  "FBN prep and labelling for Noon sellers. Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.";

export const Route = createFileRoute("/noon-seller-services-ksa")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://tejaraa.com/noon-seller-services-ksa" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://tejaraa.com/og-cover.jpg" },
      { name: "twitter:image", content: "https://tejaraa.com/og-cover.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://tejaraa.com/noon-seller-services-ksa" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <NoonSellerServices />;
}
