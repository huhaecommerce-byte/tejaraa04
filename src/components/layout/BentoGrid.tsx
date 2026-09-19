import { ReactNode } from 'react';

interface GridProps { children: ReactNode; className?: string; }
export function BentoGrid({ children, className = '' }: GridProps) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 auto-rows-[minmax(120px,auto)] gap-3 sm:auto-rows-[minmax(140px,auto)] sm:gap-4 ${className}`}>
      {children}
    </div>
  );
}

interface TileProps {
  children: ReactNode;
  className?: string;
  span?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2 | 3;
  tone?: 'default' | 'gradient' | 'tinted';
}

export function BentoTile({ children, className = '', span = 1, rowSpan = 1, tone = 'default' }: TileProps) {
  const colMap = {
    1: 'col-span-1 lg:col-span-1',
    2: 'col-span-2 lg:col-span-2',
    3: 'col-span-2 lg:col-span-3',
    4: 'col-span-2 lg:col-span-4',
  };
  const rowMap = { 1: '', 2: 'lg:row-span-2', 3: 'lg:row-span-3' };
  const base = 'relative min-w-0 rounded-2xl p-4 sm:p-5 transition-all duration-300 backdrop-blur-xl border';
  const toneMap = {
    default:
      `${base} bg-white/85 border-[hsl(152_40%_88%/0.6)] shadow-[0_4px_20px_-8px_hsl(152_69%_31%/0.15)] hover:shadow-[0_8px_28px_-8px_hsl(152_69%_31%/0.22)] hover:border-[hsl(152_50%_75%/0.7)]`,
    gradient:
      `${base} aurora-gradient text-white border-white/15 shadow-[0_12px_40px_-12px_hsl(152_69%_25%/0.5)]`,
    tinted:
      `${base} bg-[hsl(152_50%_96%/0.85)] border-[hsl(152_50%_82%/0.6)] shadow-[0_4px_20px_-8px_hsl(152_69%_31%/0.12)]`,
  };
  return (
    <div className={`${toneMap[tone]} ${colMap[span]} ${rowMap[rowSpan]} ${className}`}>
      {children}
    </div>
  );
}
