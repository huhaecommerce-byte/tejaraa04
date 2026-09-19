import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface PageHeaderInfo {
  icon: LucideIcon;
  lead: string;
  description: string;
}

export interface GuideStep {
  title: string;
  description: string;
}

export interface PageHeaderGuide {
  chip: string;
  intro: string;
  steps: GuideStep[];
}

interface PageHeaderProps {
  title: string;
  /** A word/phrase inside `title` to wrap with the scribble-underline accent (e.g. "products"). */
  highlight?: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Legacy compact info banner. Prefer `guide` for the richer 3-step layout. */
  info?: PageHeaderInfo;
  /** Catalog-style "How to" 3-step guide card. */
  guide?: PageHeaderGuide;
  children?: ReactNode;
}

/** Renders the title, splitting on `highlight` (case-insensitive, first match) to wrap that word with `.scribble-underline`. */
function renderTitle(title: string, highlight?: string) {
  if (!highlight) return title;
  const idx = title.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return title;
  const before = title.slice(0, idx);
  const match = title.slice(idx, idx + highlight.length);
  const after = title.slice(idx + highlight.length);
  return (
    <>
      {before}
      {before && !before.endsWith(' ') ? '' : ''}
      <span className="scribble-underline text-primary">{match}</span>
      {after}
    </>
  );
}

export function GuideCard({ chip, intro, steps }: PageHeaderGuide) {
  return (
    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{chip}</div>
        <p className="text-sm text-muted-foreground">{intro}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-background/70 p-3">
            <p className="text-xs font-semibold text-primary">Step {i + 1}</p>
            <p className="mt-1 text-sm font-medium text-foreground">{s.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageHeader({ title, highlight, subtitle, actions, info, guide, children }: PageHeaderProps) {
  const Icon = info?.icon;
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight break-words">{renderTitle(title, highlight)}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1 my-0">{subtitle}</p>}
          {children}
        </div>
        {actions && (
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 [&>*]:min-h-[40px] sm:w-auto sm:shrink-0">
            {actions}
          </div>
        )}
      </div>

      {guide && <GuideCard {...guide} />}

      {!guide && info && Icon && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">{info.lead}</p>
            <p className="text-muted-foreground">{info.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
