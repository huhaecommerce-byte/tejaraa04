import { Link } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import { RetailContainer } from '@/components/retail/common/RetailContainer';
import { CreditCard, Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';
import type { TranslationKey } from '@/i18n/dictionary';

const trustItems: { icon: typeof Truck; title: TranslationKey; description: TranslationKey }[] = [
  { icon: Truck, title: 'shop.trust.deliveryTitle', description: 'shop.trust.deliveryDesc' },
  { icon: ShieldCheck, title: 'shop.trust.checkoutTitle', description: 'shop.trust.checkoutDesc' },
  { icon: RotateCcw, title: 'shop.trust.returnsTitle', description: 'shop.trust.returnsDesc' },
  { icon: Headphones, title: 'shop.trust.supportTitle', description: 'shop.trust.supportDesc' },
];

interface FooterGroup {
  title: TranslationKey;
  links: { label: TranslationKey; to: string }[];
}

const groups: FooterGroup[] = [
  {
    title: 'shop.footer.shop',
    links: [
      { label: 'shop.footer.allCategories', to: '/category' },
      { label: 'shop.footer.allProducts', to: '/catalog' },
      { label: 'shop.footer.readyToShip', to: '/catalog?source=local' },
      { label: 'shop.footer.searchProducts', to: '/search' },
    ],
  },
  {
    title: 'shop.footer.customerService',
    links: [
      { label: 'shop.footer.contactUs', to: '/contact' },
      { label: 'shop.footer.trackOrder', to: '/dropshipping/orders' },
      { label: 'shop.footer.returns', to: '/dropshipping/returns' },
      { label: 'shop.footer.yourCart', to: '/cart' },
    ],
  },
  {
    title: 'shop.footer.aboutTejaraa',
    links: [
      { label: 'shop.footer.ourServices', to: '/selling' },
      { label: 'shop.footer.guides', to: '/blog' },
      { label: 'shop.footer.wishlist', to: '/dropshipping/favourites' },
    ],
  },
  {
    title: 'shop.footer.forBusiness',
    links: [
      { label: 'shop.footer.sellerServices', to: '/selling' },
      { label: 'shop.footer.suppliers', to: '/partners' },
      { label: 'shop.footer.agencies', to: '/agency' },
      { label: 'shop.footer.pricing', to: '/pricing' },
    ],
  },
];

function FooterLinks({ group }: { group: FooterGroup }) {
  const { t } = useLocale();
  return (
    <nav aria-label={t(group.title)} className="space-y-2">
      {group.links.map((link) => (
        <Link
          key={link.label}
          to={link.to}
          className="block py-1 text-sm text-retail-muted transition-colors hover:text-retail-green"
        >
          {t(link.label)}
        </Link>
      ))}
    </nav>
  );
}

export function RetailFooter({ showTrustBar = true }: { showTrustBar?: boolean }) {
  const { t, locale, setLocale } = useLocale();
  const langButton =
    'rounded border border-retail-border px-2 py-1 hover:border-retail-green hover:text-retail-green';
  const langActive = 'border-retail-green text-retail-green';

  return (
    <footer className="mt-8 border-t border-retail-border bg-retail-card">
      {showTrustBar && (
        <div className="border-b border-retail-border bg-retail-light-green/50">
          <RetailContainer className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item) => (
              <div key={item.title} className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-retail-light-green">
                  <item.icon className="h-4.5 w-4.5 text-retail-green" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-retail-dark-green sm:text-sm">{t(item.title)}</p>
                  <p className="truncate text-xs text-retail-muted">{t(item.description)}</p>
                </div>
              </div>
            ))}
          </RetailContainer>
        </div>
      )}

      <RetailContainer className="py-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_2.4fr]">
          <div className="min-w-0">
            <Link to="/" aria-label={t('shop.homeAria')} className="inline-block">
              <BrandLogo variant="storefront" className="max-w-[180px]" />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-retail-muted">{t('shop.footer.blurb')}</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-retail-dark-green">
              <span className="text-retail-muted">{t('common.language')}</span>
              <button
                type="button"
                onClick={() => setLocale('en')}
                aria-pressed={locale === 'en'}
                className={`${langButton} ${locale === 'en' ? langActive : ''}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLocale('ar')}
                aria-pressed={locale === 'ar'}
                className={`${langButton} ${locale === 'ar' ? langActive : ''}`}
              >
                العربية
              </button>
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
          <p>{t('shop.footer.copyright')}</p>
          <p className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-retail-green" aria-hidden="true" />
            {t('shop.footer.payments')}
          </p>
        </div>
      </RetailContainer>
    </footer>
  );
}
