import { createFileRoute } from '@tanstack/react-router';
import Selling from '@/pages/Selling';

const title = 'Tejaraa Seller Services — Sourcing, Dropshipping & Fulfilment';
const description = 'E-commerce seller services in Saudi Arabia: product hunting, product sourcing, dropshipping, order fulfilment, warehousing and sales-channel support in one place.';

export const Route = createFileRoute('/selling/')({
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: 'https://tejaraa01.lovable.app/selling' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: 'https://tejaraa01.lovable.app/selling' }],
  }),
  component: Selling,
});