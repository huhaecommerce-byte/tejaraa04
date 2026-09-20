import { SellerPublicShell } from '@/components/seller/shell/SellerPublicShell';
import {
  SellerCTA, SellerHero, SellerServiceGrid,
} from '@/components/seller/sections';
import { useLocale } from '@/i18n/LocaleProvider';

/**
 * Public Tejaraa Seller Services landing page (/selling).
 * Marketing and acquisition surface only — no seller dashboard or backend behaviour here.
 */
export default function Selling() {
  const { t } = useLocale();
  return (
    <SellerPublicShell>
      <SellerHero />
      <SellerServiceGrid />
      <SellerCTA
        variant="dark"
        title={t('selling.cta.title')}
        text={t('selling.cta.text')}
        primaryLabel={t('selling.cta.primary')}
        secondaryLabel={t('selling.cta.secondary')}
        secondaryTo="/contact"
      />
    </SellerPublicShell>
  );
}
