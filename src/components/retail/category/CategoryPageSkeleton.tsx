import { RetailProductGridSkeleton, RetailSkeleton } from '@/components/retail/common';

export function CategoryPageSkeleton() {
  return <div className="space-y-4"><RetailSkeleton className="h-4 w-40" /><RetailSkeleton className="h-44 w-full" /><div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]"><RetailSkeleton className="hidden h-96 lg:block" /><RetailProductGridSkeleton count={8} /></div></div>;
}