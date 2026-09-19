import { createFileRoute } from '@tanstack/react-router';
import Contact from '@/pages/Contact';

const title = 'Contact Tejaraa Seller Services — Dropshipping & Fulfilment Support';
const description =
  'Talk to the Tejaraa seller team about dropshipping, product sourcing, warehousing and marketplace fulfilment in Saudi Arabia.';
const url = 'https://tejaraa01.lovable.app/selling/contact';

export const Route = createFileRoute('/selling/contact')({
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: url }],
  }),
  component: () => <Contact audience="selling" />,
});
