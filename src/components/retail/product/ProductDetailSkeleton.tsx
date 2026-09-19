import { RetailSkeleton } from '@/components/retail/common';

export function ProductDetailSkeleton() {
  return <div className="space-y-5 py-4"><RetailSkeleton className="h-4 w-72" /><div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,.9fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)_320px]"><RetailSkeleton className="aspect-square min-h-[320px]" /><div className="space-y-4"><RetailSkeleton className="h-8 w-full" /><RetailSkeleton className="h-4 w-1/2" /><RetailSkeleton className="h-12 w-2/5" /><RetailSkeleton className="h-32 w-full" /></div><RetailSkeleton className="hidden h-96 xl:block" /></div><RetailSkeleton className="h-64 w-full" /></div>;
}