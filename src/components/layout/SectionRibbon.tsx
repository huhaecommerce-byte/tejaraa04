import { ReactNode } from 'react';

interface Props {
  icon?: any;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  tone?: 'primary' | 'amber' | 'sky' | 'rose' | 'violet';
}

const toneMap = {
  primary: 'before:bg-primary text-primary',
  amber: 'before:bg-amber-500 text-amber-600',
  sky: 'before:bg-sky-500 text-sky-600',
  rose: 'before:bg-rose-500 text-rose-600',
  violet: 'before:bg-violet-500 text-violet-600',
};

export function SectionRibbon({ icon: Icon, title, subtitle, action, tone = 'primary' }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className={`relative pl-4 before:content-[''] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-full ${toneMap[tone]}`}>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          <h3 className="text-base font-bold text-foreground">{title}</h3>
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
