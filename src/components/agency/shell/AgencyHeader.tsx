import { Link, useLocation } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { RetailContainer } from '@/components/retail/common/RetailContainer';
import { SellerPlatformSwitcher } from '@/components/seller/shell/SellerPlatformSwitcher';
import { LanguageToggle } from '@/components/LanguageToggle';
import { MobileNavDrawer } from '@/components/shell/MobileNavDrawer';
import { agencyNavLinks } from '@/data/agencyProgramme';
import { cn } from '@/lib/utils';
import { useLocale } from '@/i18n/LocaleProvider';

export function AgencyHeader() {
  const location = useLocation();
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-retail-border bg-retail-card font-sans">
      <div className="bg-retail-dark-green text-primary-foreground">
        <RetailContainer className="flex h-11 w-full items-center justify-between gap-3 text-xs">
          <SellerPlatformSwitcher current="agencies" />
          <LanguageToggle arabicTo="/ar/agency" />
        </RetailContainer>
      </div>

      <RetailContainer className="relative flex h-16 items-center gap-2 sm:gap-4">
        <MobileNavDrawer
          current="agencies"
          title={t('agency.header.sheetTitle')}
          description={t('agency.header.badge')}
          triggerLabel={t('agency.header.openMenu')}
          groups={[{ items: agencyNavLinks.map((link) => ({ label: t(link.key), to: link.to })) }]}
          actions={[
            { label: t('agency.header.applyToJoin'), to: '/agency/apply' },
            { label: t('agency.header.partnerSignIn'), to: '/agency/signin', variant: 'outline' },
          ]}
        />

        <Link to="/agency" aria-label={t('agency.header.homeAria')} className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 lg:static lg:translate-x-0 lg:translate-y-0">
          <BrandLogo variant="storefront" className="h-10 lg:h-12" />
          <span className="hidden text-xs font-bold uppercase tracking-[0.16em] text-retail-medium-green lg:inline">
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

        <div className="ms-auto flex shrink-0 items-center gap-2">
          <Button asChild variant="outline" className="hidden border-retail-border font-semibold text-retail-dark-green sm:inline-flex">
            <Link to="/agency/signin">{t('agency.header.partnerSignIn')}</Link>
          </Button>
          <Button asChild className="bg-retail-green font-semibold text-primary-foreground hover:bg-retail-dark-green">
            <Link to="/agency/apply">{t('agency.header.applyToJoin')}</Link>
          </Button>
        </div>
      </RetailContainer>
    </header>
  );
}
