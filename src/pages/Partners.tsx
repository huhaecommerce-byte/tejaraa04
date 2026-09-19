import { SupplierPublicShell } from '@/components/supplier/shell/SupplierPublicShell';
import {
  SupplierApplicationCTA, SupplierBenefits, SupplierCategoryGrid, SupplierChannels,
  SupplierFAQ, SupplierHero, SupplierProcess, SupplierRequirements, SupplierTrust,
  SupplierTypeGrid, SupplyModelCards,
} from '@/components/supplier/sections';
import { useLocale } from '@/i18n/LocaleProvider';

/**
 * Public Tejaraa Suppliers landing page (/partners).
 * Supplier acquisition only — the supplier workspace and admin tools live behind sign-in.
 */
export default function Partners() {
  const { t } = useLocale();
  return (
    <SupplierPublicShell>
      <SupplierHero />
      <SupplierTypeGrid />
      <SupplierBenefits />
      <SupplierProcess />
      <SupplyModelCards />
      <SupplierCategoryGrid />
      <SupplierRequirements />
      <SupplierChannels />
      <SupplierTrust />
      <SupplierFAQ />
      <SupplierApplicationCTA
        variant="dark"
        showChecklist
        title={t('supplier.cta.landingTitle')}
        text={t('supplier.cta.landingText')}
      />
    </SupplierPublicShell>
  );
}
