import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function SellerContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-[1600px] px-3 sm:px-4 xl:px-6', className)} {...props} />;
}
