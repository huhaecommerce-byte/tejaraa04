import { Link } from '@/lib/router-compat';
import { ChevronRight } from 'lucide-react';
import { SellerContainer } from '@/components/seller/common/SellerContainer';

export interface Crumb {
  label: string;
  to?: string;
}

/** Compact Seller Services breadcrumb: Seller Services > Dropshipping */
export function SellerBreadcrumbs({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ label: 'Seller Services', to: '/selling' }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="border-b border-retail-border bg-white">
      <SellerContainer>
        <ol className="flex flex-wrap items-center gap-1 py-2.5 text-xs text-retail-muted sm:text-[0.8125rem]">
          {trail.map((crumb, index) => {
            const last = index === trail.length - 1;
            return (
              <li key={crumb.label} className="flex items-center gap-1">
                {index > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-retail-muted/60" aria-hidden /> : null}
                {crumb.to && !last ? (
                  <Link to={crumb.to} className="font-medium hover:text-retail-dark-green hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined} className="font-semibold text-retail-dark-green">
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </SellerContainer>
    </nav>
  );
}
