import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function RetailCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-retail-border bg-retail-card text-retail-text transition-[border-color,box-shadow] hover:border-retail-green/35 hover:shadow-sm', className)} {...props} />;
}