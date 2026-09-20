import { createFileRoute } from '@tanstack/react-router';
import { useLocale } from '@/i18n/LocaleProvider';
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
  const { t } = useLocale();
  return (
    <SupplierContentPage
      crumbs={[{ label: t('supplier.pages.crumbs.markets') }]}
      currentPath="/partners/markets"
      eyebrow={t('supplier.pages.markets.eyebrow')}
      title={t('supplier.pages.markets.heading')}
      intro={t('supplier.pages.markets.intro')}
      primary={{ label: t('supplier.pages.becomeSupplier'), to: supplierApplyRoute }}
      secondary={{ label: t('supplier.pages.supplyModelsLink'), to: '/partners/supply-models' }}
      visual={
        <SupplierHeroPanel
          title={t('supplier.pages.markets.visualTitle')}
          items={[
            t('supplier.pages.markets.visual1'),
            t('supplier.pages.markets.visual2'),
            t('supplier.pages.markets.visual3'),
          ]}
        />
      }
    >
      <SupplierMarketSections />
    </SupplierContentPage>
  );
}
