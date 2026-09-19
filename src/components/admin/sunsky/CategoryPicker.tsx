import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useSunsky } from '@/hooks/useSunsky';

export interface SunskyCategorySelection {
  categoryId: number | null;
  path: string; // e.g. "Phones › Cases › iPhone 15"
}

interface CatRow {
  category_id: number;
  parent_id: number | null;
  name: string;
  level: number;
  has_children: boolean;
}

interface Props {
  value: SunskyCategorySelection;
  onChange: (v: SunskyCategorySelection) => void;
}

export function SunskyCategoryPicker({ value, onChange }: Props) {
  const { call, loading: rpcLoading } = useSunsky();
  const [roots, setRoots] = useState<CatRow[]>([]);
  const [subs, setSubs] = useState<CatRow[]>([]);
  const [leafs, setLeafs] = useState<CatRow[]>([]);
  const [picked, setPicked] = useState<{ root?: CatRow; sub?: CatRow; leaf?: CatRow }>({});
  const [busy, setBusy] = useState<'roots' | 'subs' | 'leafs' | null>(null);

  // Initial load: read cached roots; if empty, sync.
  useEffect(() => { loadRoots(false); }, []);

  async function loadRoots(force: boolean) {
    setBusy('roots');
    try {
      if (force) await call('category/sync-roots', {});
      let { data } = await supabase
        .from('sunsky_categories').select('category_id,parent_id,name,level,has_children')
        .is('parent_id', null).order('name');
      if ((!data || data.length === 0) && !force) {
        await call('category/sync-roots', {});
        ({ data } = await supabase
          .from('sunsky_categories').select('category_id,parent_id,name,level,has_children')
          .is('parent_id', null).order('name'));
      }
      setRoots((data ?? []) as CatRow[]);
    } finally { setBusy(null); }
  }

  async function loadChildren(parent: CatRow, target: 'subs' | 'leafs') {
    setBusy(target);
    try {
      let { data } = await supabase
        .from('sunsky_categories').select('category_id,parent_id,name,level,has_children')
        .eq('parent_id', parent.category_id).order('name');
      if (!data || data.length === 0) {
        await call('category/children', { categoryId: parent.category_id });
        ({ data } = await supabase
          .from('sunsky_categories').select('category_id,parent_id,name,level,has_children')
          .eq('parent_id', parent.category_id).order('name'));
      }
      const rows = (data ?? []) as CatRow[];
      if (target === 'subs') { setSubs(rows); setLeafs([]); }
      else setLeafs(rows);
    } finally { setBusy(null); }
  }

  function emit(next: typeof picked) {
    const leaf = next.leaf ?? next.sub ?? next.root;
    const path = [next.root?.name, next.sub?.name, next.leaf?.name].filter(Boolean).join(' › ');
    onChange({ categoryId: leaf?.category_id ?? null, path });
  }

  function pickRoot(idStr: string) {
    const root = roots.find((r) => String(r.category_id) === idStr);
    const next = { root, sub: undefined, leaf: undefined };
    setPicked(next); setSubs([]); setLeafs([]);
    emit(next);
    if (root) loadChildren(root, 'subs');
  }
  function pickSub(idStr: string) {
    const sub = subs.find((r) => String(r.category_id) === idStr);
    const next = { ...picked, sub, leaf: undefined };
    setPicked(next); setLeafs([]);
    emit(next);
    if (sub) loadChildren(sub, 'leafs');
  }
  function pickLeaf(idStr: string) {
    const leaf = leafs.find((r) => String(r.category_id) === idStr);
    const next = { ...picked, leaf };
    setPicked(next);
    emit(next);
  }

  function clearAll() {
    setPicked({}); setSubs([]); setLeafs([]);
    onChange({ categoryId: null, path: '' });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={picked.root ? String(picked.root.category_id) : ''} onValueChange={pickRoot}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={busy === 'roots' ? 'Loading…' : 'Top category'} />
          </SelectTrigger>
          <SelectContent>
            {roots.map((r) => (
              <SelectItem key={r.category_id} value={String(r.category_id)}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={picked.sub ? String(picked.sub.category_id) : ''} onValueChange={pickSub} disabled={!picked.root}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={busy === 'subs' ? 'Loading…' : 'Sub category'} />
          </SelectTrigger>
          <SelectContent>
            {subs.map((r) => (
              <SelectItem key={r.category_id} value={String(r.category_id)}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={picked.leaf ? String(picked.leaf.category_id) : ''} onValueChange={pickLeaf} disabled={!picked.sub || leafs.length === 0}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={busy === 'leafs' ? 'Loading…' : (leafs.length === 0 ? 'No deeper level' : 'Detailed')} />
          </SelectTrigger>
          <SelectContent>
            {leafs.map((r) => (
              <SelectItem key={r.category_id} value={String(r.category_id)}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="button" variant="ghost" size="sm" onClick={() => loadRoots(true)} disabled={rpcLoading || busy !== null}>
          {busy === 'roots' || rpcLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          <span className="ml-1">Refresh</span>
        </Button>
      </div>

      {value.categoryId && (
        <Badge variant="secondary" className="gap-1">
          {value.path || `#${value.categoryId}`}
          <button type="button" onClick={clearAll} className="ml-1 hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
    </div>
  );
}
