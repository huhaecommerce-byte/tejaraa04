import { createFileRoute } from '@tanstack/react-router';
import { SellerServicePage } from '@/components/seller/service';
import { servicePageBySlug } from '@/data/sellerServicePages';
import { en } from '@/i18n/dictionary';

const config = servicePageBySlug['warehousing']!;
const base = 'https://tejaraa01.lovable.app';

export const Route = createFileRoute('/selling/warehousing')({
  head: () => ({
    meta: [
      { title: en[config.seo.title] },
      { name: 'description', content: en[config.seo.description] },
      { property: 'og:title', content: en[config.seo.title] },
      { property: 'og:description', content: en[config.seo.description] },
      { property: 'og:url', content: `${base}${config.path}` },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: `${base}${config.path}` }],
  }),
  component: () => <SellerServicePage config={config} />,
});
