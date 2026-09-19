import { FolderSearch } from 'lucide-react';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';
import { RetailContainer, RetailEmptyState, RetailErrorState } from '@/components/retail/common';

export function ListingRouteError() {
  return <RetailPublicShell><main><RetailContainer className="py-4"><section className="rounded-lg border border-retail-border bg-retail-card"><RetailErrorState title="We couldn't load these products" description="Please try again to continue shopping." onRetry={() => window.location.reload()} /></section></RetailContainer></main></RetailPublicShell>;
}

export function ListingRouteNotFound() {
  return <RetailPublicShell><main><RetailContainer className="py-4"><section className="rounded-lg border border-retail-border bg-retail-card"><RetailEmptyState icon={FolderSearch} title="Category not found" description="This shopping category is unavailable or may have moved." actionLabel="Browse All Categories" actionHref="/category" /></section></RetailContainer></main></RetailPublicShell>;
}