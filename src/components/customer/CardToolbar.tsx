import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface CardToolbarProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  right?: ReactNode;
}

export function CardToolbar({ title, subtitle, icon: Icon, right }: CardToolbarProps) {
  return (
    <div className="cuba-toolbar">
      <div className="min-w-0">
        <h3 className="text-base font-semibold flex items-center gap-2 truncate">
          {Icon && <Icon className="h-4 w-4 text-primary shrink-0" />}
          {title}
        </h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
