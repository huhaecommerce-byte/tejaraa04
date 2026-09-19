import type { ComponentType, SVGProps } from 'react';

export interface RetailTrustItem {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description?: string;
}

export function RetailTrustBar({ items }: { items: RetailTrustItem[] }) {
  return (
    <div className="grid overflow-hidden rounded-lg border border-retail-border bg-retail-card sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.title} className="flex min-w-0 items-center gap-3 border-b border-retail-border p-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
          <item.icon className="h-5 w-5 shrink-0 text-retail-medium-green" aria-hidden="true" />
          <div className="min-w-0"><p className="text-sm font-bold text-retail-text">{item.title}</p>{item.description && <p className="truncate text-xs text-retail-muted">{item.description}</p>}</div>
        </div>
      ))}
    </div>
  );
}