import { CreditCard, Headphones, PackageCheck, ShieldCheck } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { money } from '@/lib/retailPricing';
import { useLocale } from '@/i18n/LocaleProvider';

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
  const { t } = useLocale();
  return (
    <aside aria-labelledby="order-summary-heading" className="h-fit rounded-lg border border-retail-border bg-retail-card p-4 lg:sticky lg:top-36 sm:p-5">
      <h2 id="order-summary-heading" className="font-display text-lg font-bold text-retail-text">{t('shopx.summary.title')}</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-retail-muted">{itemCount === 1 ? t('shopx.summary.subtotalOne', { count: itemCount }) : t('shopx.summary.subtotalOther', { count: itemCount })}</dt><dd className="font-medium text-retail-text">SAR {money(totals.subtotal)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-retail-muted">{t('shopx.summary.shipping')}</dt><dd className="font-medium text-retail-text">{totals.shipping === 0 ? t('shopx.summary.free') : `SAR ${money(totals.shipping)}`}</dd></div>
        {totals.importFee > 0 && <div className="flex justify-between gap-4"><dt className="text-retail-muted">{t('shopx.summary.importHandling')}</dt><dd className="font-medium text-retail-text">SAR {money(totals.importFee)}</dd></div>}
        <div className="flex justify-between gap-4"><dt className="text-retail-muted">{t('shopx.summary.vat')}</dt><dd className="font-medium text-retail-text">SAR {money(totals.vat)}</dd></div>
        <div className="flex items-end justify-between gap-4 border-t border-retail-border pt-4">
          <dt className="font-bold text-retail-text">{t('shopx.summary.total')}</dt>
          <dd className="font-display text-2xl font-bold text-retail-dark-green">SAR {money(totals.total)}</dd>
        </div>
      </dl>

      <Button asChild size="lg" className="mt-5 w-full font-bold"><Link to="/checkout/shop"><CreditCard className="h-4 w-4" />{t('shopx.summary.proceedToCheckout')}</Link></Button>
      <Button asChild variant="outline" className="mt-2 w-full"><Link to="/catalog">{t('shopx.summary.continueShopping')}</Link></Button>

      <div className="mt-4 space-y-2 border-t border-retail-border pt-4 text-xs text-retail-muted">
        <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-retail-green" />{t('shopx.summary.secureCheckout')}</p>
        <p className="flex items-center gap-2"><PackageCheck className="h-4 w-4 shrink-0 text-retail-green" />{t('shopx.summary.orderTracking')}</p>
        <p className="flex items-center gap-2"><Headphones className="h-4 w-4 shrink-0 text-retail-green" />{t('shopx.summary.customerSupport')}</p>
      </div>
    </aside>
  );
}
