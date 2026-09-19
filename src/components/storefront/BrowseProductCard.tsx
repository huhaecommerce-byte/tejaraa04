import React, { useState, useEffect } from 'react';
import { Link } from "@/lib/router-compat";

import { Badge } from '@/components/ui/badge';
import { Package, Globe2, Home, Clock } from 'lucide-react';
import { sellPriceSar } from '@/lib/priceConversion';
import { supabase } from '@/integrations/supabase/client';
import { useBrandLogo } from '@/hooks/useBrandLogo';
import { cn } from '@/lib/utils';
import { useProductTitleLines, titleClampStyle } from '@/lib/productTitleLines';
import type { ProductData } from '@/components/storefront/ProductCard';


// Shared SAR rate cache
let cachedSarRate = 3.75;
const sarListeners: Set<(r: number) => void> = new Set();
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

/**
 * Product card for the public browse catalog.
 * Renders as a real crawlable link to the public product page (/product/:id).
 * `onSelect` is still honored (called alongside navigation) for callers that
 * want to intercept, but the anchor href is what search engines follow.
 */
export const BrowseProductCard = ({ product, priority = false, onSelect }: { product: ProductData; priority?: boolean; onSelect?: (product: ProductData) => void }) => {
  const imgSrc = product.images?.[0];
  const isLocal = product.source === 'local';
  const { logoUrl } = useBrandLogo();
  const titleLines = useProductTitleLines();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const sellingPrice = sellPriceSar(product);

  const showImage = imgSrc && !imgError;

  return (
    <Link
      to={`/product/${(product as { slug?: string }).slug || product.id}`}
      onClick={() => onSelect?.(product)}
      className={cn(
        "relative block overflow-hidden rounded-xl border border-border/30 bg-card/80 text-card-foreground shadow-sm backdrop-blur-sm transition-all duration-300",
        "cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
      )}
    >


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
              "h-full w-full object-contain p-3 transition-opacity duration-500",
              imgLoaded ? "opacity-100" : "opacity-0"
            )}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            {...(priority ? { fetchPriority: "high" as any } : {})}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        )}

        {product.labelling_available && (
          <Badge variant="outline" className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 bg-background/70 backdrop-blur-sm">
            Labelling
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <h3
          title={product.name}
          style={titleClampStyle(titleLines)}
          className="font-semibold text-xs leading-snug text-foreground"
        >
          {product.name}
        </h3>

        <div className="pt-1.5 border-t border-border/30">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Price</p>
          <p className="text-sm font-bold text-primary">SAR {sellingPrice.toFixed(2)}</p>
        </div>
      </div>
      </Link>
  );

};

BrowseProductCard.displayName = 'BrowseProductCard';
