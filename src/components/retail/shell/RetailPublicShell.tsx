import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { RetailHeader } from './RetailHeader';
import { RetailFooter } from './RetailFooter';

interface RetailPublicShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  dir?: 'ltr' | 'rtl';
}

export function RetailPublicShell({ children, className, contentClassName, dir }: RetailPublicShellProps) {
  return (
    <div dir={dir} className={cn('retail-theme flex min-h-screen flex-col bg-retail-page pb-[calc(56px+env(safe-area-inset-bottom))] text-retail-text lg:pb-0', className)}>
      <RetailHeader />
      <div className={cn('flex-1', contentClassName)}>{children}</div>
      <RetailFooter />
    </div>
  );
}