import { SupplierPublicShell } from '@/components/supplier/shell/SupplierPublicShell';
import {
  SupplierApplicationCTA, SupplierBenefits, SupplierCategoryGrid, SupplierChannels,
  SupplierFAQ, SupplierHero, SupplierProcess, SupplierRequirements, SupplierTrust,
  SupplierTypeGrid, SupplyModelCards,
} from '@/components/supplier/sections';

/**
 * Public Tejaraa Suppliers landing page (/partners).
 * Supplier acquisition only — the supplier workspace and admin tools live behind sign-in.
 */
export default function Partners() {
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
        title="Become a Tejaraa supplier"
        text="Tell us about your company and product catalogue to start the supplier review. Have these ready and you can finish in one sitting."
      />
    </SupplierPublicShell>
  );
}
