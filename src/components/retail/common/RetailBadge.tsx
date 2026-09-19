import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type RetailBadgeTone = 'new' | 'deal' | 'bestSeller' | 'stock' | 'lowStock' | 'unavailable';
const tones: Record<RetailBadgeTone, string> = {
  new: 'border-retail-green/20 bg-retail-light-green text-retail-dark-green',
  deal: 'border-retail-sale/20 bg-retail-sale/10 text-retail-sale',
  bestSeller: 'border-retail-gold/40 bg-retail-gold/20 text-retail-dark-green',
  stock: 'border-retail-green/20 bg-retail-light-green text-retail-green',
  lowStock: 'border-retail-gold/40 bg-retail-gold/20 text-retail-dark-green',
  unavailable: 'border-retail-border bg-retail-page text-retail-muted',
};

export function RetailBadge({ tone = 'stock', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: RetailBadgeTone }) {
  return <span className={cn('inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold', tones[tone], className)} {...props} />;
}