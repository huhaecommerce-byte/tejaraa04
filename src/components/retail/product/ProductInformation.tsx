import { Star } from 'lucide-react';
import type { SeoProduct } from '@/lib/catalogSeo.functions';
import type { ProductDetailRowConfig } from '@/lib/productDetailRows';
import { useLocale } from '@/i18n/LocaleProvider';

function specificationValue(product: SeoProduct, key: ProductDetailRowConfig['key'], t: (key: string, vars?: Record<string, string | number>) => string) {
  switch (key) {
    case 'sku': return product.sku;
    case 'category': return [product.top_category, product.sub_category, product.detailed_category].filter(Boolean).join(' › ');
    case 'moq': return product.moq > 1 ? t('shopx.product.units', { count: product.moq }) : '';
    case 'weight': return product.weight_kg ? t('shopx.product.kg', { value: product.weight_kg }) : '';
    case 'stock': return product.track_inventory ? (product.stock_qty > 0 ? t('shopx.product.inStockRow') : t('shopx.product.outOfStockRow')) : '';
    case 'delivery': return product.estimated_delivery || (product.source === 'local' ? t('shopx.product.readyToShipFrom') : t('shopx.product.standardDeliveryDesc'));
    case 'labelling': return '';
  }
}

export function ProductInformation({ product, description, rows }: { product: SeoProduct; description: string; rows: ProductDetailRowConfig[] }) {
  const { t } = useLocale();
  const specifications = rows.flatMap((row) => {
    if (!row.enabled || row.key === 'labelling') return [];
    const value = specificationValue(product, row.key, t);
    return value ? [{ label: row.label, value }] : [];
  });

  return (
    <div className="space-y-4">
      <nav aria-label={t('shopx.product.informationAria')} className="no-scrollbar flex gap-5 overflow-x-auto border-b border-retail-border bg-retail-card px-1">
        {description && <a href="#description" className="shrink-0 border-b-2 border-retail-green px-2 py-3 text-sm font-bold text-retail-green">{t('shopx.product.description')}</a>}
        {specifications.length > 0 && <a href="#specifications" className="shrink-0 px-2 py-3 text-sm font-semibold text-retail-muted hover:text-retail-green">{t('shopx.product.specifications')}</a>}
        <a href="#reviews" className="shrink-0 px-2 py-3 text-sm font-semibold text-retail-muted hover:text-retail-green">{product.review_count ? t('shopx.product.reviewsTabCount', { count: product.review_count }) : t('shopx.product.reviewsTab')}</a>
      </nav>

      {description && <section id="description" className="scroll-mt-40 border-b border-retail-border py-5 sm:py-7"><h2 className="font-display text-xl font-bold text-retail-text">{t('shopx.product.productDescription')}</h2><p className="mt-4 max-w-5xl whitespace-pre-line text-sm leading-7 text-retail-muted">{description}</p></section>}

      {specifications.length > 0 && <section id="specifications" className="scroll-mt-40 border-b border-retail-border py-5 sm:py-7"><h2 className="font-display text-xl font-bold text-retail-text">{t('shopx.product.specifications')}</h2><dl className="mt-4 max-w-4xl divide-y divide-retail-border border-y border-retail-border">{specifications.map((item) => <div key={item.label} className="grid gap-1 py-3 sm:grid-cols-[180px_minmax(0,1fr)]"><dt className="text-sm font-semibold text-retail-muted">{item.label}</dt><dd className="break-words text-sm font-medium text-retail-text">{item.value}</dd></div>)}</dl></section>}

      <section id="reviews" className="scroll-mt-40 py-5 sm:py-7">
        <h2 className="font-display text-xl font-bold text-retail-text">{t('shopx.product.customerReviews')}</h2>
        {product.top_reviews?.length ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {product.top_reviews.map((review, index) => (
              <article key={`${review.created_at}-${index}`} className="rounded-lg border border-retail-border p-4">
                <div className="flex items-center justify-between gap-3"><p className="font-bold text-retail-text">{review.author_name}</p><time className="text-xs text-retail-muted" dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString()}</time></div>
                <p className="mt-2 text-retail-gold" aria-label={t('shopx.product.ratingAria', { rating: review.rating })}>{Array.from({ length: 5 }).map((_, star) => <Star key={star} className={`inline h-3.5 w-3.5 ${star < review.rating ? 'fill-current' : 'text-retail-border'}`} aria-hidden="true" />)}</p>
                {review.title && <h3 className="mt-2 text-sm font-bold text-retail-text">{review.title}</h3>}
                {review.body && <p className="mt-1 text-sm leading-6 text-retail-muted">{review.body}</p>}
              </article>
            ))}
          </div>
        ) : <p className="mt-3 text-sm text-retail-muted">{t('shopx.product.noReviews')}</p>}
      </section>
    </div>
  );
}
