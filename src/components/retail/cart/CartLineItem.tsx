import { useState } from 'react';
import { Minus, Package, Plus, Trash2, Truck } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { money } from '@/lib/retailPricing';
import type { CartItem } from '@/contexts/CartContext';

interface CartLineItemProps {
  item: CartItem;
  unitPrice: number;
  lineTotal: number;
  discountPercent: number;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export function CartLineItem({ item, unitPrice, lineTotal, discountPercent, onQuantityChange, onRemove }: CartLineItemProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const href = `/product/${item.slug || item.productId}`;
  const deliveryLabel = item.source === 'local' ? 'Ready to Ship' : 'Standard Delivery';

  return (
    <article className="rounded-lg border border-retail-border bg-retail-card p-3 sm:p-4">
      <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 sm:grid-cols-[124px_minmax(0,1fr)_auto] sm:gap-4">
        <Link to={href} aria-label={`View ${item.name}`} className="row-span-2 grid aspect-square place-items-center overflow-hidden rounded-md border border-retail-border bg-retail-page sm:row-span-1">
          {item.image && !imageFailed ? (
            <img src={item.image} alt={item.name} loading="lazy" decoding="async" onError={() => setImageFailed(true)} className="h-full w-full object-contain p-2" />
          ) : (
            <Package className="h-8 w-8 text-retail-muted" aria-hidden="true" />
          )}
        </Link>

        <div className="min-w-0">
          <Link to={href} title={item.name} className="focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-retail-green">
            <h2 className="line-clamp-2 text-sm font-bold leading-snug text-retail-text hover:text-retail-green sm:text-base">{item.name}</h2>
          </Link>
          {item.sku && <p className="mt-1 truncate text-xs text-retail-muted">SKU: {item.sku}</p>}
          {item.moq > 1 && <p className="mt-1 text-xs font-medium text-retail-text">Minimum order: {item.moq} units</p>}
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-retail-green">
            <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {deliveryLabel}
          </p>
        </div>

        <div className="hidden min-w-28 shrink-0 text-end sm:block">
          <p className="text-xs text-retail-muted">Line total</p>
          <p className="mt-1 font-display text-lg font-bold text-retail-dark-green">SAR {money(lineTotal)}</p>
        </div>

        <div className="col-span-2 mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-t border-retail-border pt-3 sm:col-start-2 sm:col-end-4">
          <div className="min-w-0">
            <p className="text-xs text-retail-muted">SAR {money(unitPrice)} / unit</p>
            {discountPercent > 0 && <p className="mt-0.5 text-xs font-semibold text-retail-green">Bulk price applied · {discountPercent}% off</p>}
            <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label={`Remove ${item.name} from cart`} className="mt-2 h-8 justify-start px-0 text-xs text-retail-muted hover:bg-transparent hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </Button>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center overflow-hidden rounded-md border border-retail-border bg-retail-card" aria-label={`Quantity for ${item.name}`}>
              <Button type="button" variant="ghost" size="icon" onClick={() => onQuantityChange(item.qty - 1)} disabled={item.qty <= Math.max(1, item.moq)} aria-label={`Decrease quantity of ${item.name}`} className="h-10 w-10 rounded-none border-e border-retail-border hover:bg-retail-light-green">
                <Minus className="h-4 w-4" />
              </Button>
              <output aria-live="polite" className="w-11 text-center text-sm font-bold text-retail-text">{item.qty}</output>
              <Button type="button" variant="ghost" size="icon" onClick={() => onQuantityChange(item.qty + 1)} aria-label={`Increase quantity of ${item.name}`} className="h-10 w-10 rounded-none border-s border-retail-border hover:bg-retail-light-green">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-end text-sm font-bold text-retail-dark-green sm:hidden">SAR {money(lineTotal)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}