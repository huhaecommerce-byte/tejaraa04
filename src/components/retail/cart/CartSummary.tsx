import { CreditCard, Headphones, PackageCheck, ShieldCheck } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { money } from '@/lib/retailPricing';

interface CartTotals {
  subtotal: number;
  shipping: number;
  importFee: number;
  vat: number;
  total: number;
}

interface CartSummaryProps {
  itemCount: number;
  totals: CartTotals;
}

export function CartSummary({ itemCount, totals }: CartSummaryProps) {
  return (
    <aside aria-labelledby="order-summary-heading" className="h-fit rounded-lg border border-retail-border bg-retail-card p-4 lg:sticky lg:top-36 sm:p-5">
      <h2 id="order-summary-heading" className="font-display text-lg font-bold text-retail-text">Order Summary</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-retail-muted">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</dt><dd className="font-medium text-retail-text">SAR {money(totals.subtotal)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-retail-muted">Shipping</dt><dd className="font-medium text-retail-text">{totals.shipping === 0 ? 'Free' : `SAR ${money(totals.shipping)}`}</dd></div>
        {totals.importFee > 0 && <div className="flex justify-between gap-4"><dt className="text-retail-muted">Import / Handling</dt><dd className="font-medium text-retail-text">SAR {money(totals.importFee)}</dd></div>}
        <div className="flex justify-between gap-4"><dt className="text-retail-muted">VAT (15%)</dt><dd className="font-medium text-retail-text">SAR {money(totals.vat)}</dd></div>
        <div className="flex items-end justify-between gap-4 border-t border-retail-border pt-4">
          <dt className="font-bold text-retail-text">Total</dt>
          <dd className="font-display text-2xl font-bold text-retail-dark-green">SAR {money(totals.total)}</dd>
        </div>
      </dl>

      <Button asChild size="lg" className="mt-5 w-full font-bold"><Link to="/checkout/shop"><CreditCard className="h-4 w-4" />Proceed to Checkout</Link></Button>
      <Button asChild variant="outline" className="mt-2 w-full"><Link to="/catalog">Continue Shopping</Link></Button>

      <div className="mt-4 space-y-2 border-t border-retail-border pt-4 text-xs text-retail-muted">
        <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-retail-green" />Secure checkout</p>
        <p className="flex items-center gap-2"><PackageCheck className="h-4 w-4 shrink-0 text-retail-green" />Order tracking available</p>
        <p className="flex items-center gap-2"><Headphones className="h-4 w-4 shrink-0 text-retail-green" />Customer support</p>
      </div>
    </aside>
  );
}