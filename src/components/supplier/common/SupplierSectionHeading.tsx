import { cn } from '@/lib/utils';

interface SupplierSectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  onDark?: boolean;
  id?: string;
}

export function SupplierSectionHeading({
  eyebrow, title, description, align = 'left', onDark = false, id,
}: SupplierSectionHeadingProps) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow ? (
        <p className={cn(
          'text-xs font-bold uppercase tracking-[0.16em]',
          onDark ? 'text-retail-gold' : 'text-retail-medium-green',
        )}>
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className={cn(
          'mt-2 text-2xl font-extrabold leading-tight sm:text-3xl',
          onDark ? 'text-white' : 'text-retail-dark-green',
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className={cn('mt-3 text-base leading-7', onDark ? 'text-white/75' : 'text-retail-muted')}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
