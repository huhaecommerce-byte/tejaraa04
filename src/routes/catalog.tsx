import { createFileRoute } from "@tanstack/react-router";
import Catalog from "@/pages/Catalog";

const parsePage = (value: unknown) => Math.max(1, Number(value) || 1);

const title = "Shop All Products — Tejaraa Saudi Arabia";
const description =
  "Browse everyday products, categories and delivery options on Tejaraa, built for convenient shopping across Saudi Arabia.";

export const Route = createFileRoute("/catalog")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === 'string' ? search.q : undefined,
    cat: typeof search.cat === 'string' ? search.cat : undefined,
    source: search.source === 'local' || search.source === 'global' ? search.source : undefined,
    page: parsePage(search.page),
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://tejaraa.com/catalog" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://tejaraa.com/og-cover.jpg" },
      { name: "twitter:image", content: "https://tejaraa.com/og-cover.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://tejaraa.com/catalog" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Catalog />;
}
