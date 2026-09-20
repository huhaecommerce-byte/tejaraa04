import { ExternalLink, Handshake } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerPlatformSwitcher } from '@/components/seller/shell/SellerPlatformSwitcher';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLocale } from '@/i18n/LocaleProvider';

/**
 * Agency portal header — mirrors SellerHeader's structure:
 * ROW 1 dark-green platform switcher strip, ROW 2 logo / portal identity row.
 */
export function AgencyPortalHeader() {
  const { t, dir } = useLocale();
  return (
    <header dir={dir}>
      {/* ROW 1 — platform switcher / utility */}
      <div className="bg-retail-dark-green text-white">
        <SellerContainer className="flex h-11 items-center justify-between gap-3">
          <SellerPlatformSwitcher />
          <LanguageToggle />
        </SellerContainer>
      </div>

      {/* ROW 2 — portal identity */}
      <div className="relative z-20 border-b border-retail-border bg-white/95 backdrop-blur">
        <SellerContainer className="flex h-16 items-center justify-between gap-4">
          <Link to="/agency/portal" className="flex min-w-0 items-center gap-3">
            <BrandLogo variant="storefront" />
            <span className="hidden h-7 w-px bg-retail-border sm:block" aria-hidden />
            <span className="hidden items-center gap-2 text-sm font-bold text-retail-dark-green sm:inline-flex">
              <Handshake className="h-4 w-4 text-retail-green" /> {t('agency.portalHeader.partnerPortal')}
            </span>
          </Link>
          <Button asChild variant="outline" size="sm" className="border-retail-border text-retail-dark-green">
            <Link to="/agency">{t('agency.portalHeader.programmeSite')} <ExternalLink className="ml-2 h-3.5 w-3.5" /></Link>
          </Button>
        </SellerContainer>
      </div>
    </header>
  );
}
