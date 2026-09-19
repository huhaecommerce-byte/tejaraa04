import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { RetailProductCardSkeleton, RetailSectionHeader } from '@/components/retail/common';
import { ShopProductCard } from '@/components/storefront/ShopProductCard';
import { Button } from '@/components/ui/button';
import type { HomepageProduct, HomepageRating } from './homeTypes';

interface ProductRailProps {
  title: string;
  products: HomepageProduct[];
  ratings: Record<string, HomepageRating>;
  loading?: boolean;
  viewAllHref?: string;
  description?: string;
  isNew?: boolean;
  badge?: 'new' | 'best-seller' | null;
  tone?: 'card' | 'soft';
}

export function ProductRail({ title, products, ratings, loading = false, viewAllHref = '/catalog', description, isNew = false, badge = null, tone = 'card' }: ProductRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  if (!loading && products.length === 0) return null;
  const scroll = (direction: number) => railRef.current?.scrollBy({ left: direction * Math.min(900, railRef.current.clientWidth * 0.8), behavior: 'smooth' });

  return (
    <section className={tone === 'soft' ? 'rounded-lg bg-retail-light-green p-3 sm:p-5' : 'rounded-lg border border-retail-border bg-retail-card p-3 sm:p-5'}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <RetailSectionHeader title={title} description={description} actionLabel="View all" actionHref={viewAllHref} />
        <div className="hidden shrink-0 gap-1 lg:flex">
          <Button type="button" variant="outline" size="icon" onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
          <Button type="button" variant="outline" size="icon" onClick={() => scroll(1)} aria-label={`Scroll ${title} right`} className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div ref={railRef} className="no-scrollbar mt-3 flex snap-x gap-2 overflow-x-auto pb-1 sm:gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="w-[154px] shrink-0 sm:w-[190px] xl:w-[220px]"><RetailProductCardSkeleton /></div>)
          : products.map((product, index) => <div key={product.id} className="w-[168px] shrink-0 snap-start sm:w-[200px] xl:w-[228px]"><ShopProductCard product={product} priority={index < 2} rating={ratings[product.id]?.avg_rating} reviewCount={ratings[product.id]?.review_count} badge={badge ?? (isNew ? 'new' : null)} compact /></div>)}
      </div>
    </section>
  );
}