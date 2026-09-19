import { Link } from '@/lib/router-compat';
import { Handshake, Store, Truck, Warehouse } from 'lucide-react';
import { cn } from '@/lib/utils';

export const tejaraaPlatforms = [
  { label: 'Shop', to: '/', icon: Store, id: 'shop' },
  { label: 'Dropshipping & Selling Services', to: '/selling', icon: Truck, id: 'selling' },
  { label: 'Agencies & VAs', to: '/agency', icon: Handshake, id: 'agencies' },
  { label: 'Wholesalers and Suppliers', to: '/partners', icon: Warehouse, id: 'suppliers' },
] as const;

export type TejaraaPlatformId = 'shop' | 'selling' | 'suppliers' | 'agencies';

interface SellerPlatformSwitcherProps {
  /** Which experience is currently open. */
  current?: TejaraaPlatformId;
  /** Visual treatment: inline row on the dark utility bar, or stacked in the mobile drawer/footer. */
  layout?: 'inline' | 'stacked';
  onDark?: boolean;
  className?: string;
  onNavigate?: () => void;
}

export function SellerPlatformSwitcher({
  layout = 'inline', onDark = true, className, onNavigate, current: currentId = 'selling',
}: SellerPlatformSwitcherProps) {
  return (
    <nav
      aria-label="Tejaraa platforms"
      className={cn(layout === 'inline' ? 'flex items-end gap-1 self-stretch pt-2 sm:gap-2' : 'grid gap-1', className)}
    >
      {tejaraaPlatforms.map((platform) => {
        const current = platform.id === currentId;
        return (
          <Link
            key={platform.id}
            to={platform.to}
            onClick={onNavigate}
            aria-current={current ? 'page' : undefined}
            className={cn(
              'relative items-center gap-1.5 font-bold tracking-tight transition-colors',
              layout === 'inline' ? 'hidden px-4 py-2 text-sm sm:inline-flex lg:px-6' : 'grid w-full rounded-md px-2.5 py-2 text-sm font-bold',
              onDark
                ? current
                  ? layout === 'inline'
                    ? 'z-20 rounded-t-lg bg-retail-card text-retail-dark-green'
                    : 'bg-retail-light-green text-retail-dark-green'
                  : layout === 'inline'
                    ? 'mb-0.5 rounded-md text-white/85 transition-all hover:bg-white/10 hover:text-white'
                    : 'rounded-md border border-retail-dark-green/15 bg-retail-card text-retail-muted shadow-sm hover:border-retail-dark-green/30 hover:bg-retail-light-green/70 hover:text-retail-dark-green'
                : current
                  ? 'bg-retail-light-green text-retail-dark-green'
                  : 'text-retail-muted hover:bg-retail-light-green/70 hover:text-retail-dark-green',
            )}
          >
            <platform.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{platform.label}</span>
            {current && layout === 'inline' ? <span aria-hidden className="absolute inset-x-0 -bottom-1 h-1.5 rounded-b-lg bg-retail-card" /> : null}
            {current ? <span className="sr-only">(current section)</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
