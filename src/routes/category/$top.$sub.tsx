import { createFileRoute, notFound } from '@tanstack/react-router';
import CategoryPage, { categoryHeading, categoryIntro, categoryJsonLd } from '@/pages/CategoryPage';
import { getCategoryPage } from '@/lib/catalogSeo.functions';
import { categoryPath } from '@/lib/seo/slug';
import { ListingRouteError, ListingRouteNotFound } from '@/components/retail/listing';

const readPage = (value: unknown) => Math.max(1, Math.min(500, Number((value as { page?: unknown })?.page) || 1));

export const Route = createFileRoute('/category/$top/$sub')({
  validateSearch: (search) => ({ page: readPage(search) }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ params, deps }) => {
    const data = await getCategoryPage({ data: { top: params.top, sub: params.sub, page: deps.page - 1 } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: 'Category not found — Tejaraa Shop' }, { name: 'robots', content: 'noindex' }] };
    }
    const name = categoryHeading(loaderData);
    const title = `${name} — Shop on Tejaraa Saudi Arabia`.slice(0, 95);
    const description = categoryIntro(loaderData).slice(0, 158);
    const path = categoryPath(loaderData.top, loaderData.sub);
    const url = `https://tejaraa.com${path}`;
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      links: [
        { rel: 'canonical', href: url },
        { rel: 'alternate', hrefLang: 'en-sa', href: url },
        { rel: 'alternate', hrefLang: 'ar-sa', href: `https://tejaraa.com/ar${path}` },
        { rel: 'alternate', hrefLang: 'x-default', href: url },
      ],
      scripts: [{ type: 'application/ld+json', children: JSON.stringify(categoryJsonLd(loaderData)) }],
    };
  },
  errorComponent: ListingRouteError,
  notFoundComponent: ListingRouteNotFound,
  component: RouteComponent,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  const { page } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <CategoryPage data={data} page={page} onPageChange={(next) => { void navigate({ search: { page: next }, replace: false }); document.getElementById('listing-results')?.scrollIntoView({ behavior: 'smooth' }); }} />;
}
