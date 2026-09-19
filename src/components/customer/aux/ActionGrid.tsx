import { LucideIcon } from 'lucide-react';

export type ActionAccent = 'emerald' | 'amber' | 'sky' | 'rose' | 'violet' | 'slate';

export interface ActionItem {
  label: string;
  icon: LucideIcon;
  accent?: ActionAccent;
  onClick?: () => void;
  href?: string;
  badge?: string;
}

interface ActionGridProps {
  items: ActionItem[];
  cols?: 2 | 3 | 4 | 5 | 6;
}

const colsClass: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
  5: 'grid-cols-2 md:grid-cols-5',
  6: 'grid-cols-3 md:grid-cols-6',
};

export function ActionGrid({ items, cols = 4 }: ActionGridProps) {
  return (
    <div className={`grid ${colsClass[cols]} gap-3`}>
      {items.map((it, i) => {
        const accent = it.accent || 'emerald';
        const Tag: any = it.href ? 'a' : 'button';
        return (
          <Tag
            key={i}
            href={it.href}
            onClick={it.onClick}
            className="group aux-card aux-card-pad text-left flex flex-col items-start gap-3 hover:-translate-y-0.5 transition-all duration-300 hover:border-primary/30"
          >
            <div className={`aux-chip aux-chip-${accent} group-hover:scale-110`}>
              <it.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 w-full">
              <p className="text-sm font-semibold text-foreground truncate">{it.label}</p>
              {it.badge && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{it.badge}</p>}
            </div>
          </Tag>
        );
      })}
    </div>
  );
}
