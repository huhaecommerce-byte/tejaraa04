import { createFileRoute } from '@tanstack/react-router';
import { SUPPLIER_ORIGIN } from '@/lib/siteHosts';
import { SupplierContentPage } from '@/components/supplier/common/SupplierContentPage';
import { SupplierHeroPanel } from '@/components/supplier/common/SupplierPageHero';
import { SupplyModelSections } from '@/components/supplier/sections';
import { supplierApplyRoute } from '@/data/supplierPages';

const title = 'Supply Models for Tejaraa Suppliers | Wholesale & Distribution';
const description =
  'The ways Tejaraa works with suppliers: wholesale supply, distributor and brand supply, catalogue-based supply and purchase order supply under agreed terms.';
const url = `${SUPPLIER_ORIGIN}/partners/supply-models`;

export const Route = createFileRoute('/partners/supply-models')({
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
  component: SupplyModelsPage,
});

function SupplyModelsPage() {
  return (
    <SupplierContentPage
      crumbs={[{ label: 'Supply Models' }]}
      currentPath="/partners/supply-models"
      eyebrow="Ways to supply"
      title="Supply models"
      intro="There is more than one way to work with Tejaraa. Which one applies depends on your business, your products and what is agreed during review."
      primary={{ label: 'Become a Supplier', to: supplierApplyRoute }}
      secondary={{ label: 'View categories', to: '/partners/categories' }}
      visual={
        <SupplierHeroPanel
          title="Models in use"
          items={[
            'Wholesale supply on agreed terms',
            'Distributor and brand supply',
            'Catalogue-based supply for wide ranges',
            'Purchase order supply where applicable',
          ]}
        />
      }
    >
      <SupplyModelSections />
    </SupplierContentPage>
  );
}
