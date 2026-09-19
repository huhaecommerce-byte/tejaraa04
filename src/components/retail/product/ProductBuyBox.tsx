import { CreditCard, PackageCheck, ShieldCheck } from 'lucide-react';
import type { SeoProduct } from '@/lib/catalogSeo.functions';
import { money } from '@/lib/retailPricing';
import { AddToCart } from '@/components/storefront/AddToCart';
import { FavouriteButton } from '@/components/customer/FavouriteButton';

export function ProductBuyBox({ product, price }: { product: SeoProduct; price: number }) {
  const outOfStock = product.track_inventory === true && product.stock_qty < Math.max(1, product.moq);
  const lowStock = product.track_inventory === true && !outOfStock && product.stock_qty <= (product.low_stock_threshold ?? 0);

  return (
    <aside className="xl:sticky xl:top-36 xl:self-start">
      <div className="rounded-lg border border-retail-border bg-retail-card p-4 shadow-sm sm:p-5">
        <p className="font-display text-2xl font-bold text-retail-dark-green">SAR {money(price)}</p>
        <p className="mt-1 text-xs text-retail-muted">Excluding VAT</p>
        <div className="my-4 border-y border-retail-border py-3">
          <p className={outOfStock ? 'font-bold text-retail-sale' : lowStock ? 'font-bold text-retail-gold-foreground' : 'font-bold text-retail-green'}>{outOfStock ? 'Out of Stock' : lowStock ? 'Low Stock' : 'In Stock'}</p>
          <p className="mt-1 text-xs leading-5 text-retail-muted">{product.estimated_delivery || (product.source === 'local' ? 'Ready to ship from Saudi Arabia' : 'Standard delivery')}</p>
          {product.moq > 1 && <p className="mt-2 text-xs font-semibold text-retail-text">Minimum order: {product.moq} units</p>}
        </div>
        <AddToCart product={product} priceSar={price} retail />
        <div className="mt-3 flex items-center gap-2 border-t border-retail-border pt-3">
          <FavouriteButton productId={product.id} productName={product.name} size="lg" />
          <span className="text-sm font-semibold text-retail-text">Add to Favourites</span>
        </div>
        <ul className="mt-4 space-y-2 border-t border-retail-border pt-4 text-xs text-retail-muted">
          <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-retail-green" />Secure checkout</li>
          <li className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-retail-green" />Card or cash on delivery</li>
          <li className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-retail-green" />Order tracking available</li>
        </ul>
      </div>
    </aside>
  );
}