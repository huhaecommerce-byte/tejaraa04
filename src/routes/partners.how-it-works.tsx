import { createFileRoute } from '@tanstack/react-router';
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
  return (
    <SupplierContentPage
      crumbs={[{ label: 'How It Works' }]}
      currentPath="/partners/how-it-works"
      eyebrow="Supplier process"
      title="How supplier partnership works"
      intro="What happens from the moment you apply to the moment you supply orders — and what our team reviews at each stage."
      primary={{ label: 'Become a Supplier', to: supplierApplyRoute }}
      secondary={{ label: 'See requirements', to: '/partners/requirements' }}
      visual={
        <SupplierHeroPanel
          title="The short version"
          items={[
            'Apply with your company and product details',
            'Business and product review by our team',
            'Commercial terms agreed with your company',
            'Approved products onboarded and supplied',
          ]}
        />
      }
    >
      <SupplierJourneyDetail />
    </SupplierContentPage>
  );
}
