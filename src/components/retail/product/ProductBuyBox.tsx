import { CreditCard, PackageCheck, ShieldCheck } from 'lucide-react';
import type { SeoProduct } from '@/lib/catalogSeo.functions';
import { money } from '@/lib/retailPricing';
import { AddToCart } from '@/components/storefront/AddToCart';
import { FavouriteButton } from '@/components/customer/FavouriteButton';
import { useLocale } from '@/i18n/LocaleProvider';

export function ProductBuyBox({ product, price }: { product: SeoProduct; price: number }) {
  const { t } = useLocale();
  const outOfStock = product.track_inventory === true && product.stock_qty < Math.max(1, product.moq);
  const lowStock = product.track_inventory === true && !outOfStock && product.stock_qty <= (product.low_stock_threshold ?? 0);

  return (
    <aside className="xl:sticky xl:top-36 xl:self-start">
      <div className="rounded-lg border border-retail-border bg-retail-card p-4 shadow-sm sm:p-5">
        <p className="font-display text-2xl font-bold text-retail-dark-green">SAR {money(price)}</p>
        <p className="mt-1 text-xs text-retail-muted">{t('shopx.product.excludingVat')}</p>
        <div className="my-4 border-y border-retail-border py-3">
          <p className={outOfStock ? 'font-bold text-retail-sale' : lowStock ? 'font-bold text-retail-gold-foreground' : 'font-bold text-retail-green'}>{outOfStock ? t('shopx.product.availabilityOutOfStock') : lowStock ? t('shopx.product.availabilityLowStock') : t('shopx.product.availabilityInStock')}</p>
          <p className="mt-1 text-xs leading-5 text-retail-muted">{product.estimated_delivery || (product.source === 'local' ? t('shopx.product.readyToShipFrom') : t('shopx.product.standardDeliveryDesc'))}</p>
          {product.moq > 1 && <p className="mt-2 text-xs font-semibold text-retail-text">{t('shopx.product.minimumOrder', { moq: product.moq })}</p>}
        </div>
        <AddToCart product={product} priceSar={price} retail />
        <div className="mt-3 flex items-center gap-2 border-t border-retail-border pt-3">
          <FavouriteButton productId={product.id} productName={product.name} size="lg" />
          <span className="text-sm font-semibold text-retail-text">{t('shopx.product.addToFavourites')}</span>
        </div>
        <ul className="mt-4 space-y-2 border-t border-retail-border pt-4 text-xs text-retail-muted">
          <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-retail-green" />{t('shopx.product.secureCheckout')}</li>
          <li className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-retail-green" />{t('shopx.product.cardOrCod')}</li>
          <li className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-retail-green" />{t('shopx.product.orderTracking')}</li>
        </ul>
      </div>
    </aside>
  );
}
