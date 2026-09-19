import { createFileRoute } from '@tanstack/react-router';
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
  return (
    <SupplierContentPage
      crumbs={[{ label: 'Categories' }]}
      currentPath="/partners/categories"
      eyebrow="Categories of interest"
      title="Categories we source"
      intro="Which types of products can you offer Tejaraa? These are the categories our team reviews today, with examples of the product types that fit."
      primary={{ label: 'Become a Supplier', to: supplierApplyRoute }}
      secondary={{ label: 'See requirements', to: '/partners/requirements' }}
      visual={
        <SupplierHeroPanel
          title="Good to know"
          items={[
            'Pick the categories you supply in the application',
            'Multi-category suppliers can select more than one',
            'Close to a category? Send it in for review',
          ]}
        />
      }
    >
      <SupplierCategoryDetail />
    </SupplierContentPage>
  );
}
