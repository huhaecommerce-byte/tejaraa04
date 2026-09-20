import { createFileRoute } from '@tanstack/react-router';
import { useLocale } from '@/i18n/LocaleProvider';
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
  const { t } = useLocale();
  return (
    <SupplierContentPage
      crumbs={[{ label: t('supplier.pages.crumbs.requirements') }]}
      currentPath="/partners/requirements"
      eyebrow={t('supplier.pages.requirements.eyebrow')}
      title={t('supplier.pages.requirements.heading')}
      intro={t('supplier.pages.requirements.intro')}
      primary={{ label: t('supplier.pages.becomeSupplier'), to: supplierApplyRoute }}
      secondary={{ label: t('supplier.pages.howItWorksLink'), to: '/partners/how-it-works' }}
      visual={
        <SupplierHeroPanel
          title={t('supplier.pages.requirements.visualTitle')}
          items={[
            t('supplier.pages.requirements.visual1'),
            t('supplier.pages.requirements.visual2'),
            t('supplier.pages.requirements.visual3'),
            t('supplier.pages.requirements.visual4'),
          ]}
        />
      }
    >
      <SupplierRequirementGroups />
    </SupplierContentPage>
  );
}
