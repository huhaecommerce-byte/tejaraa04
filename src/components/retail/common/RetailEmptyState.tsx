import type { ComponentType, SVGProps } from 'react';
import { PackageOpen } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';

interface RetailEmptyStateProps {
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function RetailEmptyState({ icon: Icon = PackageOpen, title, description, actionLabel, actionHref }: RetailEmptyStateProps) {
  return <div className="flex min-h-48 flex-col items-center justify-center px-4 py-8 text-center"><span className="grid h-11 w-11 place-items-center rounded-lg bg-retail-light-green text-retail-green"><Icon className="h-5 w-5" /></span><h2 className="mt-3 text-base font-bold text-retail-text">{title}</h2><p className="mt-1 max-w-md text-sm text-retail-muted">{description}</p>{actionLabel && actionHref && <Button asChild className="mt-4"><Link to={actionHref}>{actionLabel}</Link></Button>}</div>;
}