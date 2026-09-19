import { createFileRoute } from '@tanstack/react-router';
import Partners from '@/pages/Partners';
import { SUPPLIER_ORIGIN } from '@/lib/siteHosts';

const title = 'Become a Tejaraa Supplier — Wholesale & Distribution Partnerships';
const description = 'Supply Tejaraa as a manufacturer, distributor, wholesaler or importer. See who can supply, the categories we review, what we look for and how to apply.';

export const Route = createFileRoute('/partners/')({
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: `${SUPPLIER_ORIGIN}/partners` },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: `${SUPPLIER_ORIGIN}/partners` }],
  }),
  component: Partners,
});
