import type { ReactNode } from 'react';

export function ListingToolbar({ resultLabel, mobileFilters, sortControl }: { resultLabel: string; mobileFilters?: ReactNode; sortControl?: ReactNode }) {
  return <div id="listing-results" className="scroll-mt-40 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-retail-border bg-retail-card p-2.5"><p className="text-sm font-bold text-retail-text">{resultLabel}</p><div className="flex w-full items-center gap-2 sm:w-auto">{mobileFilters}{sortControl}</div></div>;
}