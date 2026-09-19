import { createFileRoute } from '@tanstack/react-router';
import { SellerServicePage } from '@/components/seller/service';
import { servicePageBySlug } from '@/data/sellerServicePages';

const config = servicePageBySlug['fulfillment']!;
const base = 'https://tejaraa01.lovable.app';

export const Route = createFileRoute('/selling/fulfillment')({
  head: () => ({
    meta: [
      { title: config.seo.title },
      { name: 'description', content: config.seo.description },
      { property: 'og:title', content: config.seo.title },
      { property: 'og:description', content: config.seo.description },
      { property: 'og:url', content: `${base}${config.path}` },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: `${base}${config.path}` }],
  }),
  component: () => <SellerServicePage config={config} />,
});
