import { Link } from '@/lib/router-compat';
import { Handshake, Store, Truck, Warehouse } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/i18n/LocaleProvider';
import type { TranslationKey } from '@/i18n/dictionary';

export const tejaraaPlatforms: {
  label: TranslationKey; to: string; icon: typeof Store; id: TejaraaPlatformId;
}[] = [
  { label: 'platform.shop', to: '/', icon: Store, id: 'shop' },
  { label: 'platform.selling', to: '/selling', icon: Truck, id: 'selling' },
  { label: 'platform.agencies', to: '/agency', icon: Handshake, id: 'agencies' },
  { label: 'platform.suppliers', to: '/partners', icon: Warehouse, id: 'suppliers' },
];

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
  const { t } = useLocale();
  return (
    <nav
      aria-label="Tejaraa platforms"
      className={cn(layout === 'inline' ? 'flex w-full min-w-0 flex-1 items-end gap-0.5 self-stretch overflow-visible sm:w-auto sm:flex-none sm:gap-1.5' : 'grid gap-1', className)}
    >
      {tejaraaPlatforms.map((platform, index) => {
        const current = platform.id === currentId;
        const prevPlatform = index > 0 ? tejaraaPlatforms[index - 1] : null;
        const prevCurrent = prevPlatform?.id === currentId;
        return (
          <div key={platform.id} className="flex min-w-0 flex-1 items-end self-stretch sm:min-w-fit sm:flex-none">
          {layout === 'inline' && index > 0 && !current && !prevCurrent ? (
            <span aria-hidden className={cn('h-4 w-px shrink-0 self-center', onDark ? 'bg-white/25' : 'bg-retail-border')} />
          ) : null}
          <Link
            to={platform.to}
            onClick={onNavigate}
            aria-current={current ? 'page' : undefined}
            className={cn(
              'relative items-center justify-center gap-1.5 font-bold tracking-tight transition-colors',
              layout === 'inline'
                ? 'inline-flex flex-1 px-1 py-2 text-xs font-extrabold sm:flex-none sm:px-3 sm:text-sm sm:font-bold lg:px-5'
                : 'flex w-full items-center rounded-full px-2.5 py-1.5 text-xs font-bold',
              onDark
                ? current
                  ? layout === 'inline'
                    ? 'z-20 rounded-t-lg bg-retail-card text-retail-dark-green'
                    : 'bg-retail-light-green text-retail-dark-green'
                  : layout === 'inline'
                    ? 'mb-0.5 rounded-md text-white/85 transition-all hover:bg-white/10 hover:text-white'
                    : 'rounded-md border border-retail-dark-green/15 bg-retail-card text-retail-muted shadow-sm hover:border-retail-dark-green/30 hover:bg-retail-light-green/70 hover:text-retail-dark-green'
                : current
                  ? layout === 'inline'
                    ? 'bg-retail-light-green text-retail-dark-green'
                    : 'bg-white text-retail-dark-green shadow-sm'
                  : layout === 'inline'
                    ? 'text-retail-muted hover:bg-retail-light-green/70 hover:text-retail-dark-green'
                    : 'bg-white/10 text-primary-foreground/90 hover:bg-white/20 hover:text-white',
            )}
          >
            <platform.icon className={cn('h-3.5 w-3.5 shrink-0', layout === 'inline' && 'hidden sm:block')} aria-hidden />
            {layout === 'inline' ? (
              <>
                <span className="lg:hidden">{t(`platform.short.${platform.id}` as TranslationKey)}</span>
                <span className="hidden lg:inline">{t(platform.label)}</span>
              </>
            ) : (
              <span>{t(platform.label)}</span>
            )}
            {current && layout === 'inline' ? <span aria-hidden className="absolute inset-x-0 -bottom-1 h-1.5 rounded-b-lg bg-retail-card" /> : null}
            {current ? <span className="sr-only">(current section)</span> : null}
          </Link>
          </div>
        );
      })}
    </nav>
  );
}
