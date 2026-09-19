import { createFileRoute, redirect } from '@tanstack/react-router';
import ProductDetail from '@/pages/ProductDetail';
import { getProductSeo } from '@/lib/catalogSeo.functions';
import { categoryPath, isUuid } from '@/lib/seo/slug';
import { cleanProductText, offerMerchantExtras, reviewJsonLd } from '@/lib/seo/productJsonLd';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';
import { RetailContainer } from '@/components/retail/common';
import { ProductDetailSkeleton } from '@/components/retail/product';

export function productSeo(p: {
  name: string;
  description: string | null;
  top_category: string;
  sub_category: string;
  price_sar: number;
}) {
  const title = `${p.name} — Tejaraa`.slice(0, 95);
  const plain = cleanProductText(p.description);
  const description = (
    plain.length > 60
      ? plain
      : `${p.name} — ${p.sub_category || p.top_category} at ${Number(p.price_sar || 0).toFixed(2)} SAR. Fast delivery across Saudi Arabia, secure payment and cash on delivery from Tejaraa.`
  ).slice(0, 158);
  return { title, description };
}

export const Route = createFileRoute('/product/$id')({
  loader: async ({ params }) => {
    const product = await getProductSeo({ data: { handle: params.id } });
    // Permanent redirect from the legacy UUID URL to the keyword-rich slug URL.
    if (product?.slug && isUuid(params.id)) {
      throw redirect({ to: '/product/$id', params: { id: product.slug }, statusCode: 301 });
    }
    return product;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: 'Product unavailable — Tejaraa Shop' },
          { name: 'description', content: 'This Tejaraa Shop product is no longer available. Continue shopping to discover other products.' },
          { property: 'og:title', content: 'Product unavailable — Tejaraa Shop' },
          { property: 'og:description', content: 'This product is no longer available. Discover other products in Tejaraa Shop.' },
          { property: 'og:type', content: 'website' },
          { name: 'twitter:card', content: 'summary' },
          { name: 'robots', content: 'noindex, follow' },
        ],
      };
    }
    const p = loaderData;
    const { title, description } = productSeo(p);
    const path = `/product/${p.slug || p.id}`;
    const url = `https://tejaraa.com${path}`;
    const image = p.images?.[0];

    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Product',
          name: p.name,
          image: p.images?.length ? p.images.slice(0, 5) : undefined,
          description,
          sku: p.sku,
          category: [p.top_category, p.sub_category, p.detailed_category].filter(Boolean).join(' > '),
          brand: { '@type': 'Brand', name: 'Tejaraa.com' },
          ...reviewJsonLd(p.rating_avg, p.review_count, p.top_reviews),
          offers: {
            '@type': 'Offer',
            priceCurrency: 'SAR',
            price: Number(p.price_sar || 0).toFixed(2),
            availability:
              (p.stock_qty ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
            url,
            ...offerMerchantExtras(),
          },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tejaraa.com/' },
            { '@type': 'ListItem', position: 2, name: 'Catalog', item: 'https://tejaraa.com/catalog' },
            {
              '@type': 'ListItem',
              position: 3,
              name: p.top_category,
              item: `https://tejaraa.com${categoryPath(p.top_category)}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: p.sub_category,
              item: `https://tejaraa.com${categoryPath(p.top_category, p.sub_category)}`,
            },
            { '@type': 'ListItem', position: 5, name: p.name, item: url },
          ],
        },
      ],
    };

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        { property: 'og:type', content: 'product' },
        ...(image ? [{ property: 'og:image', content: image }] : []),
        { name: 'twitter:card', content: 'summary_large_image' },
        ...(image ? [{ name: 'twitter:image', content: image }] : []),
      ],
      links: [
        { rel: 'canonical', href: url },
        { rel: 'alternate', hrefLang: 'en-sa', href: url },
        { rel: 'alternate', hrefLang: 'ar-sa', href: `https://tejaraa.com/ar${path}` },
        { rel: 'alternate', hrefLang: 'x-default', href: url },
      ],
      scripts: [{ type: 'application/ld+json', children: JSON.stringify(jsonLd) }],
    };
  },
  pendingComponent: ProductPending,
  component: RouteComponent,
});

function ProductPending() {
  return <RetailPublicShell><RetailContainer><ProductDetailSkeleton /></RetailContainer></RetailPublicShell>;
}

function RouteComponent() {
  const product = Route.useLoaderData();
  return <ProductDetail initialProduct={product} />;
}
