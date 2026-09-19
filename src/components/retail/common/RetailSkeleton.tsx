import { cn } from '@/lib/utils';

export function RetailSkeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-retail-border/70', className)} />;
}

export function RetailProductCardSkeleton() {
  return <div className="overflow-hidden rounded-lg border border-retail-border bg-retail-card"><RetailSkeleton className="aspect-square rounded-none" /><div className="space-y-2 p-3"><RetailSkeleton className="h-3 w-full" /><RetailSkeleton className="h-3 w-3/4" /><RetailSkeleton className="h-3 w-1/3" /><RetailSkeleton className="mt-2 h-5 w-1/2" /><RetailSkeleton className="h-3 w-2/5" /><RetailSkeleton className="h-9 w-full" /></div></div>;
}

export function RetailProductGridSkeleton({ count = 6 }: { count?: number }) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">{Array.from({ length: count }).map((_, index) => <RetailProductCardSkeleton key={index} />)}</div>;
}