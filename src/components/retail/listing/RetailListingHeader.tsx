import { RetailBreadcrumbs, type RetailBreadcrumbItem } from '@/components/retail/common';

export function RetailListingHeader({ breadcrumbs, title, description, countLabel }: { breadcrumbs: RetailBreadcrumbItem[]; title: string; description?: string; countLabel?: string }) {
  return <header className="space-y-2"><RetailBreadcrumbs items={breadcrumbs} /><div className="flex flex-wrap items-end justify-between gap-2"><div><h1 className="font-display text-2xl font-bold text-retail-text sm:text-3xl">{title}</h1>{description && <p className="mt-1 max-w-3xl text-xs text-retail-muted sm:text-sm">{description}</p>}</div>{countLabel && <span className="rounded-md bg-retail-light-green px-2.5 py-1 text-xs font-bold text-retail-green">{countLabel}</span>}</div></header>;
}