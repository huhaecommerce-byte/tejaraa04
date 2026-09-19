import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link, useLocation } from "@/lib/router-compat";
import { Eye, Package, Globe2, Home, Clock } from 'lucide-react';
import { sellPriceSar } from '@/lib/priceConversion';
import { supabase } from '@/integrations/supabase/client';
import { FavouriteButton } from '@/components/customer/FavouriteButton';
import { useBrandLogo } from '@/hooks/useBrandLogo';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProductTitleLines, titleClampStyle } from '@/lib/productTitleLines';

// Shared SAR rate cache
let cachedSarRate = 3.75;
let sarListeners: Set<(r: number) => void> = new Set();
let sarInitialized = false;

function initSarRate() {
  if (sarInitialized) return;
  sarInitialized = true;
  supabase.from('platform_settings').select('value').eq('key', 'usd_to_sar_rate').maybeSingle().then(({ data }) => {
    if (data) {
      cachedSarRate = parseFloat(data.value) || 3.75;
      sarListeners.forEach(fn => fn(cachedSarRate));
    }
  });
}

function useSarRate() {
  const [rate, setRate] = useState(cachedSarRate);
  useEffect(() => {
    initSarRate();
    sarListeners.add(setRate);
    setRate(cachedSarRate);
    return () => { sarListeners.delete(setRate); };
  }, []);
  return rate;
}

export interface ProductData {
  id: string;
  name: string;
  name_ar?: string | null;
  top_category: string;
  sub_category?: string;
  detailed_category?: string;
  source: string;
  images: string[];
  price_sar?: number;
  price_usd?: number;
  cost_usd?: number;
  bulk_price?: number;
  dropship_price?: number;
  dropship_price_usd?: number;
  bulk_price_usd?: number;
  moq: number;
  description?: string | null;
  estimated_delivery?: string | null;
  labelling_available?: boolean | null;
  platforms?: string[] | null;
  weight_kg?: number;
  sku: string;
  created_at?: string;
  stock_qty?: number;
  track_inventory?: boolean;
  low_stock_threshold?: number;
}

export const ProductCard = React.forwardRef<HTMLAnchorElement, { product: ProductData; priority?: boolean }>(({ product, priority = false }, ref) => {
  const imgSrc = product.images?.[0];
  const isLocal = product.source === 'local';
  
  
  const { logoUrl } = useBrandLogo();
  const titleLines = useProductTitleLines();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Single selling price
  const sellingPrice = sellPriceSar(product);
  const lowestPrice = sellingPrice;
  const highestPrice = sellingPrice;

  const showImage = imgSrc && !imgError;

  return (
    <Link
      ref={ref}
      to={`/dropshipping/catalog/${product.id}`}
      className="block group"
      {...(!isMobile && !isAdmin ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <Card className="relative overflow-hidden rounded-xl border-border/30 bg-card/80 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
        {/* Source row */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-border/30 bg-gradient-to-r from-muted/30 to-transparent">
          {isLocal ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold tracking-wide ring-1 ring-primary/20">
              <Home className="h-3 w-3" />
              Local
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-accent/20 to-accent/10 text-accent px-2 py-0.5 text-[10px] font-bold tracking-wide ring-1 ring-accent/30 shadow-sm">
              <Globe2 className="h-3 w-3" />
              Global
            </span>
          )}
          {!isLocal && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[10px] font-semibold ring-1 ring-amber-500/20">
              <Clock className="h-3 w-3" />
              7–10 days
            </span>
          )}
        </div>
        {/* Category row */}
        <div className="flex items-center px-3 py-1 text-[10px] font-medium tracking-wide bg-muted/50 text-muted-foreground border-b border-border/30 truncate">
          <span className="truncate">{product.top_category}</span>
        </div>

        {/* Image */}
        <div className="relative aspect-square bg-muted/30 overflow-hidden">
          {/* Branded placeholder — shown while loading or on error/no src */}
          {(!showImage || !imgLoaded) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/40 to-muted/20">
              <div className="flex flex-col items-center gap-2 opacity-70">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="h-10 w-auto object-contain animate-pulse" />
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-md animate-pulse" />
                    <Package className="relative h-10 w-10 text-primary/60 animate-pulse" />
                  </div>
                )}
                {!showImage && (
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Tejaraa</span>
                )}
              </div>
            </div>
          )}
          {showImage && (
            <img
              src={imgSrc}
              alt={product.name}
              className={cn(
                "h-full w-full object-contain p-3 transition-all duration-500 group-hover:scale-105",
                imgLoaded ? "opacity-100" : "opacity-0"
              )}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              {...(priority ? { fetchPriority: "high" as any } : {})}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <span className="flex items-center gap-1.5 text-sm font-medium text-primary translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <Eye className="h-4 w-4" /> View Details
            </span>
          </div>

          {product.labelling_available && (
            <Badge variant="outline" className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 bg-background/70 backdrop-blur-sm">
              Labelling
            </Badge>
          )}

          {/* Stock badges */}
          {product.track_inventory && (product.stock_qty ?? 0) === 0 && (
            <Badge variant="destructive" className="absolute bottom-2 left-2 text-[10px] px-1.5 py-0.5">
              Out of stock
            </Badge>
          )}
          {product.track_inventory && (product.stock_qty ?? 0) > 0 && (product.stock_qty ?? 0) <= (product.low_stock_threshold ?? 10) && (
            <Badge className="absolute bottom-2 left-2 text-[10px] px-1.5 py-0.5 bg-amber-500 text-white hover:bg-amber-500">
              Only {product.stock_qty} left
            </Badge>
          )}

          {/* Favourite toggle (only on customer panel) */}
          <FavBadge productId={product.id} />
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          <h3
            title={product.name}
            style={titleClampStyle(titleLines)}
            className="font-semibold text-xs leading-snug text-foreground group-hover:text-primary transition-colors duration-200"
          >
            {product.name}
          </h3>


          <div className="pt-1.5 border-t border-border/30">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Price</p>
            <p className="text-sm font-bold text-primary">SAR {sellingPrice.toFixed(2)}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
});

ProductCard.displayName = 'ProductCard';

// Show favourite button only inside the customer panel
function FavBadge({ productId }: { productId: string }) {
  const { pathname } = useLocation();
  if (!pathname.startsWith('/dropshipping')) return null;
  return (
    <div className="absolute top-2 right-2 z-10">
      <FavouriteButton productId={productId} size="sm" />
    </div>
  );
}
