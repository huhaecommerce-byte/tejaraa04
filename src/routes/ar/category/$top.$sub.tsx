import { createFileRoute, notFound } from '@tanstack/react-router';
import CategoryPage, { categoryHeading, categoryIntro, categoryJsonLd } from '@/pages/CategoryPage';
import { getCategoryPage } from '@/lib/catalogSeo.functions';
import { categoryPath } from '@/lib/seo/slug';

export const Route = createFileRoute('/ar/category/$top/$sub')({
  loader: async ({ params }) => {
    const data = await getCategoryPage({ data: { top: params.top, sub: params.sub } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: 'الفئة غير موجودة — تجارة' }, { name: 'robots', content: 'noindex' }] };
    }
    const name = categoryHeading(loaderData);
    const title = `${name} — توريد المنتجات والتخزين والشحن والدروبشيبينغ في السعودية | تجارة`.slice(0, 95);
    const description = categoryIntro(loaderData, 'ar').slice(0, 158);
    const path = categoryPath(loaderData.top, loaderData.sub);
    const url = `https://tejaraa.com/ar${path}`;
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        { property: 'og:locale', content: 'ar_SA' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      links: [
        { rel: 'canonical', href: url },
        { rel: 'alternate', hrefLang: 'ar-sa', href: url },
        { rel: 'alternate', hrefLang: 'en-sa', href: `https://tejaraa.com${path}` },
        { rel: 'alternate', hrefLang: 'x-default', href: `https://tejaraa.com${path}` },
      ],
      scripts: [{ type: 'application/ld+json', children: JSON.stringify(categoryJsonLd(loaderData, 'ar')) }],
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <CategoryPage data={data} locale="ar" />;
}
