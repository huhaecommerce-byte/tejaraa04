import { createFileRoute, redirect } from '@tanstack/react-router';
import ProductDetail from '@/pages/ProductDetail';
import { getProductSeo } from '@/lib/catalogSeo.functions';
import { isUuid } from '@/lib/seo/slug';
import { cleanProductText, offerMerchantExtras, reviewJsonLd } from '@/lib/seo/productJsonLd';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';
import { RetailContainer } from '@/components/retail/common';
import { ProductDetailSkeleton } from '@/components/retail/product';

export const Route = createFileRoute('/ar/product/$id')({
  loader: async ({ params }) => {
    const product = await getProductSeo({ data: { handle: params.id } });
    const arHandle = product?.slug_ar || product?.slug;
    if (arHandle && (isUuid(params.id) || params.id !== arHandle)) {
      throw redirect({ to: '/ar/product/$id', params: { id: arHandle }, statusCode: 301 });
    }
    return product;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [
        { title: 'المنتج غير متاح — متجر تجارة' },
        { name: 'description', content: 'هذا المنتج لم يعد متاحاً. تصفح منتجات أخرى في متجر تجارة.' },
        { property: 'og:title', content: 'المنتج غير متاح — متجر تجارة' },
        { property: 'og:description', content: 'هذا المنتج لم يعد متاحاً. تصفح منتجات أخرى في متجر تجارة.' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'robots', content: 'noindex, follow' },
      ] };
    }
    const p = loaderData;
    const name = p.name_ar || p.name;
    const title = `${name} — توريد المنتجات والتخزين والشحن والدروبشيبينغ في السعودية | تجارة`.slice(0, 95);
    const description = (
      cleanProductText(p.description_ar) ||
      `${name} ضمن فئة ${p.sub_category || p.top_category} يبدأ من ${Number(p.price_sar || 0).toFixed(2)} ريال. توريد وتغليف وشحن منتجات بالجملة والدروبشيبينغ في السعودية. موردون مفحوصون، دعم SABER، التخزين والتوصيل لبائعي أمازون ونون مع تجارة.`
    ).slice(0, 158);
    const path = `/product/${p.slug || p.id}`;
    const arPathname = `/ar/product/${p.slug_ar || p.slug || p.id}`;
    const url = `https://tejaraa.com${arPathname}`;
    const image = p.images?.[0];


    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
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
        availability: (p.stock_qty ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
        url,
        ...offerMerchantExtras(),
      },
    };

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        { property: 'og:locale', content: 'ar_SA' },
        { property: 'og:type', content: 'product' },
        ...(image ? [{ property: 'og:image', content: image }] : []),
        { name: 'twitter:card', content: 'summary_large_image' },
        ...(image ? [{ name: 'twitter:image', content: image }] : []),
      ],
      links: [
        { rel: 'canonical', href: url },
        { rel: 'alternate', hrefLang: 'ar-sa', href: url },
        { rel: 'alternate', hrefLang: 'en-sa', href: `https://tejaraa.com${path}` },
        { rel: 'alternate', hrefLang: 'x-default', href: `https://tejaraa.com${path}` },
      ],
      scripts: [{ type: 'application/ld+json', children: JSON.stringify(jsonLd) }],
    };
  },
  pendingComponent: ProductPending,
  component: RouteComponent,
});

function ProductPending() {
  return <div dir="rtl"><RetailPublicShell><RetailContainer><ProductDetailSkeleton /></RetailContainer></RetailPublicShell></div>;
}

function RouteComponent() {
  const product = Route.useLoaderData();
  return (
    <div dir="rtl">
      <ProductDetail initialProduct={product} />
    </div>
  );
}
