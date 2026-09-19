import { createFileRoute } from '@tanstack/react-router';
import { SUPPLIER_ORIGIN } from '@/lib/siteHosts';
import { SupplierContentPage } from '@/components/supplier/common/SupplierContentPage';
import { SupplierHeroPanel } from '@/components/supplier/common/SupplierPageHero';
import { SupplierRequirementGroups } from '@/components/supplier/sections';
import { supplierApplyRoute } from '@/data/supplierPages';

const title = 'Supplier Requirements | Tejaraa Suppliers';
const description =
  'What Tejaraa asks suppliers for: company registration and ID, documents where they apply, product and catalogue information, commercial details and operational capability.';
const url = `${SUPPLIER_ORIGIN}/partners/requirements`;

export const Route = createFileRoute('/partners/requirements')({
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
  component: SupplierRequirementsPage,
});

function SupplierRequirementsPage() {
  return (
    <SupplierContentPage
      crumbs={[{ label: 'Requirements' }]}
      currentPath="/partners/requirements"
      eyebrow="What we look for"
      title="Supplier requirements"
      intro="Everything we ask for, and when. Nothing here is a hidden condition — documents and commercial details are requested at the stage they are needed."
      primary={{ label: 'Become a Supplier', to: supplierApplyRoute }}
      secondary={{ label: 'How it works', to: '/partners/how-it-works' }}
      visual={
        <SupplierHeroPanel
          title="Have these ready"
          items={[
            'Trade licence or company registration',
            'Owner or authorised person ID',
            'Product list or catalogue link',
            'Warehouse city and address',
          ]}
        />
      }
    >
      <SupplierRequirementGroups />
    </SupplierContentPage>
  );
}
