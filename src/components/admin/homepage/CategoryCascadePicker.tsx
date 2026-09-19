import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X, ChevronRight } from 'lucide-react';
import type { CategoryFilters } from '@/lib/heroQuery';

interface Row {
  top_category: string;
  sub_category: string;
  detailed_category: string;
  cnt: number;
}

interface Props {
  value: CategoryFilters;
  onChange: (next: CategoryFilters) => void;
}

export function CategoryCascadePicker({ value, onChange }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTop, setActiveTop] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('product_category_counts_cache')
      .select('top_category, sub_category, detailed_category, cnt')
      .then(({ data }) => {
        if (data) setRows(data as any);
        setLoading(false);
      });
  }, []);

  const tops = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(r => {
      if (!r.top_category) return;
      map.set(r.top_category, (map.get(r.top_category) || 0) + Number(r.cnt));
    });
    return [...map.entries()]
      .map(([name, cnt]) => ({ name, cnt }))
      .filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, search]);

  const subs = useMemo(() => {
    if (!activeTop) return [];
    const map = new Map<string, number>();
    rows
      .filter(r => r.top_category === activeTop && r.sub_category)
      .forEach(r => {
        map.set(r.sub_category, (map.get(r.sub_category) || 0) + Number(r.cnt));
      });
    return [...map.entries()]
      .map(([name, cnt]) => ({ name, cnt }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, activeTop]);

  const detailed = useMemo(() => {
    if (!activeTop || !activeSub) return [];
    return rows
      .filter(r => r.top_category === activeTop && r.sub_category === activeSub && r.detailed_category)
      .map(r => ({ name: r.detailed_category, cnt: Number(r.cnt) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, activeTop, activeSub]);

  const toggle = (level: keyof CategoryFilters, name: string) => {
    const arr = value[level] || [];
    const next = arr.includes(name) ? arr.filter(x => x !== name) : [...arr, name];
    onChange({ ...value, [level]: next });
  };

  const removeChip = (level: keyof CategoryFilters, name: string) => {
    onChange({ ...value, [level]: (value[level] || []).filter(x => x !== name) });
  };

  const totalSelected = (value.top?.length || 0) + (value.sub?.length || 0) + (value.detailed?.length || 0);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      {totalSelected > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-muted/50 rounded-md">
          {(value.top || []).map(t => (
            <Badge key={`t-${t}`} variant="secondary" className="gap-1">
              {t}
              <button onClick={() => removeChip('top', t)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {(value.sub || []).map(s => (
            <Badge key={`s-${s}`} variant="outline" className="gap-1">
              <ChevronRight className="h-3 w-3" />{s}
              <button onClick={() => removeChip('sub', s)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {(value.detailed || []).map(d => (
            <Badge key={`d-${d}`} variant="outline" className="gap-1 border-dashed">
              <ChevronRight className="h-3 w-3" />{d}
              <button onClick={() => removeChip('detailed', d)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button
            onClick={() => onChange({ top: [], sub: [], detailed: [] })}
            className="text-xs text-muted-foreground hover:text-destructive ml-auto px-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 3-column cascade */}
      <div className="grid grid-cols-3 gap-2 border rounded-md overflow-hidden h-72">
        {/* Top */}
        <div className="overflow-y-auto bg-muted/30">
          <div className="px-2 py-1 text-[10px] uppercase font-semibold text-muted-foreground sticky top-0 bg-muted/80 backdrop-blur">
            Top category
          </div>
          {tops.map(t => (
            <div
              key={t.name}
              className={`flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted ${
                activeTop === t.name ? 'bg-muted' : ''
              }`}
              onClick={() => { setActiveTop(t.name); setActiveSub(null); }}
            >
              <Checkbox
                checked={(value.top || []).includes(t.name)}
                onCheckedChange={() => toggle('top', t.name)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="flex-1 truncate">{t.name}</span>
              <span className="text-[10px] text-muted-foreground">{t.cnt.toLocaleString()}</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </div>
          ))}
        </div>

        {/* Sub */}
        <div className="overflow-y-auto bg-muted/20 border-l">
          <div className="px-2 py-1 text-[10px] uppercase font-semibold text-muted-foreground sticky top-0 bg-muted/80 backdrop-blur">
            Sub-category
          </div>
          {!activeTop && (
            <p className="p-3 text-xs text-muted-foreground italic">Pick a top category…</p>
          )}
          {subs.map(s => (
            <div
              key={s.name}
              className={`flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted ${
                activeSub === s.name ? 'bg-muted' : ''
              }`}
              onClick={() => setActiveSub(s.name)}
            >
              <Checkbox
                checked={(value.sub || []).includes(s.name)}
                onCheckedChange={() => toggle('sub', s.name)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="flex-1 truncate">{s.name}</span>
              <span className="text-[10px] text-muted-foreground">{s.cnt.toLocaleString()}</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </div>
          ))}
        </div>

        {/* Detailed */}
        <div className="overflow-y-auto bg-muted/10 border-l">
          <div className="px-2 py-1 text-[10px] uppercase font-semibold text-muted-foreground sticky top-0 bg-muted/80 backdrop-blur">
            Detailed
          </div>
          {!activeSub && (
            <p className="p-3 text-xs text-muted-foreground italic">Pick a sub-category…</p>
          )}
          {detailed.map(d => (
            <label
              key={d.name}
              className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted"
            >
              <Checkbox
                checked={(value.detailed || []).includes(d.name)}
                onCheckedChange={() => toggle('detailed', d.name)}
              />
              <span className="flex-1 truncate">{d.name}</span>
              <span className="text-[10px] text-muted-foreground">{d.cnt.toLocaleString()}</span>
            </label>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: selecting a top category includes all its sub-categories. Add sub or detailed selections to narrow down further.
      </p>
    </div>
  );
}
