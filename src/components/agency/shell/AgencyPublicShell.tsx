import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AgencyHeader } from './AgencyHeader';
import { AgencyFooter } from './AgencyFooter';
import { useLocale } from '@/i18n/LocaleProvider';

interface AgencyPublicShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/** Public chrome for the Agency & VA area — its own header, nav and footer. */
export function AgencyPublicShell({ children, className, contentClassName }: AgencyPublicShellProps) {
  const { dir } = useLocale();
  return (
    <div dir={dir} className={cn('seller-theme flex min-h-screen flex-col bg-retail-page text-retail-text', className)}>
      <AgencyHeader />
      <div className={cn('flex-1', contentClassName)}>{children}</div>
      <AgencyFooter />
    </div>
  );
}
