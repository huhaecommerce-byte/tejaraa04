import { useState } from 'react';
import { Link } from '@/lib/router-compat';
import { Menu } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { SellerPlatformSwitcher } from '@/components/seller/shell/SellerPlatformSwitcher';
import { LanguageToggle } from '@/components/LanguageToggle';
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
  const [open, setOpen] = useState(false);
  const linkClass =
    'rounded-md px-3 py-2 text-sm font-semibold text-retail-text transition-colors hover:bg-retail-light-green hover:text-retail-dark-green';
  const drawerClass =
    'rounded-md px-2.5 py-2.5 text-sm font-semibold text-retail-text hover:bg-retail-light-green hover:text-retail-dark-green';

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
        <SupplierContainer className="flex h-16 items-center gap-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t('supplier.header.openMenu')}>
                <Menu className="h-5 w-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[86vw] max-w-sm overflow-y-auto p-0">
              <SheetHeader className="border-b border-retail-border px-5 py-4 text-left">
                <SheetTitle className="text-retail-dark-green">{t('supplier.header.mobileTitle')}</SheetTitle>
                <SheetDescription className="text-retail-muted">
                  {t('supplier.header.mobileDescription')}
                </SheetDescription>
              </SheetHeader>

              <nav aria-label={t('supplier.header.sectionsAria')} className="grid gap-1 px-3 py-4">
                {sectionLinks.map((item) => (
                  <SheetClose asChild key={item.to}>
                    <Link to={item.to} className={drawerClass}>{item.label}</Link>
                  </SheetClose>
                ))}
              </nav>

              <div className="border-t border-retail-border px-3 py-4">
                <p className="px-2.5 pb-2 text-xs font-bold uppercase tracking-wider text-retail-muted">{t('supplier.header.platformsLabel')}</p>
                <SellerPlatformSwitcher
                  current="suppliers"
                  layout="stacked"
                  onDark={false}
                  onNavigate={() => setOpen(false)}
                />
              </div>

              <div className="border-t border-retail-border px-3 py-4">
                <SheetClose asChild>
                  <Link to={supplierSignInPath} className={`block ${drawerClass}`}>{t('supplier.header.signIn')}</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/partners/contact" className={`block ${drawerClass}`}>{t('supplier.header.talkToUs')}</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to={supplierApplyPath} className={`block ${drawerClass}`}>{t('supplier.header.becomeSupplier')}</Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/partners" aria-label={t('supplier.header.homeAria')} className="shrink-0">
            <BrandLogo variant="storefront" />
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
