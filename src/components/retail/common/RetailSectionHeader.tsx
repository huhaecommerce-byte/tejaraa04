import { ArrowRight } from 'lucide-react';
import { Link } from '@/lib/router-compat';

interface RetailSectionHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function RetailSectionHeader({ title, description, actionLabel, actionHref }: RetailSectionHeaderProps) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-bold text-retail-text sm:text-xl lg:text-2xl">{title}</h2>
        {description && <p className="mt-1 text-xs text-retail-muted sm:text-sm">{description}</p>}
      </div>
      {actionLabel && actionHref && (
        <Link to={actionHref} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-retail-green hover:text-retail-medium-green sm:text-sm">
          {actionLabel}<ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </header>
  );
}