import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown, Globe2, Menu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, useLocation } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { SellerPlatformSwitcher, type TejaraaPlatformId } from '@/components/seller/shell/SellerPlatformSwitcher';
import { useLocale } from '@/i18n/LocaleProvider';
import { cn } from '@/lib/utils';

export interface MobileNavItem {
  label: string;
  to: string;
  icon?: LucideIcon;
  /** Renders in the accent colour — used for primary in-menu destinations. */
  accent?: boolean;
}

export interface MobileNavGroup {
  label?: string;
  items: MobileNavItem[];
  /** Collapsed by default, expandable in place. */
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export interface MobileNavAction {
  label: string;
  to: string;
  variant?: 'primary' | 'outline';
}

interface MobileNavDrawerProps {
  /** Which Tejaraa experience the drawer belongs to. */
  current: TejaraaPlatformId;
  title: string;
  description?: string;
  groups: MobileNavGroup[];
  actions?: MobileNavAction[];
  /** Extra content rendered directly under the header (e.g. shop categories). */
  children?: ReactNode;
  /** Content pinned under the action buttons (e.g. account block). */
  footer?: ReactNode;
  triggerLabel: string;
  triggerClassName?: string;
}

const itemClass = (active: boolean, accent?: boolean) =>
  cn(
    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-colors',
    active
      ? 'bg-retail-light-green text-retail-dark-green'
      : accent
        ? 'text-retail-green hover:bg-retail-light-green/70'
        : 'text-retail-text hover:bg-retail-light-green/70 hover:text-retail-dark-green',
  );

export function MobileNavDrawer({
  current, title, description, groups, actions, children, footer, triggerLabel, triggerClassName,
}: MobileNavDrawerProps) {
  const { t, locale, setLocale, dir } = useLocale();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (to: string) => !to.includes('#') && (to.replace(/\/+$/, '') || '/') === (pathname.replace(/\/+$/, '') || '/');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={triggerLabel}
          className={cn('h-10 w-10 shrink-0 lg:hidden', triggerClassName)}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={dir === 'rtl' ? 'right' : 'left'}
        className="flex w-[88vw] max-w-sm flex-col gap-0 overflow-hidden p-0"
      >
        <SheetHeader className="shrink-0 space-y-1 bg-retail-dark-green px-5 py-4 text-left">
          <SheetTitle className="text-base font-bold text-primary-foreground">{title}</SheetTitle>
          {description ? (
            <SheetDescription className="text-xs text-primary-foreground/75">{description}</SheetDescription>
          ) : null}
          <SellerPlatformSwitcher
            current={current}
            layout="stacked"
            onDark={false}
            className="grid-cols-2 gap-1.5 pt-2 [&>a:not([aria-current=page])]:bg-white/10 [&>a:not([aria-current=page])]:text-primary-foreground [&>a:not([aria-current=page])]:hover:bg-white/20 [&>a:not([aria-current=page])]:hover:text-white"
            onNavigate={() => setOpen(false)}
          />
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children ? <div className="border-b border-retail-border px-3 py-3">{children}</div> : null}

          {groups.map((group, index) => (
            <nav key={group.label ?? index} className="border-b border-retail-border px-3 py-3">
              {group.label && !group.collapsible ? (
                <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-retail-muted">{group.label}</p>
              ) : null}
              {group.collapsible ? (
                <Collapsible defaultOpen={group.defaultOpen}>
                  <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold text-retail-text hover:bg-retail-light-green/70 hover:text-retail-dark-green">
                    {group.label}
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="grid gap-0.5 ps-3 pt-1">
                    {group.items.map((item) => (
                      <SheetClose asChild key={item.to}>
                        <Link to={item.to} aria-current={isActive(item.to) ? 'page' : undefined} className={itemClass(isActive(item.to), item.accent)}>
                          {item.icon ? <item.icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </SheetClose>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <div className="grid gap-0.5">
                  {group.items.map((item) => (
                    <SheetClose asChild key={item.to}>
                      <Link to={item.to} aria-current={isActive(item.to) ? 'page' : undefined} className={itemClass(isActive(item.to), item.accent)}>
                        {item.icon ? <item.icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </SheetClose>
                  ))}
                </div>
              )}
            </nav>
          ))}

          {footer ? <div className="px-3 py-4">{footer}</div> : null}
        </div>

        <div className="shrink-0 space-y-2 border-t border-retail-border bg-retail-card px-4 py-4">
          {actions?.map((action) => (
            <SheetClose asChild key={action.to + action.label}>
              <Button
                asChild
                variant={action.variant === 'outline' ? 'outline' : 'default'}
                className={cn('w-full font-semibold', action.variant !== 'outline' && 'bg-retail-green text-primary-foreground hover:bg-retail-dark-green')}
              >
                <Link to={action.to}>{action.label}</Link>
              </Button>
            </SheetClose>
          ))}
          <button
            type="button"
            onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            className="flex w-full items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold text-retail-dark-green hover:bg-retail-light-green/70"
          >
            <Globe2 className="h-4 w-4" aria-hidden />
            {locale === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
