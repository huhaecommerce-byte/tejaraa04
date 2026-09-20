import { createFileRoute } from '@tanstack/react-router';
import { useLocale } from '@/i18n/LocaleProvider';
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
  const { t } = useLocale();
  return (
    <SupplierContentPage
      crumbs={[{ label: t('supplier.pages.crumbs.supplyModels') }]}
      currentPath="/partners/supply-models"
      eyebrow={t('supplier.pages.supplyModels.eyebrow')}
      title={t('supplier.pages.supplyModels.heading')}
      intro={t('supplier.pages.supplyModels.intro')}
      primary={{ label: t('supplier.pages.becomeSupplier'), to: supplierApplyRoute }}
      secondary={{ label: t('supplier.pages.viewCategories'), to: '/partners/categories' }}
      visual={
        <SupplierHeroPanel
          title={t('supplier.pages.supplyModels.visualTitle')}
          items={[
            t('supplier.pages.supplyModels.visual1'),
            t('supplier.pages.supplyModels.visual2'),
            t('supplier.pages.supplyModels.visual3'),
            t('supplier.pages.supplyModels.visual4'),
          ]}
        />
      }
    >
      <SupplyModelSections />
    </SupplierContentPage>
  );
}
