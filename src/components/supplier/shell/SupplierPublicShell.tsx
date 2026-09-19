import type { ReactNode } from 'react';
import { SupplierHeader } from './SupplierHeader';
import { SupplierFooter } from './SupplierFooter';

/** Public Suppliers shell: dedicated header + content + supplier footer. */
export function SupplierPublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="supplier-theme flex min-h-screen flex-col bg-retail-page text-retail-text">
      <SupplierHeader />
      <main className="flex-1">{children}</main>
      <SupplierFooter />
    </div>
  );
}
