import { useEffect, useState } from 'react';
import { Check, Package, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/lib/router-compat';
import { cn } from '@/lib/utils';
import { sellPriceSar } from '@/lib/priceConversion';
import { money } from '@/lib/retailPricing';
import { useCart } from '@/contexts/CartContext';
import type { ProductData } from '@/components/storefront/ProductCard';
import { FavouriteButton } from '@/components/customer/FavouriteButton';
import { Button } from '@/components/ui/button';

export type RetailProductBadge = 'new' | 'best-seller' | null;

interface ShopProductCardProps {
  product: ProductData & { slug?: string | null };
  priority?: boolean;
  rating?: number | null;
  reviewCount?: number | null;
  badge?: RetailProductBadge;
  isNew?: boolean;
  rank?: number;
  compact?: boolean;
}

export function ShopProductCard({ product, priority = false, rating, reviewCount, badge = null, isNew = false, rank, compact = false }: ShopProductCardProps) {
  const { addItem } = useCart();
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);
  const price = sellPriceSar(product);
  const image = product.images?.[0];
  const showImage = Boolean(image) && !imgError;
  const href = `/product/${product.slug || product.id}`;
  const outOfStock = product.track_inventory === true && Number(product.stock_qty ?? 0) <= 0;
  const lowStock = product.track_inventory === true && !outOfStock && typeof product.low_stock_threshold === 'number' && Number(product.stock_qty ?? 0) <= product.low_stock_threshold;
  const displayBadge = badge ?? (isNew ? 'new' : null);
  const hasRating = typeof rating === 'number' && rating > 0 && typeof reviewCount === 'number' && reviewCount > 0;

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1600);
    return () => window.clearTimeout(timer);
  }, [added]);

  const add = () => {
    if (outOfStock) return;
    addItem({ productId: product.id, sku: product.sku, slug: product.slug ?? null, name: product.name, image: image ?? null, basePriceSar: price, moq: product.moq || 1, source: product.source, weightKg: Number(product.weight_kg) || 0 }, 1);
    setAdded(true);
    toast.success('Added to cart');
  };

  const availability = outOfStock ? 'Out of Stock' : lowStock ? 'Low Stock' : product.source === 'local' ? 'Ready to Ship' : 'Standard Delivery';

  return (
    <article className={cn('group flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-retail-border bg-retail-card transition duration-200 hover:border-retail-medium-green hover:shadow-sm focus-within:border-retail-green focus-within:ring-2 focus-within:ring-retail-green/20', compact && 'rounded-md')}>
      <div className="relative aspect-square overflow-hidden bg-retail-page">
        <Link to={href} aria-label={`View ${product.name}`} className="block h-full w-full focus-visible:outline-none">
          <span className="absolute inset-0 grid place-items-center"><span className="grid h-12 w-12 place-items-center rounded-lg bg-retail-light-green text-retail-green"><Package className="h-6 w-6" /></span></span>
          {showImage && <img src={image} alt={product.name} loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'auto'} onError={() => setImgError(true)} className={cn('relative h-full w-full object-contain transition duration-300 motion-safe:group-hover:scale-[1.03]', compact ? 'p-2.5' : 'p-3 sm:p-4')} />}
        </Link>
        {(displayBadge || rank) && <div className="absolute start-2 top-2 flex max-w-[calc(100%-3.5rem)] items-center gap-1">{displayBadge && <span className={cn('truncate rounded-sm px-1.5 py-1 text-[9px] font-bold uppercase', displayBadge === 'best-seller' ? 'bg-retail-gold text-retail-dark-green' : 'bg-retail-green text-primary-foreground')}>{displayBadge === 'best-seller' ? 'Best Seller' : 'New'}</span>}{rank && <span className="rounded-sm bg-retail-dark-green px-1.5 py-1 text-[9px] font-bold text-primary-foreground">#{rank}</span>}</div>}
        <div className="absolute end-2 top-2"><FavouriteButton productId={product.id} productName={product.name} size="sm" /></div>
      </div>

      <div className={cn('flex flex-1 flex-col', compact ? 'gap-1.5 p-2' : 'gap-2 p-2.5 sm:p-3')}>
        <Link to={href} className="focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-retail-green"><h3 title={product.name} className={cn('line-clamp-2 font-medium leading-snug text-retail-text transition-colors group-hover:text-retail-green', compact ? 'min-h-9 text-xs' : 'min-h-10 text-[13px] sm:text-sm')}>{product.name}</h3></Link>
        <div className="min-h-4 text-[11px] leading-4">{hasRating && <p className="text-retail-gold" aria-label={`${rating.toFixed(1)} out of 5 stars, ${reviewCount} reviews`}><span aria-hidden="true">★</span> <span className="font-bold text-retail-text">{rating.toFixed(1)}</span> <span className="text-retail-muted">({reviewCount})</span></p>}</div>
        <div className="mt-auto min-w-0">
          <p className={cn('truncate font-display font-bold text-retail-dark-green', compact ? 'text-base' : 'text-lg sm:text-xl')} title={`SAR ${money(price)}`}>SAR {money(price)}</p>
          <p className={cn('mt-1 text-[11px] font-medium', outOfStock ? 'text-retail-sale' : lowStock ? 'text-retail-gold-foreground' : 'text-retail-green')}>{availability}</p>
        </div>
        <Button type="button" onClick={add} disabled={outOfStock} aria-label={outOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`} className={cn('mt-1 w-full gap-1.5 font-bold', compact ? 'h-8 px-2 text-xs' : 'h-9 text-xs sm:text-sm')}>
          {added ? <><Check className="h-4 w-4" />Added</> : <><ShoppingCart className="h-4 w-4" />{outOfStock ? 'Out of Stock' : 'Add to Cart'}</>}
        </Button>
      </div>
    </article>
  );
}