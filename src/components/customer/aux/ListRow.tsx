import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import type { ActionAccent } from './ActionGrid';

interface ListRowProps {
  icon?: LucideIcon;
  iconAccent?: ActionAccent;
  iconNode?: ReactNode;
  title: string;
  subtitle?: string;
  meta?: string;
  value?: ReactNode;
  valueSub?: ReactNode;
  pill?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
}

export function ListRow({ icon: Icon, iconAccent = 'emerald', iconNode, title, subtitle, meta, value, valueSub, pill, right, onClick }: ListRowProps) {
  const Tag: any = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className="aux-row w-full text-left flex flex-wrap md:flex-nowrap items-center gap-x-3 gap-y-2 min-h-[64px] active:scale-[0.99] transition-transform"
    >
      {iconNode ? iconNode : Icon && (
        <div className={`aux-chip aux-chip-${iconAccent} shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex-1 min-w-0 basis-[calc(100%-3.5rem)] md:basis-auto">
        <p className="text-sm font-semibold text-foreground truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>}
      </div>
      {pill && <div className="shrink-0 order-3 md:order-none">{pill}</div>}
      {meta && <p className="text-xs text-muted-foreground hidden sm:block shrink-0">{meta}</p>}
      {(value || valueSub) && (
        <div className="text-right shrink-0 ml-auto md:ml-0">
          {value && <p className="text-sm font-bold aux-num text-foreground">{value}</p>}
          {valueSub && <p className="text-[11px] text-muted-foreground aux-num">{valueSub}</p>}
        </div>
      )}
      {right && <div className="shrink-0">{right}</div>}
    </Tag>
  );
}
