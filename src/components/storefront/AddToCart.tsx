import { useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ShoppingCart, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { money, tierDiscountPercent, unitPriceForQty } from '@/lib/retailPricing';

export interface AddToCartProduct {
  id: string;
  sku: string;
  slug?: string | null;
  name: string;
  images?: string[] | null;
  source: string;
  moq?: number | null;
  weight_kg?: number | null;
  stock_qty?: number | null;
  track_inventory?: boolean;
}

export function AddToCart({
  product,
  priceSar,
  compact = false,
  retail = false,
}: {
  product: AddToCartProduct;
  priceSar: number;
  compact?: boolean;
  retail?: boolean;
}) {
  const { addItem, tiers, setOpen } = useCart();
  const navigate = useNavigate();
  const minimum = Math.max(1, Number(product.moq) || 1);
  const maximum = product.track_inventory ? Math.max(0, Number(product.stock_qty) || 0) : Number.POSITIVE_INFINITY;
  const outOfStock = product.track_inventory === true && maximum < minimum;
  const [qty, setQty] = useState(minimum);

  const unit = unitPriceForQty(priceSar, qty, tiers);
  const off = tierDiscountPercent(qty, tiers);

  const add = () => {
    if (outOfStock) return;
    addItem(
      {
        productId: product.id,
        sku: product.sku,
        slug: product.slug ?? null,
        name: product.name,
        image: product.images?.[0] ?? null,
        basePriceSar: priceSar,
        moq: product.moq || 1,
        source: product.source,
        weightKg: Number(product.weight_kg) || 0,
      },
      qty,
    );
    setOpen(false);
    toast.success(`${qty} × ${product.name} added to your cart`);
  };

  const buyNow = () => {
    add();
    navigate('/checkout/shop');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-full border border-border">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(minimum, q - 1))}
            disabled={outOfStock || qty <= minimum}
            className="flex h-10 w-10 items-center justify-center rounded-s-full text-muted-foreground hover:bg-muted disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            value={qty}
            onChange={(e) => setQty(Math.min(maximum, Math.max(minimum, parseInt(e.target.value.replace(/\D/g, ''), 10) || minimum)))}
            inputMode="numeric"
            className="h-10 w-14 border-0 bg-transparent text-center text-sm font-semibold outline-none"
            aria-label="Quantity"
          />
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(maximum, q + 1))}
            disabled={outOfStock || qty >= maximum}
            className="flex h-10 w-10 items-center justify-center rounded-e-full text-muted-foreground hover:bg-muted disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="text-sm">
          <span className="font-bold text-primary">SAR {money(unit)}</span>
          <span className="text-muted-foreground"> / unit</span>
          {off > 0 && !retail && (
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              −{off}% bulk
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={add} disabled={outOfStock} className="w-full gap-2">
          <ShoppingCart className="h-4 w-4" /> {outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
        <Button onClick={buyNow} disabled={outOfStock} variant="outline" className="w-full gap-2">
          <Zap className="h-4 w-4" /> Buy now
        </Button>
      </div>

      {tiers.length > 0 && !retail && (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Buy more, pay less
          </p>
          <div className="flex flex-col gap-1.5">
            {[{ minQty: 1, offPercent: 0 }, ...tiers].map((t, i, arr) => {
              const next = arr[i + 1];
              const active = qty >= t.minQty && (!next || qty < next.minQty);
              const label = next ? `${t.minQty} – ${next.minQty - 1}` : `${t.minQty}+`;
              return (
                <button
                  type="button"
                  key={t.minQty}
                  onClick={() => setQty(t.minQty)}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors ${
                    active
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border/60 bg-background hover:border-primary/40'
                  }`}
                >
                  <span className="font-semibold">
                    {label} <span className="font-normal text-muted-foreground">pcs</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {t.offPercent > 0 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        −{t.offPercent}%
                      </span>
                    )}
                    <span className={active ? 'font-bold text-primary' : 'text-foreground'}>
                      SAR {money(unitPriceForQty(priceSar, t.minQty, tiers))}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
