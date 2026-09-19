import type { ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RetailFilterSidebar({ children, hasFilters, onClear }: { children: ReactNode; hasFilters: boolean; onClear: () => void }) {
  return <aside className="hidden lg:block"><div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto rounded-lg border border-retail-border bg-retail-card px-4"><div className="flex items-center justify-between border-b border-retail-border py-3"><h2 className="flex items-center gap-2 text-sm font-bold"><SlidersHorizontal className="h-4 w-4 text-retail-green" />Filters</h2>{hasFilters && <Button type="button" variant="ghost" size="sm" onClick={onClear} className="h-7 px-2 text-xs text-retail-green">Clear all</Button>}</div>{children}</div></aside>;
}