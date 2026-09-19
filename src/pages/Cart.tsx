import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';
import { RetailContainer, RetailEmptyState } from '@/components/retail/common';
import { ProductRail } from '@/components/retail/home/ProductRail';
import type { HomepageProduct, HomepageRating } from '@/components/retail/home/homeTypes';
import { CartLineItem, CartSkeleton, CartSummary } from '@/components/retail/cart';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { tierDiscountPercent } from '@/lib/retailPricing';
import { cartImportShippingFee, orderTotals, usePricingSettings, useShippingSettings } from '@/lib/shopTotals';
import { supabase } from '@/integrations/supabase/client';

const RECOMMENDATION_COLUMNS = 'id,sku,name,slug,top_category,sub_category,source,images,price_sar,price_usd,cost_usd,moq,weight_kg,stock_qty,track_inventory,is_featured,created_at';

export default function CartPage() {
  const { items, isHydrated, count, setQty, removeItem, subtotal, unitPrice, lineTotal, tiers } = useCart();
  const shippingSettings = useShippingSettings();
  const pricingSettings = usePricingSettings();
  const importFee = useMemo(() => cartImportShippingFee(items, pricingSettings), [items, pricingSettings]);
  const totals = orderTotals(subtotal, shippingSettings, { importFee });
  const [recommendations, setRecommendations] = useState<HomepageProduct[]>([]);
  const [ratings, setRatings] = useState<Record<string, HomepageRating>>({});
  const cartProductIds = useMemo(() => items.map((item) => item.productId).sort().join('|'), [items]);

  useEffect(() => {
    if (!isHydrated) return;
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from('products')
        .select(RECOMMENDATION_COLUMNS)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(18);
      if (!active) return;
      const cartIds = new Set(cartProductIds ? cartProductIds.split('|') : []);
      const products = ((data ?? []) as unknown as HomepageProduct[]).filter((product) => !cartIds.has(product.id)).slice(0, 12);
      setRecommendations(products);
      if (products.length === 0) return;
      const { data: ratingRows } = await supabase.from('product_rating_stats').select('product_id, avg_rating, review_count').in('product_id', products.map((product) => product.id));
      if (!active) return;
      const ratingMap: Record<string, HomepageRating> = {};
      ((ratingRows ?? []) as HomepageRating[]).forEach((rating) => { if (rating.product_id) ratingMap[rating.product_id] = rating; });
      setRatings(ratingMap);
    })();
    return () => { active = false; };
  }, [isHydrated, cartProductIds]);

  return (
    <RetailPublicShell>
      <main>
        <RetailContainer className="py-4 sm:py-6">
          {!isHydrated ? <CartSkeleton /> : <>
            <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-retail-border pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-retail-light-green text-retail-green"><ShoppingCart className="h-5 w-5" /></span>
                <div className="min-w-0"><h1 className="truncate font-display text-2xl font-bold text-retail-text sm:text-3xl">Your Cart</h1>{items.length > 0 && <p className="text-sm text-retail-muted">{count} {count === 1 ? 'item' : 'items'}</p>}</div>
              </div>
              <Button asChild variant="ghost" size="sm" className="shrink-0 px-2 text-retail-green"><Link to="/catalog"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Continue Shopping</span><span className="sm:hidden">Shop</span></Link></Button>
            </header>

            {items.length === 0 ? (
              <section className="mt-5 rounded-lg border border-retail-border bg-retail-card py-8 sm:py-12">
                <RetailEmptyState icon={ShoppingCart} title="Your cart is empty" description="Looks like you haven't added anything yet." actionLabel="Start Shopping" actionHref="/catalog" />
                <div className="text-center"><Button asChild variant="link" className="text-retail-green"><Link to="/category">Browse Categories</Link></Button></div>
              </section>
            ) : (
              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,380px)] xl:gap-6">
                <section aria-label="Cart items" className="space-y-3">
                  {items.map((item) => <CartLineItem key={item.productId} item={item} unitPrice={unitPrice(item)} lineTotal={lineTotal(item)} discountPercent={tierDiscountPercent(item.qty, tiers)} onQuantityChange={(quantity) => setQty(item.productId, Math.max(item.moq || 1, quantity))} onRemove={() => removeItem(item.productId)} />)}
                </section>
                <CartSummary itemCount={count} totals={totals} />
              </div>
            )}

            {recommendations.length > 0 && <section className="mt-6"><ProductRail title="You May Also Like" description="More products from Tejaraa Shop" products={recommendations} ratings={ratings} /></section>}
          </>}
        </RetailContainer>
      </main>
    </RetailPublicShell>
  );
}
