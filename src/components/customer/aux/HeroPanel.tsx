import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface Stat { label: string; value: string | number; icon?: LucideIcon }

interface HeroPanelProps {
  eyebrow?: string;
  title: string;
  value?: string | number;
  valueSuffix?: string;
  description?: string;
  actions?: ReactNode;
  stats?: Stat[];
  icon?: LucideIcon;
  className?: string;
}

export function HeroPanel({ eyebrow, title, value, valueSuffix, description, actions, stats, icon: Icon, className = '' }: HeroPanelProps) {
  return (
    <div className={`aux-hero p-6 md:p-8 ${className}`}>
      <div className="aux-hero-blob -right-16 -top-16 w-56 h-56" />
      <div className="aux-hero-blob -right-24 -bottom-24 w-64 h-64" style={{ background: 'hsl(0 0% 100% / 0.05)' }} />
      <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="flex-1 min-w-0">
          {eyebrow && <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/70 mb-2">{eyebrow}</p>}
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25 flex items-center justify-center shrink-0">
                <Icon className="h-6 w-6 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">{title}</h1>
              {description && <p className="text-sm text-white/80 mt-1 max-w-md">{description}</p>}
            </div>
          </div>
          {value !== undefined && (
            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-bold tracking-tight aux-num">{value}</span>
              {valueSuffix && <span className="text-sm text-white/70 font-medium">{valueSuffix}</span>}
            </div>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>

      {stats && stats.length > 0 && (
        <div className="relative mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 pt-5 border-t border-white/15">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-2.5">
              {s.icon && (
                <div className="w-8 h-8 rounded-lg bg-white/10 ring-1 ring-white/15 flex items-center justify-center shrink-0">
                  <s.icon className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-white/60 font-medium truncate">{s.label}</p>
                <p className="text-sm font-bold aux-num truncate">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
