import { ExternalLink, Handshake } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { RetailContainer } from '@/components/retail/common/RetailContainer';
import { useLocale } from '@/i18n/LocaleProvider';

export function AgencyPortalHeader() {
  const { t } = useLocale();
  return (
    <header className="border-b border-retail-border bg-retail-card/95 backdrop-blur">
      <RetailContainer className="flex h-16 items-center justify-between gap-4">
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
      </RetailContainer>
    </header>
  );
}
