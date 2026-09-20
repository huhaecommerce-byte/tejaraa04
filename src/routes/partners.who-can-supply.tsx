import { createFileRoute } from '@tanstack/react-router';
import { useLocale } from '@/i18n/LocaleProvider';
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
  const { t } = useLocale();
  return (
    <SupplierContentPage
      crumbs={[{ label: t('supplier.pages.crumbs.whoCanSupply') }]}
      currentPath="/partners/who-can-supply"
      eyebrow={t('supplier.pages.whoCanSupply.eyebrow')}
      title={t('supplier.pages.whoCanSupply.heading')}
      intro={t('supplier.pages.whoCanSupply.intro')}
      primary={{ label: t('supplier.pages.becomeSupplier'), to: supplierApplyRoute }}
      secondary={{ label: t('supplier.pages.seeRequirements'), to: '/partners/requirements' }}
      visual={
        <SupplierHeroPanel
          title={t('supplier.pages.whoCanSupply.visualTitle')}
          items={[
            t('supplier.pages.whoCanSupply.visual1'),
            t('supplier.pages.whoCanSupply.visual2'),
            t('supplier.pages.whoCanSupply.visual3'),
            t('supplier.pages.whoCanSupply.visual4'),
          ]}
        />
      }
    >
      <SupplierTypeSections />
    </SupplierContentPage>
  );
}
