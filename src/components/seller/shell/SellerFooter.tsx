import { Link } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { CreditCard } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';
import type { TranslationKey } from '@/i18n/dictionary';

interface FooterGroup {
  title: TranslationKey;
  links: { label: TranslationKey; to?: string; href?: string }[];
}

const groups: FooterGroup[] = [
  {
    title: 'selling.footer.groupServices',
    links: [
      { label: 'selling.footer.linkProductHunting', to: '/selling/product-hunting' },
      { label: 'selling.footer.linkProductSourcing', to: '/selling/product-sourcing' },
      { label: 'selling.footer.linkDropshipping', to: '/selling/dropshipping' },
      { label: 'selling.footer.linkFulfilment', to: '/selling/fulfillment' },
      { label: 'selling.footer.linkWarehousing', to: '/selling/warehousing' },
      { label: 'selling.footer.linkPackaging', to: '/selling/packaging-labeling' },
      { label: 'selling.footer.linkMarketplacePrep', to: '/selling/marketplace-preparation' },
    ],
  },
  {
    title: 'selling.footer.groupResources',
    links: [
      { label: 'selling.footer.linkHowItWorks', to: '/selling/how-it-works' },
      { label: 'selling.footer.linkIntegrations', to: '/selling/integrations' },
      { label: 'selling.footer.linkGuides', to: '/blog' },
      { label: 'selling.footer.linkFaq', to: '/selling#faq' },
    ],
  },
  {
    title: 'selling.footer.groupCompany',
    links: [
      { label: 'selling.footer.linkContact', to: '/selling/contact' },
      { label: 'selling.footer.linkPricing', to: '/pricing' },
      { label: 'selling.footer.linkCreateAccount', to: '/selling/signup' },
      { label: 'selling.footer.linkSignIn', to: '/login' },
    ],
  },
  {
    title: 'selling.footer.groupPlatforms',
    links: [
      { label: 'selling.footer.linkShop', to: '/' },
      { label: 'selling.footer.linkSellingPlatform', to: '/selling' },
      { label: 'selling.footer.linkPartners', to: '/partners' },
    ],
  },
];

function FooterLinks({ group }: { group: FooterGroup }) {
  const { t } = useLocale();
  return (
    <nav aria-label={t(group.title)} className="space-y-2">
      {group.links.map((link) =>
        link.to ? (
          <Link
            key={link.label}
            to={link.to}
            className="block py-1 text-sm text-retail-muted transition-colors hover:text-retail-green"
          >
            {t(link.label)}
          </Link>
        ) : (
          <a
            key={link.label}
            href={link.href}
            className="block py-1 text-sm text-retail-muted transition-colors hover:text-retail-green"
          >
            {t(link.label)}
          </a>
        ),
      )}
    </nav>
  );
}

export function SellerFooter() {
  const { t, dir } = useLocale();
  return (
    <footer dir={dir} className="mt-auto border-t border-retail-border bg-retail-card">
      <SellerContainer className="py-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_2.4fr]">
          <div className="min-w-0">
            <Link to="/selling" aria-label={t('selling.footer.homeAria')} className="inline-block">
              <BrandLogo variant="storefront" className="max-w-[180px]" />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-retail-muted">
              {t('selling.footer.tagline')}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-retail-dark-green">
              <span className="text-retail-muted">{t('selling.footer.language')}</span>
              <Link to="/" className="rounded border border-retail-border px-2 py-1 hover:border-retail-green hover:text-retail-green">
                {t('selling.footer.english')}
              </Link>
              <Link to="/ar" className="rounded border border-retail-border px-2 py-1 hover:border-retail-green hover:text-retail-green">
                {t('selling.footer.arabic')}
              </Link>
            </div>
          </div>

          {/* Desktop / tablet columns */}
          <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {groups.map((group) => (
              <div key={group.title} className="min-w-0">
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-retail-text">
                  {t(group.title)}
                </h2>
                <FooterLinks group={group} />
              </div>
            ))}
          </div>

          {/* Mobile accordions */}
          <div className="divide-y divide-retail-border border-y border-retail-border sm:hidden">
            {groups.map((group) => (
              <details key={group.title} className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between py-2 text-sm font-bold text-retail-text">
                  {t(group.title)}
                  <span aria-hidden="true" className="text-retail-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="pb-2">
                  <FooterLinks group={group} />
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-retail-border pt-4 text-xs text-retail-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{t('selling.footer.copyright')}</p>
          <p className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-retail-green" aria-hidden="true" />
            {t('selling.footer.pricingNote')}
          </p>
        </div>
      </SellerContainer>
    </footer>
  );
}
