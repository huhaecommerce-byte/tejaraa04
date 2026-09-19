import { createFileRoute } from '@tanstack/react-router';
import Index from '@/pages/Index';

const title = 'تجارة | تسوق المنتجات أونلاين في السعودية';
const description =
  'تسوق منتجات المنزل والتقنية والأزياء والعناية مع توصيل داخل السعودية وأسعار واضحة بالريال السعودي عبر تجارة.';

export const Route = createFileRoute('/ar/')({
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: 'https://tejaraa.com/ar' },
      { property: 'og:locale', content: 'ar_SA' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [
      { rel: 'canonical', href: 'https://tejaraa.com/ar' },
      { rel: 'alternate', hrefLang: 'ar-sa', href: 'https://tejaraa.com/ar' },
      { rel: 'alternate', hrefLang: 'en-sa', href: 'https://tejaraa.com/' },
      { rel: 'alternate', hrefLang: 'x-default', href: 'https://tejaraa.com/' },
    ],
  }),
  component: ArabicHome,
});

function ArabicHome() {
  return <Index locale="ar" />;
}
