import { cn } from '@/lib/utils';

interface SellerSectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  onDark?: boolean;
  className?: string;
  /** Heading level. Sections use h2 by default; the hero owns the single h1. */
  as?: 'h2' | 'h3';
}

export function SellerSectionHeading({
  eyebrow, title, description, align = 'left', onDark = false, className, as: Tag = 'h2',
}: SellerSectionHeadingProps) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow ? (
        <span className={cn('text-xs font-bold uppercase tracking-[0.14em]', onDark ? 'text-retail-gold' : 'text-retail-medium-green')}>
          {eyebrow}
        </span>
      ) : null}
      <Tag className={cn('mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-[2rem]', onDark ? 'text-white' : 'text-retail-dark-green')}>
        {title}
      </Tag>
      {description ? (
        <p className={cn('mt-3 text-base leading-7', onDark ? 'text-white/75' : 'text-retail-muted')}>{description}</p>
      ) : null}
    </div>
  );
}
