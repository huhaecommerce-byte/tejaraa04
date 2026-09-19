import { Link } from '@/lib/router-compat';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupplierSectionLinkProps {
  to: string;
  label: string;
  onDark?: boolean;
  align?: 'left' | 'center';
  className?: string;
}

/** Shared "read the full page" link used under landing sections. */
export function SupplierSectionLink({ to, label, onDark = false, align = 'center', className }: SupplierSectionLinkProps) {
  return (
    <div className={cn('mt-8', align === 'center' && 'text-center', className)}>
      <Link
        to={to}
        className={cn(
          'inline-flex items-center gap-1.5 text-sm font-bold hover:underline',
          onDark ? 'text-retail-gold' : 'text-retail-green',
        )}
      >
        {label}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}
