import { createFileRoute } from '@tanstack/react-router';
import { useLocale } from '@/i18n/LocaleProvider';
import { SUPPLIER_ORIGIN } from '@/lib/siteHosts';
import { SupplierContentPage } from '@/components/supplier/common/SupplierContentPage';
import { SupplierHeroPanel } from '@/components/supplier/common/SupplierPageHero';
import { SupplierCategoryDetail } from '@/components/supplier/sections';
import { supplierApplyRoute } from '@/data/supplierPages';

const title = 'Categories We Source | Tejaraa Suppliers';
const description =
  'Product categories Tejaraa reviews from suppliers: electronics, mobile accessories, home and kitchen, health and beauty, fashion accessories, automotive, food and packaging.';
const url = `${SUPPLIER_ORIGIN}/partners/categories`;

export const Route = createFileRoute('/partners/categories')({
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
  component: SupplierCategoriesPage,
});

function SupplierCategoriesPage() {
  const { t } = useLocale();
  return (
    <SupplierContentPage
      crumbs={[{ label: t('supplier.pages.crumbs.categories') }]}
      currentPath="/partners/categories"
      eyebrow={t('supplier.pages.categories.eyebrow')}
      title={t('supplier.pages.categories.heading')}
      intro={t('supplier.pages.categories.intro')}
      primary={{ label: t('supplier.pages.becomeSupplier'), to: supplierApplyRoute }}
      secondary={{ label: t('supplier.pages.seeRequirements'), to: '/partners/requirements' }}
      visual={
        <SupplierHeroPanel
          title={t('supplier.pages.categories.visualTitle')}
          items={[
            t('supplier.pages.categories.visual1'),
            t('supplier.pages.categories.visual2'),
            t('supplier.pages.categories.visual3'),
          ]}
        />
      }
    >
      <SupplierCategoryDetail />
    </SupplierContentPage>
  );
}
