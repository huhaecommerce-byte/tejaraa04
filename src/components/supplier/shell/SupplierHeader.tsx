import { Link } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { SellerPlatformSwitcher } from '@/components/seller/shell/SellerPlatformSwitcher';
import { LanguageToggle } from '@/components/LanguageToggle';
import { MobileNavDrawer } from '@/components/shell/MobileNavDrawer';
import { useLocale } from '@/i18n/LocaleProvider';
import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { supplierApplyPath, supplierSignInPath } from '@/data/supplierPartners';

function useSectionLinks() {
  const { t } = useLocale();
  return [
    { label: t('supplier.header.whyTejaraa'), to: '/partners#why-tejaraa' },
    { label: t('supplier.header.whoCanSupply'), to: '/partners/who-can-supply' },
    { label: t('supplier.header.howItWorks'), to: '/partners/how-it-works' },
    { label: t('supplier.header.supplyModels'), to: '/partners/supply-models' },
    { label: t('supplier.header.categories'), to: '/partners/categories' },
    { label: t('supplier.header.requirements'), to: '/partners/requirements' },
    { label: t('supplier.header.markets'), to: '/partners/markets' },
  ];
}

export function SupplierHeader() {
  const { t } = useLocale();
  const sectionLinks = useSectionLinks();
  const linkClass =
    'rounded-md px-3 py-2 text-sm font-semibold text-retail-text transition-colors hover:bg-retail-light-green hover:text-retail-dark-green';

  return (
    <header className="sticky top-0 z-40">
      {/* ROW 1 — platform switcher / utility */}
      <div className="bg-retail-dark-green text-white">
        <SupplierContainer className="flex h-11 items-center justify-between gap-3">
          <SellerPlatformSwitcher current="suppliers" />
          <LanguageToggle />
        </SupplierContainer>
      </div>

      {/* ROW 2 — supplier navigation */}
      <div className="relative z-20 border-b border-retail-border bg-white/95 backdrop-blur">
        <SupplierContainer className="relative flex h-16 items-center gap-4">
          <MobileNavDrawer
            current="suppliers"
            title={t('supplier.header.mobileTitle')}
            description={t('supplier.header.mobileDescription')}
            triggerLabel={t('supplier.header.openMenu')}
            groups={[{ items: sectionLinks.map((item) => ({ label: item.label, to: item.to })) }, {
              items: [{ label: t('supplier.header.talkToUs'), to: '/partners/contact' }],
            }]}
            actions={[
              { label: t('supplier.header.becomeSupplier'), to: supplierApplyPath },
              { label: t('supplier.header.signIn'), to: supplierSignInPath, variant: 'outline' },
            ]}
          />


          <Link to="/partners" aria-label={t('supplier.header.homeAria')} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:static lg:translate-x-0 lg:translate-y-0">
            <BrandLogo variant="storefront" className="h-10 lg:h-12" />
          </Link>

          <nav aria-label={t('supplier.header.navAria')} className="ml-2 hidden items-center gap-1 lg:flex">
            {sectionLinks.map((item) => (
              <Link key={item.to} to={item.to} className={linkClass}>{item.label}</Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" className="hidden border-retail-border font-semibold text-retail-dark-green sm:inline-flex">
              <Link to={supplierSignInPath}>{t('supplier.header.signIn')}</Link>
            </Button>
            <Button asChild className="bg-retail-green font-semibold text-white hover:bg-retail-dark-green">
              <Link to={supplierApplyPath}>
                <span className="hidden sm:inline">{t('supplier.header.becomeSupplier')}</span>
                <span className="sm:hidden">{t('supplier.header.apply')}</span>
              </Link>
            </Button>
          </div>
        </SupplierContainer>
      </div>
    </header>
  );
}
