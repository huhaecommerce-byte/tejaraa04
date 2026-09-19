import { cn } from '@/lib/utils';
import wordmarkAsset from '@/assets/brand/tejaraa-wordmark.webp';
import symbolAsset from '@/assets/brand/tejaraa-symbol.png';

interface BrandLogoProps {
  variant?: 'storefront' | 'storefront-footer' | 'sidebar';
  collapsed?: boolean;
  subLabel?: string;
  onDark?: boolean;
  className?: string;
}

export function BrandLogo({
  variant = 'storefront',
  collapsed = false,
  subLabel: _subLabel,
  onDark: _onDark = false,
  className,
}: BrandLogoProps) {
  if (variant === 'sidebar' && collapsed) {
    return (
      <img
        src={symbolAsset}
        alt="Tejaraa"
        className={cn('h-10 w-10 shrink-0 object-contain', className)}
      />
    );
  }

  const heightClass = variant === 'sidebar' ? 'h-10' : variant === 'storefront-footer' ? 'h-11' : 'h-12';

  return (
    <img
      src={wordmarkAsset}
      alt="Tejaraa | تجارة"
      className={cn(heightClass, 'w-auto shrink-0 object-contain', className)}
    />
  );
}
