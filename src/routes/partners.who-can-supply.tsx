import { createFileRoute } from '@tanstack/react-router';
import { SUPPLIER_ORIGIN } from '@/lib/siteHosts';
import { SupplierContentPage } from '@/components/supplier/common/SupplierContentPage';
import { SupplierHeroPanel } from '@/components/supplier/common/SupplierPageHero';
import { SupplierTypeSections } from '@/components/supplier/sections';
import { supplierApplyRoute } from '@/data/supplierPages';

const title = 'Who Can Supply Tejaraa | Suppliers & Distributors';
const description =
  'Manufacturers, authorised distributors, wholesalers, importers, brand owners and individual traders can apply to supply Tejaraa. See what each supplier type is best suited to.';
const url = `${SUPPLIER_ORIGIN}/partners/who-can-supply`;

export const Route = createFileRoute('/partners/who-can-supply')({
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
  component: WhoCanSupplyPage,
});

function WhoCanSupplyPage() {
  return (
    <SupplierContentPage
      crumbs={[{ label: 'Who Can Supply' }]}
      currentPath="/partners/who-can-supply"
      eyebrow="Eligibility"
      title="Who can supply Tejaraa"
      intro="If you hold stock or produce goods in the categories we review, you can apply. Here is how we work with each type of supplier."
      primary={{ label: 'Become a Supplier', to: supplierApplyRoute }}
      secondary={{ label: 'See requirements', to: '/partners/requirements' }}
      visual={
        <SupplierHeroPanel
          title="Supplier types we consider"
          items={[
            'Manufacturers and brand owners',
            'Authorised distributors',
            'Wholesalers with multi-brand catalogues',
            'Importers and individual traders',
          ]}
        />
      }
    >
      <SupplierTypeSections />
    </SupplierContentPage>
  );
}
