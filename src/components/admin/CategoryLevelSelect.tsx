import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CUSTOM = '__custom__';

interface Props {
  label: string;
  value: string;
  options: string[];
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}

export const CategoryLevelSelect = ({ label, value, options, disabled, placeholder, onChange }: Props) => {
  const known = value !== '' && options.includes(value);
  const [custom, setCustom] = useState(false);
  const useInput = custom || (value !== '' && !known);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          onClick={() => setCustom(c => !c)}
        >
          {useInput ? 'Pick from list' : 'Add new'}
        </Button>
      </div>
      {useInput ? (
        <Input
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <Select
          value={value || undefined}
          disabled={disabled}
          onValueChange={v => {
            if (v === CUSTOM) { setCustom(true); onChange(''); return; }
            onChange(v);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <div className="sticky top-0 z-10 bg-popover p-1.5 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={`Search ${label.toLowerCase()}…`}
                  className="h-8 pl-7 text-sm"
                  onKeyDown={e => e.stopPropagation()}
                />
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">No matches</div>
            ) : (
              filtered.map(o => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))
            )}
            <SelectItem value={CUSTOM}>+ Add new…</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default CategoryLevelSelect;
