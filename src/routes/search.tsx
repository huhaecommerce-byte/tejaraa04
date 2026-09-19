import { createFileRoute } from "@tanstack/react-router";
import SearchResults from "@/pages/SearchResults";

const parseNumber = (value: unknown) => value === undefined ? undefined : Math.max(0, Number(value) || 0);

const title = "Search Products — Tejaraa Saudi Arabia";
const description =
  "Search products on Tejaraa and refine results by SAR price, delivery option and supported sorting.";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === 'string' ? search.q : undefined,
    source: search.source === 'local' || search.source === 'global' ? search.source : undefined,
    sort: search.sort === 'price_asc' || search.sort === 'price_desc' ? search.sort : undefined,
    min: parseNumber(search.min),
    max: parseNumber(search.max),
    page: Math.max(1, Number(search.page) || 1),
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex,follow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <SearchResults />;
}
