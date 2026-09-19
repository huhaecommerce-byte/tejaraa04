import { createFileRoute } from '@tanstack/react-router';
import SellerHowItWorksPage from '@/pages/seller/SellerHowItWorksPage';

const title = 'How Selling with Tejaraa Works — Seller Journey';
const description =
  'The complete seller journey with Tejaraa: choose dropshipping, product sourcing or fulfilment, connect your sales channel, sell, and have orders fulfilled in Saudi Arabia.';
const url = 'https://tejaraa01.lovable.app/selling/how-it-works';

export const Route = createFileRoute('/selling/how-it-works')({
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
  component: SellerHowItWorksPage,
});
