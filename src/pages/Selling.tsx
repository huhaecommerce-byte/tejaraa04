import { SellerPublicShell } from '@/components/seller/shell/SellerPublicShell';
import {
  SellerCTA, SellerHero, SellerServiceGrid,
} from '@/components/seller/sections';

/**
 * Public Tejaraa Seller Services landing page (/selling).
 * Marketing and acquisition surface only — no seller dashboard or backend behaviour here.
 */
export default function Selling() {
  return (
    <SellerPublicShell>
      <SellerHero />
      <SellerServiceGrid />
      <SellerCTA
        variant="dark"
        title="Start selling with Tejaraa"
        text="Create your seller account or talk to our team."
        primaryLabel="Start Selling"
        secondaryLabel="Talk to Tejaraa"
        secondaryTo="/contact"
      />
    </SellerPublicShell>
  );
}
