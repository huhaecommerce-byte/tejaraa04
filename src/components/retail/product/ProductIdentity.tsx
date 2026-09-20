import { Clock3, PackageCheck, Star } from 'lucide-react';
import { money } from '@/lib/retailPricing';
import type { SeoProduct } from '@/lib/catalogSeo.functions';
import { useLocale } from '@/i18n/LocaleProvider';

export function ProductIdentity({ product, price }: { product: SeoProduct; price: number }) {
  const { t } = useLocale();
  const hasRating = Boolean(product.rating_avg && product.review_count);
  const outOfStock = product.track_inventory === true && product.stock_qty < Math.max(1, product.moq);
  const lowStock = product.track_inventory === true && !outOfStock && product.stock_qty <= (product.low_stock_threshold ?? 0);
  const availability = outOfStock ? t('shopx.product.availabilityOutOfStock') : lowStock ? t('shopx.product.availabilityLowStock') : product.source === 'local' ? t('shopx.product.availabilityReadyToShip') : t('shopx.product.availabilityStandardDelivery');

  return (
    <section className="min-w-0 py-1">
      <h1 className="font-display text-xl font-bold leading-snug text-retail-text sm:text-2xl xl:text-[28px]">{product.name}</h1>
      {product.name_ar && <p dir="rtl" className="mt-2 text-sm leading-relaxed text-retail-muted">{product.name_ar}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-retail-muted">
        {hasRating && (
          <a href="#reviews" className="inline-flex items-center gap-1 font-semibold text-retail-text hover:text-retail-green">
            <Star className="h-4 w-4 fill-retail-gold text-retail-gold" aria-hidden="true" />
            <span>{product.rating_avg?.toFixed(1)}</span>
            <span className="font-normal text-retail-muted">{t('shopx.product.reviews', { count: product.review_count ?? 0 })}</span>
          </a>
        )}
        {product.sku && <span>{t('shopx.product.sku', { sku: product.sku })}</span>}
      </div>

      <div className="my-5 border-y border-retail-border py-4">
        <p className="font-display text-3xl font-bold text-retail-dark-green sm:text-4xl">SAR {money(price)}</p>
        <p className="mt-1 text-xs text-retail-muted">{t('shopx.product.priceExcludesVat')}</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-retail-light-green text-retail-green"><PackageCheck className="h-4 w-4" /></span>
          <div><p className={outOfStock ? 'font-bold text-retail-sale' : lowStock ? 'font-bold text-retail-gold-foreground' : 'font-bold text-retail-green'}>{availability}</p><p className="text-xs text-retail-muted">{product.source === 'local' ? t('shopx.product.shipsFromStock') : t('shopx.product.importedStandard')}</p></div>
        </div>
        {product.estimated_delivery && (
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-retail-light-green text-retail-green"><Clock3 className="h-4 w-4" /></span>
            <div><p className="font-semibold text-retail-text">{t('shopx.product.estimatedDelivery')}</p><p className="text-xs text-retail-muted">{product.estimated_delivery}</p></div>
          </div>
        )}
      </div>
    </section>
  );
}
