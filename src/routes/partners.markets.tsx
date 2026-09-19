import { createFileRoute } from '@tanstack/react-router';
import { SUPPLIER_ORIGIN } from '@/lib/siteHosts';
import { SupplierContentPage } from '@/components/supplier/common/SupplierContentPage';
import { SupplierHeroPanel } from '@/components/supplier/common/SupplierPageHero';
import { SupplierMarketSections } from '@/components/supplier/sections';
import { supplierApplyRoute } from '@/data/supplierPages';

const title = 'Markets & Sales Channels | Tejaraa Suppliers';
const description =
  'Where approved supplier products may be offered: the Tejaraa storefront, e-commerce sellers we supply and business buyers across Saudi Arabia and the wider Gulf.';
const url = `${SUPPLIER_ORIGIN}/partners/markets`;

export const Route = createFileRoute('/partners/markets')({
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
  component: SupplierMarketsPage,
});

function SupplierMarketsPage() {
  return (
    <SupplierContentPage
      crumbs={[{ label: 'Markets & Channels' }]}
      currentPath="/partners/markets"
      eyebrow="Markets and channels"
      title="Markets and sales channels"
      intro="Where products from approved suppliers may be offered, and the regions our supplier partnerships cover today."
      primary={{ label: 'Become a Supplier', to: supplierApplyRoute }}
      secondary={{ label: 'Supply models', to: '/partners/supply-models' }}
      visual={
        <SupplierHeroPanel
          title="Channels"
          items={[
            'Tejaraa Shop retail customers',
            'E-commerce sellers we supply',
            'Business buyers in supported markets',
          ]}
        />
      }
    >
      <SupplierMarketSections />
    </SupplierContentPage>
  );
}
