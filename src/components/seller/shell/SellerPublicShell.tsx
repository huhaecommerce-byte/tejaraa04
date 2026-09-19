import type { ReactNode } from 'react';
import { SellerHeader } from './SellerHeader';
import { SellerFooter } from './SellerFooter';

/**
 * Public shell for Tejaraa Seller Services (/selling and future public service pages).
 * Scoped `seller-theme` keeps these tokens away from Shop, Suppliers and internal portals.
 */
export function SellerPublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="seller-theme flex min-h-screen flex-col bg-retail-page text-retail-text">
      <SellerHeader />
      <main className="flex-1">{children}</main>
      <SellerFooter />
    </div>
  );
}
