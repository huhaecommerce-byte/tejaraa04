import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Link, useLocation } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { RetailContainer } from '@/components/retail/common/RetailContainer';
import { SellerPlatformSwitcher } from '@/components/seller/shell/SellerPlatformSwitcher';
import { LanguageToggle } from '@/components/LanguageToggle';
import { agencyNavLinks } from '@/data/agencyProgramme';
import { cn } from '@/lib/utils';
import { useLocale } from '@/i18n/LocaleProvider';

export function AgencyHeader() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-retail-border bg-retail-card font-sans">
      <div className="bg-retail-dark-green text-primary-foreground">
        <RetailContainer className="flex h-11 w-full items-center justify-between gap-3 text-xs">
          <SellerPlatformSwitcher current="agencies" />
          <LanguageToggle arabicTo="/ar/agency" />
        </RetailContainer>
      </div>

      <RetailContainer className="flex h-16 items-center gap-4">
        <Link to="/agency" aria-label={t('agency.header.homeAria')} className="flex shrink-0 items-center gap-2">
          <BrandLogo variant="storefront" />
          <span className="hidden text-xs font-bold uppercase tracking-[0.16em] text-retail-medium-green sm:inline">
            {t('agency.header.badge')}
          </span>
        </Link>

        <nav aria-label={t('agency.header.navAria')} className="ml-2 hidden items-center gap-1 lg:flex">
          {agencyNavLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-retail-light-green hover:text-retail-dark-green',
                  active ? 'bg-retail-light-green text-retail-dark-green' : 'text-retail-text',
                )}
              >
                {t(link.key)}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="outline" className="hidden border-retail-border font-semibold text-retail-dark-green sm:inline-flex">
            <Link to="/agency/signin">{t('agency.header.partnerSignIn')}</Link>
          </Button>
          <Button asChild className="bg-retail-green font-semibold text-primary-foreground hover:bg-retail-dark-green">
            <Link to="/agency/apply">{t('agency.header.applyToJoin')}</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t('agency.header.openMenu')} className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>{t('agency.header.sheetTitle')}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid gap-1">
                {agencyNavLinks.map((link) => (
                  <SheetClose asChild key={link.to}>
                    <Link to={link.to} className="rounded-md px-3 py-2 text-sm font-semibold text-retail-dark-green hover:bg-retail-light-green">
                      {t(link.key)}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link to="/agency/signin" className="rounded-md px-3 py-2 text-sm font-semibold text-retail-dark-green hover:bg-retail-light-green">
                    Partner sign in
                  </Link>
                </SheetClose>
              </div>
              <div className="mt-6 border-t pt-4">
                <SellerPlatformSwitcher current="agencies" layout="stacked" onDark={false} onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </RetailContainer>
    </header>
  );
}
