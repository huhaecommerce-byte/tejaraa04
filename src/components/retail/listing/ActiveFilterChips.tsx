import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ActiveFilterChip { key: string; label: string }
export function ActiveFilterChips({ chips, onRemove, onClear }: { chips: ActiveFilterChip[]; onRemove: (key: string) => void; onClear: () => void }) {
  if (!chips.length) return null;
  return <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">{chips.map((chip) => <Button key={chip.key} type="button" variant="outline" size="sm" onClick={() => onRemove(chip.key)} className="h-8 gap-1 rounded-full px-3 text-xs">{chip.label}<X className="h-3 w-3" /></Button>)}<Button type="button" variant="ghost" size="sm" onClick={onClear} className="h-8 text-xs text-retail-green">Clear all</Button></div>;
}