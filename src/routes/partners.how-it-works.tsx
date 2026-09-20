import { createFileRoute } from '@tanstack/react-router';
import { useLocale } from '@/i18n/LocaleProvider';
import { SUPPLIER_ORIGIN } from '@/lib/siteHosts';
import { SupplierContentPage } from '@/components/supplier/common/SupplierContentPage';
import { SupplierHeroPanel } from '@/components/supplier/common/SupplierPageHero';
import { SupplierJourneyDetail } from '@/components/supplier/sections';
import { supplierApplyRoute } from '@/data/supplierPages';

const title = 'How Supplier Partnership Works | Tejaraa Suppliers';
const description =
  'The Tejaraa supplier journey step by step: apply, business review, share your catalogue, product review, commercial discussion, approval, product onboarding and supply.';
const url = `${SUPPLIER_ORIGIN}/partners/how-it-works`;

export const Route = createFileRoute('/partners/how-it-works')({
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
  component: HowItWorksPage,
});

function HowItWorksPage() {
  const { t } = useLocale();
  return (
    <SupplierContentPage
      crumbs={[{ label: t('supplier.pages.crumbs.howItWorks') }]}
      currentPath="/partners/how-it-works"
      eyebrow={t('supplier.pages.howItWorks.eyebrow')}
      title={t('supplier.pages.howItWorks.heading')}
      intro={t('supplier.pages.howItWorks.intro')}
      primary={{ label: t('supplier.pages.becomeSupplier'), to: supplierApplyRoute }}
      secondary={{ label: t('supplier.pages.seeRequirements'), to: '/partners/requirements' }}
      visual={
        <SupplierHeroPanel
          title={t('supplier.pages.howItWorks.visualTitle')}
          items={[
            t('supplier.pages.howItWorks.visual1'),
            t('supplier.pages.howItWorks.visual2'),
            t('supplier.pages.howItWorks.visual3'),
            t('supplier.pages.howItWorks.visual4'),
          ]}
        />
      }
    >
      <SupplierJourneyDetail />
    </SupplierContentPage>
  );
}
