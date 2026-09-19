import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Languages, RefreshCw, Loader2, FolderTree, ChevronRight, Download, Network, Search, X } from 'lucide-react';
import { translateCategoriesBatch } from '@/lib/categoryTranslate.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useSunsky } from '@/hooks/useSunsky';
import { toast } from 'sonner';

interface CatRow {
  category_id: number;
  parent_id: number | null;
  name: string;
  name_ar?: string | null;
  level: number;
  has_children: boolean;
  path?: string | null;
  path_ar?: string | null;
}

interface Props {
  /** Called when user clicks any row — receives the SunSky category id and full path. */
  onBrowse: (categoryId: number, path: string) => void;
  /** Currently selected category id (for highlighting). */
  selectedCategoryId?: number | null;
}

type Accent = 'sky' | 'emerald' | 'violet';

interface SectionProps {
  title: string;
  rows: CatRow[];
  selectedId: number | null;
  filter: string;
  setFilter: (v: string) => void;
  onPick: (row: CatRow) => void;
  emptyText: string;
  accent: Accent;
  loading?: boolean;
}

function Section({
  title, rows, selectedId, filter, setFilter, onPick, emptyText, accent, loading,
}: SectionProps) {
  const dotClass = accent === 'sky' ? 'bg-sky-500' : accent === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500';
  const selectedClass = accent === 'sky'
    ? 'bg-sky-50 border-sky-300 dark:bg-sky-950/40'
    : accent === 'emerald'
    ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40'
    : 'bg-violet-50 border-violet-300 dark:bg-violet-950/40';
  return (
    <div className="flex flex-col rounded-md border bg-card">
      <div className="px-2 pt-2 pb-1.5 border-b">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${dotClass}`} />
            <h3 className="text-xs font-semibold uppercase tracking-wide">{title}</h3>
            {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">{rows.length}</Badge>
        </div>
        <Input
          placeholder="Filter…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-7 text-xs"
        />
      </div>
      <div className="flex-1 overflow-y-auto max-h-[28vh]">
        {loading && rows.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground text-center">
            <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground italic text-center">{emptyText}</div>
        ) : (
          rows.map((r) => {
            const isSelected = selectedId === r.category_id;
            return (
              <button
                type="button"
                key={r.category_id}
                className={`w-full flex items-center gap-1 px-2 py-1.5 border-b last:border-0 text-left text-xs transition-colors ${
                  isSelected ? selectedClass : 'hover:bg-muted/60'
                }`}
                onClick={() => onPick(r)}
              >
                <span className="flex-1 min-w-0">
                  <span className="block truncate">{r.name}</span>
                  {r.name_ar && <span dir="rtl" className="block truncate text-[10px] text-muted-foreground">{r.name_ar}</span>}
                </span>
                {r.has_children && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export function SunskyCategoryTree({ onBrowse, selectedCategoryId }: Props) {
  const { call, loading: rpcLoading } = useSunsky();
  const [allRows, setAllRows] = useState<CatRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [topId, setTopId] = useState<number | null>(null);
  const [subId, setSubId] = useState<number | null>(null);
  const [filterTop, setFilterTop] = useState('');
  const [filterSub, setFilterSub] = useState('');
  const [filterDetail, setFilterDetail] = useState('');
  const [loadingChildrenOf, setLoadingChildrenOf] = useState<Set<number>>(new Set());
  const [fetchedChildrenOf, setFetchedChildrenOf] = useState<Set<number>>(new Set());
  const [fullSync, setFullSync] = useState<null | { total: number; pending: number; expanded: number }>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const stopFullSync = useRef(false);
  const [translating, setTranslating] = useState<null | { total: number; remaining: number }>(null);
  const stopTranslate = useRef(false);
  const runTranslation = useServerFn(translateCategoriesBatch);

  useEffect(() => { void loadAll(false); }, []);

  async function translateAll(retranslate = false) {
    stopTranslate.current = false;
    setTranslating({ total: allRows.length, remaining: allRows.length });
    try {
      for (let i = 0; i < 60; i++) {
        if (stopTranslate.current) break;
        const r = await runTranslation({ data: { limit: 300, retranslate: retranslate && i === 0 } });
        setTranslating({ total: r.total, remaining: r.remaining });
        if (r.done) {
          toast.success(
            r.remaining === 0
              ? `All ${r.total.toLocaleString()} categories translated and saved in Arabic`
              : `Stopped — ${r.remaining.toLocaleString()} categories still untranslated`,
          );
          break;
        }
      }
      setAllRows(await fetchAll());
    } catch (e: any) {
      toast.error(e?.message ?? 'Translation failed');
    } finally {
      setTranslating(null);
    }
  }


  async function syncFullTree() {
    stopFullSync.current = false;
    setFullSync({ total: 0, pending: 0, expanded: 0 });
    let expandedTotal = 0;
    try {
      for (let i = 0; i < 400; i++) {
        if (stopFullSync.current) break;
        const r = await call<any>('category/sync-all', i === 0 ? { reset: true, batch: 15 } : { batch: 15 }, { silent: true });
        if (r.result !== 'success') {
          toast.error((r.messages || ['Category sync failed']).join(' · '));
          break;
        }
        const d = r.data ?? {};
        expandedTotal += Number(d.expanded ?? 0);
        setFullSync({ total: Number(d.total ?? 0), pending: Number(d.pending ?? 0), expanded: expandedTotal });
        if (d.done) {
          toast.success(`Full category tree synced — ${Number(d.total ?? 0).toLocaleString()} categories`);
          break;
        }
      }
      setAllRows(await fetchAll());
      setFetchedChildrenOf(new Set());
    } finally {
      setFullSync(null);
    }
  }

  function exportCsv() {
    const byId = new Map(allRows.map((r) => [r.category_id, r]));
    const pathOf = (r: CatRow): string => {
      if (r.path) return r.path;
      const parts: string[] = [];
      let cur: CatRow | undefined = r;
      const seen = new Set<number>();
      while (cur && !seen.has(cur.category_id)) {
        seen.add(cur.category_id);
        parts.unshift(cur.name);
        cur = cur.parent_id != null ? byId.get(cur.parent_id) : undefined;
      }
      return parts.join(' > ');
    };
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = ['category_id,parent_id,level,name,path'];
    for (const r of [...allRows].sort((a, b) => pathOf(a).localeCompare(pathOf(b)))) {
      lines.push([r.category_id, r.parent_id ?? '', r.level, esc(r.name), esc(pathOf(r))].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sunsky-categories.csv';
    a.click();
    URL.revokeObjectURL(url);
  }


  async function fetchAll(): Promise<CatRow[]> {
    const PAGE = 1000;
    let from = 0;
    const out: CatRow[] = [];
    for (let i = 0; i < 20; i++) {
      const { data, error } = await supabase
        .from('sunsky_categories')
        .select('category_id,parent_id,name,name_ar,level,has_children,path,path_ar')
        .order('name')
        .range(from, from + PAGE - 1);
      if (error) break;
      const batch = (data ?? []) as CatRow[];
      out.push(...batch);
      if (batch.length < PAGE) break;
      from += PAGE;
    }
    return out;
  }

  async function loadAll(forceSync: boolean) {
    setLoading(true);
    try {
      if (forceSync) {
        setSyncing(true);
        const r = await call('category/sync-roots', {});
        if (r.result !== 'success') toast.error('Failed to sync category tree');
        setSyncing(false);
        setFetchedChildrenOf(new Set());
      }
      let rows = await fetchAll();
      if ((!rows || rows.length === 0) && !forceSync) {
        setSyncing(true);
        await call('category/sync-roots', {});
        setSyncing(false);
        rows = await fetchAll();
      }
      setAllRows(rows);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }

  const fetchChildren = useCallback(async (parentId: number) => {
    if (fetchedChildrenOf.has(parentId)) return;
    setLoadingChildrenOf((s) => new Set(s).add(parentId));
    try {
      const r = await call('category/children', { categoryId: parentId });
      if (r.result !== 'success') {
        toast.error(`Could not load sub-categories for #${parentId}`);
      }
      const rows = await fetchAll();
      setAllRows(rows);
      setFetchedChildrenOf((s) => new Set(s).add(parentId));
    } finally {
      setLoadingChildrenOf((s) => {
        const next = new Set(s);
        next.delete(parentId);
        return next;
      });
    }
  }, [call, fetchedChildrenOf]);

  const tops = useMemo(
    () => allRows.filter((r) => r.parent_id == null).sort((a, b) => a.name.localeCompare(b.name)),
    [allRows]
  );
  const subs = useMemo(
    () => topId == null ? [] : allRows.filter((r) => r.parent_id === topId).sort((a, b) => a.name.localeCompare(b.name)),
    [allRows, topId]
  );
  const details = useMemo(
    () => subId == null ? [] : allRows.filter((r) => r.parent_id === subId).sort((a, b) => a.name.localeCompare(b.name)),
    [allRows, subId]
  );

  const filteredTops = useMemo(
    () => filterTop ? tops.filter((r) => r.name.toLowerCase().includes(filterTop.toLowerCase())) : tops,
    [tops, filterTop]
  );
  const filteredSubs = useMemo(
    () => filterSub ? subs.filter((r) => r.name.toLowerCase().includes(filterSub.toLowerCase())) : subs,
    [subs, filterSub]
  );
  const filteredDetails = useMemo(
    () => filterDetail ? details.filter((r) => r.name.toLowerCase().includes(filterDetail.toLowerCase())) : details,
    [details, filterDetail]
  );

  function pickTop(row: CatRow) {
    setTopId(row.category_id);
    setSubId(null);
    setFilterSub('');
    setFilterDetail('');
    const cachedSubs = allRows.filter((r) => r.parent_id === row.category_id);
    if (cachedSubs.length === 0 && !fetchedChildrenOf.has(row.category_id)) {
      void fetchChildren(row.category_id);
    }
    onBrowse(row.category_id, row.name);
  }
  function pickSub(row: CatRow) {
    setSubId(row.category_id);
    setFilterDetail('');
    const cachedDetails = allRows.filter((r) => r.parent_id === row.category_id);
    if (cachedDetails.length === 0 && !fetchedChildrenOf.has(row.category_id)) {
      void fetchChildren(row.category_id);
    }
    const top = tops.find((t) => t.category_id === topId);
    const path = [top?.name, row.name].filter(Boolean).join(' › ');
    onBrowse(row.category_id, path);
  }
  function pickDetail(row: CatRow) {
    const top = tops.find((t) => t.category_id === topId);
    const sub = subs.find((s) => s.category_id === subId);
    const path = [top?.name, sub?.name, row.name].filter(Boolean).join(' › ');
    onBrowse(row.category_id, path);
  }

  const subsLoading = topId != null && loadingChildrenOf.has(topId);
  const detailsLoading = subId != null && loadingChildrenOf.has(subId);

  const pathIndex = useMemo(() => {
    const byId = new Map(allRows.map((r) => [r.category_id, r]));
    const resolve = (r: CatRow): string => {
      if (r.path) return r.path;
      const parts: string[] = [];
      let cur: CatRow | undefined = r;
      const seen = new Set<number>();
      while (cur && !seen.has(cur.category_id)) {
        seen.add(cur.category_id);
        parts.unshift(cur.name);
        cur = cur.parent_id != null ? byId.get(cur.parent_id) : undefined;
      }
      return parts.join(' › ');
    };
    return allRows.map((r) => ({ row: r, path: resolve(r) }));
  }, [allRows]);

  const searchHits = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (q.length < 2) return [];
    return pathIndex.filter((e) => e.path.toLowerCase().includes(q)).slice(0, 60);
  }, [pathIndex, globalSearch]);

  const levelCounts = useMemo(() => {
    const m: Record<number, number> = {};
    for (const r of allRows) m[r.level] = (m[r.level] ?? 0) + 1;
    return m;
  }, [allRows]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FolderTree className="h-4 w-4" /> Categories
            {allRows.length > 0 && (
              <span className="text-[10px] font-normal text-muted-foreground">
                {allRows.length.toLocaleString()} total · L1 {levelCounts[1] ?? 0} · L2 {levelCounts[2] ?? 0} · L3 {levelCounts[3] ?? 0}
                {levelCounts[4] ? ` · L4 ${levelCounts[4]}` : ''}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={() => loadAll(true)} disabled={loading || rpcLoading || fullSync !== null} className="h-7 text-xs">
              {syncing || rpcLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              <span className="ml-1">Sync top</span>
            </Button>
            <Button
              size="sm"
              variant={fullSync ? 'secondary' : 'default'}
              onClick={() => (fullSync ? (stopFullSync.current = true) : void syncFullTree())}
              disabled={loading}
              className="h-7 text-xs"
            >
              {fullSync ? <Loader2 className="h-3 w-3 animate-spin" /> : <Network className="h-3 w-3" />}
              <span className="ml-1">{fullSync ? 'Stop' : 'Sync full tree'}</span>
            </Button>
            <Button
              size="sm"
              variant={translating ? 'secondary' : 'outline'}
              onClick={() => (translating ? (stopTranslate.current = true) : void translateAll(false))}
              disabled={loading || fullSync !== null || allRows.length === 0}
              className="h-7 text-xs"
              title="Translate every category name into Arabic once and save it"
            >
              {translating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
              <span className="ml-1">{translating ? 'Stop' : 'Translate to Arabic'}</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={exportCsv} disabled={allRows.length === 0} className="h-7 text-xs">
              <Download className="h-3 w-3" /><span className="ml-1">CSV</span>
            </Button>
          </div>
        </div>
        {fullSync && (
          <div className="mt-2 rounded-md border bg-muted/40 px-2 py-1.5 text-[11px] text-muted-foreground">
            Crawling SunSky… {fullSync.total.toLocaleString()} categories saved ·
            {' '}{fullSync.pending.toLocaleString()} branches left · {fullSync.expanded} requests
          </div>
        )}
        {translating && (
          <div className="mt-2 rounded-md border bg-muted/40 px-2 py-1.5 text-[11px] text-muted-foreground">
            Translating into Arabic… {(translating.total - translating.remaining).toLocaleString()} of
            {' '}{translating.total.toLocaleString()} saved
          </div>
        )}
        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search the whole tree by name or path…"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="h-7 pl-7 pr-7 text-xs"
          />
          {globalSearch && (
            <button type="button" onClick={() => setGlobalSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {searchHits.length > 0 ? (
          <div className="rounded-md border max-h-[60vh] overflow-y-auto">
            {searchHits.map(({ row, path }) => (
              <button
                key={row.category_id}
                type="button"
                onClick={() => onBrowse(row.category_id, path)}
                className={`w-full border-b last:border-0 px-2 py-1.5 text-left text-xs hover:bg-muted/60 ${
                  selectedCategoryId === row.category_id ? 'bg-muted' : ''
                }`}
              >
                <span className="block truncate">{path}</span>
                {row.path_ar && <span dir="rtl" className="block truncate text-[11px] text-muted-foreground">{row.path_ar}</span>}
                <span className="text-[10px] text-muted-foreground">Level {row.level} · #{row.category_id}</span>
              </button>
            ))}
          </div>
        ) : globalSearch.trim().length >= 2 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">No categories match "{globalSearch}".</div>
        ) : loading && allRows.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
            Loading…
          </div>
        ) : tops.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No categories cached. Click "Sync full tree" to fetch everything from SunSky.
          </div>
        ) : (
          <div className="space-y-2">
            <Section
              title="Top"
              rows={filteredTops}
              selectedId={topId}
              filter={filterTop}
              setFilter={setFilterTop}
              onPick={pickTop}
              emptyText="No matches"
              accent="sky"
            />
            <Section
              title="Sub"
              rows={filteredSubs}
              selectedId={subId}
              filter={filterSub}
              setFilter={setFilterSub}
              onPick={pickSub}
              emptyText={topId == null ? 'Pick a top category' : 'No sub categories'}
              accent="emerald"
              loading={subsLoading}
            />
            <Section
              title="Detail"
              rows={filteredDetails}
              selectedId={selectedCategoryId ?? null}
              filter={filterDetail}
              setFilter={setFilterDetail}
              onPick={pickDetail}
              emptyText={subId == null ? 'Pick a sub category' : 'No detail categories'}
              accent="violet"
              loading={detailsLoading}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
