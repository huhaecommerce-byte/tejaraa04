import { createFileRoute } from '@tanstack/react-router';
import Contact from '@/pages/Contact';

const title = 'Contact Tejaraa Wholesale & Supplier Team';
const description =
  'Reach the Tejaraa wholesale team about supplying products, catalogue onboarding, payouts and distribution across Saudi Arabia and the GCC.';
const url = 'https://tejaraa01.lovable.app/partners/contact';

export const Route = createFileRoute('/partners/contact')({
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
  component: () => <Contact audience="partners" />,
});
