import { ChevronRight } from 'lucide-react';
import { Link } from '@/lib/router-compat';

export interface RetailBreadcrumbItem { label: string; to?: string }

export function RetailBreadcrumbs({ items }: { items: RetailBreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="no-scrollbar overflow-x-auto">
      <ol className="flex w-max min-w-full items-center gap-1 whitespace-nowrap text-xs text-retail-muted">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-60 rtl:rotate-180" aria-hidden="true" />}
            {item.to && index < items.length - 1 ? <Link to={item.to} className="hover:text-retail-green">{item.label}</Link> : <span aria-current={index === items.length - 1 ? 'page' : undefined} className="font-medium text-retail-text">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}