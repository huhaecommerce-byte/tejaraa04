import { PackageSearch } from 'lucide-react';
import { ShopProductCard } from '@/components/storefront/ShopProductCard';
import type { ProductData } from '@/components/storefront/ProductCard';
import { RetailEmptyState, RetailProductGridSkeleton } from '@/components/retail/common';

export function RetailProductGrid({ products, loading, emptyTitle, emptyDescription, emptyHref = '/category', emptyAction = 'Browse Categories' }: { products: (ProductData & { slug?: string | null })[]; loading: boolean; emptyTitle: string; emptyDescription: string; emptyHref?: string; emptyAction?: string }) {
  if (loading) return <RetailProductGridSkeleton count={10} />;
  if (!products.length) return <section className="rounded-lg border border-retail-border bg-retail-card"><RetailEmptyState icon={PackageSearch} title={emptyTitle} description={emptyDescription} actionLabel={emptyAction} actionHref={emptyHref} /></section>;
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{products.map((product, index) => <ShopProductCard key={product.id} product={product} priority={index < 5} />)}</div>;
}