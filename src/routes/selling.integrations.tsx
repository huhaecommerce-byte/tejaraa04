import { createFileRoute } from '@tanstack/react-router';
import SellerIntegrationsPage from '@/pages/seller/SellerIntegrationsPage';

const title = 'E-Commerce Integrations for Sellers — Tejaraa Seller Services';
const description =
  'Register your Shopify, WooCommerce, Amazon or Noon selling channel with Tejaraa and send orders for sourcing, preparation and fulfilment in Saudi Arabia.';
const url = 'https://tejaraa01.lovable.app/selling/integrations';

export const Route = createFileRoute('/selling/integrations')({
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
  component: SellerIntegrationsPage,
});
