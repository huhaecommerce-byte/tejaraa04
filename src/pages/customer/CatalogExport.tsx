import { useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, History, Loader2, Lock, Sparkles, FileText, Trash2 } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CategorySidebar,
  emptySelection,
  type CategorySelection,
  type AggregatedCount,
} from '@/components/customer/CategorySidebar';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  loadRecentExports,
  saveRecentExport,
  getRecentExportBlob,
  removeRecentExport,
  type RecentExport,
} from '@/components/customer/RecentExports';

type ExportFormat = 'csv' | 'xlsx';

interface UsageRow {
  id: string;
  created_at: string;
  count: number;
  metadata: any;
}

function startOfMonthIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CatalogExportPage() {
  const { user } = useAuth();
  const { getLimit, numericLimit, isLoading: planLoading } = useCurrentPlan();

  const access = (getLimit('catalog_export') || 'no').toLowerCase();
  const accessState: 'blocked' | 'limited' | 'unlimited' =
    access === 'unlimited' ? 'unlimited' : access === 'no' || access === '' || access === '0' ? 'blocked' : 'limited';
  const quota = accessState === 'blocked' ? 0 : numericLimit('catalog_export_qty_monthly');

  const [counts, setCounts] = useState<AggregatedCount[]>([]);
  const [selection, setSelection] = useState<CategorySelection>(emptySelection());
  const [source, setSource] = useState<'all' | 'local' | 'global'>('all');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(100);

  const [used, setUsed] = useState(0);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);


  const [history, setHistory] = useState<UsageRow[]>([]);
  const [localExports, setLocalExports] = useState<RecentExport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const remaining = useMemo(() => (isFinite(quota) ? Math.max(0, quota - used) : Infinity), [quota, used]);
  const blocked = accessState === 'blocked';
  const exhausted = !blocked && isFinite(remaining) && remaining <= 0;
  const usagePct = isFinite(quota) && quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;

  // Categories
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fetchCounts = async (view: string) => {
        const all: any[] = [];
        for (let p = 0; p < 50; p++) {
          const { data, error } = await supabase
            .from(view as any)
            .select('top_category, sub_category, detailed_category, cnt')
            .range(p * 1000, p * 1000 + 999);
          if (error) return { data: null, error };
          all.push(...(data ?? []));
          if (!data || data.length < 1000) break;
        }
        return { data: all, error: null as any };
      };
      let { data, error } = await fetchCounts('product_category_counts_cache');
      if (error && (error as any).code === '42P01') ({ data, error } = await fetchCounts('product_category_counts'));
      if (!cancelled && data) setCounts(data as AggregatedCount[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Usage + history
  const loadUsage = async () => {
    if (!user?.id) {
      setLoadingUsage(false);
      setLoadingHistory(false);
      return;
    }
    setLoadingUsage(true);
    setLoadingHistory(true);
    const [{ data: monthRows }, { data: allRows }] = await Promise.all([
      supabase
        .from('catalog_usage_log')
        .select('count')
        .eq('user_id', user.id)
        .eq('action', 'csv_export')
        .gte('created_at', startOfMonthIso()),
      supabase
        .from('catalog_usage_log')
        .select('id, created_at, count, metadata')
        .eq('user_id', user.id)
        .eq('action', 'csv_export')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);
    setUsed((monthRows ?? []).reduce((s: number, r: any) => s + (Number(r.count) || 0), 0));
    setHistory((allRows ?? []) as UsageRow[]);
    setLoadingUsage(false);
    setLoadingHistory(false);
  };

  useEffect(() => {
    loadUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const sync = () => setLocalExports(loadRecentExports());
    sync();
    window.addEventListener('recent-exports-updated', sync);
    return () => window.removeEventListener('recent-exports-updated', sync);
  }, []);

  useEffect(() => {
    if (isFinite(remaining)) setLimit((l) => Math.min(Math.max(1, l), Math.max(1, remaining)));
  }, [remaining]);

  const csvEscape = (v: any) => {
    if (v === null || v === undefined) return '""';
    const s = Array.isArray(v) ? v.join(' | ') : String(v);
    return `"${s.replace(/\r?\n|\r/g, ' ').replace(/"/g, '""')}"`;
  };

  const runExport = async () => {
    if (!user?.id) {
      toast.error('Please sign in.');
      return;
    }
    if (blocked || exhausted || submitting) return;
    setSubmitting(true);
    const target = Math.max(1, isFinite(remaining) ? Math.min(limit, remaining) : limit);
    setProgress({ done: 0, total: target });
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const CHUNK = 5000;
      const allRows: Record<string, any>[] = [];
      const colSet = new Set<string>();
      let offset = 0;
      let quotaUsed = 0;
      let failure: string | null = null;

      while (allRows.length < target) {
        const take = Math.min(CHUNK, target - allRows.length);
        const res = await fetch('/api/fn/catalog-export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            format: 'json',
            limit: take,
            offset,
            source,
            search: search.trim(),
            categories: Array.from(selection.keys),
          }),
        });
        if (!res.ok) {
          const j: any = await res.json().catch(() => ({}));
          failure = j.error || 'Export failed';
          break;
        }
        const j: any = await res.json();
        (j.columns ?? []).forEach((c: string) => colSet.add(c));
        const batch: Record<string, any>[] = j.rows ?? [];
        allRows.push(...batch);
        if (j.quotaUsed) quotaUsed = j.quotaUsed;
        offset += take;
        setProgress({ done: allRows.length, total: target });
        if (batch.length < take) break;
      }

      if (allRows.length === 0) {
        toast.error(failure || 'No products match these filters.');
        return;
      }
      if (failure) toast.warning(`${failure} — downloading the ${allRows.length.toLocaleString()} rows collected.`);

      const baseCols = Array.from(colSet).filter((c) => !/^image_\d+$/.test(c));
      const imgCols = Array.from(colSet)
        .filter((c) => /^image_\d+$/.test(c))
        .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)));
      const cols = [...baseCols, ...imgCols];

      const ext = format === 'xlsx' ? 'xlsx' : 'csv';
      const filename = `tejaraa-catalog-${new Date().toISOString().slice(0, 10)}.${ext}`;

      let blob: Blob;
      if (format === 'xlsx') {
        const XLSX = await import('xlsx');
        const ws = XLSX.utils.json_to_sheet(allRows, { header: cols });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Products');
        const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
        blob = new Blob([buf], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
      } else {
        const parts: string[] = ['\uFEFF' + cols.map(csvEscape).join(',') + '\r\n'];
        for (let i = 0; i < allRows.length; i += 2000) {
          parts.push(
            allRows
              .slice(i, i + 2000)
              .map((r) => cols.map((c) => csvEscape(r[c])).join(','))
              .join('\r\n') + '\r\n',
          );
        }
        blob = new Blob(parts, { type: 'text/csv;charset=utf-8' });
      }

      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);

      await saveRecentExport({ filename, format, rows: allRows.length, size: blob.size, blob });
      if (quotaUsed) setUsed(quotaUsed);
      toast.success(`Exported ${allRows.length.toLocaleString()} products.`);
      loadUsage();
    } catch (e: any) {
      toast.error(e?.message || 'Export failed');
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };


  const downloadAgain = (item: RecentExport) => {
    const blob = getRecentExportBlob(item.id);
    if (!blob) {
      toast.info('This file is no longer cached in this tab. Run the export again.');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = item.filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const totalExported = history.reduce((s, r) => s + (Number(r.count) || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Export catalog"
        highlight="Export"
        subtitle="Download products as CSV or Excel — name, SKU, prices, categories and image URLs. Filter by category, source and quantity."
        guide={{
          chip: 'How it works',
          intro: 'Build your export in three steps.',
          steps: [
            { title: 'Pick categories', description: 'Leave empty to export the full catalog.' },
            { title: 'Set filters', description: 'Source, keyword, format and number of rows.' },
            { title: 'Download', description: 'Your file downloads instantly and is logged below.' },
          ],
        }}
      />

      {/* Quota strip */}
      <Card>
        <CardContent className="p-4">
          {loadingUsage || planLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Checking your plan usage…
            </div>
          ) : blocked ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> Catalog export is not included in your current plan.
              </span>
              <Link to="/pricing">
                <Button size="sm" className="h-7 gap-1 text-xs">
                  <Sparkles className="h-3 w-3" /> Upgrade
                </Button>
              </Link>
            </div>
          ) : !isFinite(quota) ? (
            <div className="flex items-center gap-2 text-xs">
              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Unlimited</Badge>
              <span className="text-muted-foreground">Your plan has no monthly cap on catalog exports.</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">
                  Used <span className="font-medium text-foreground">{used.toLocaleString()}</span> of{' '}
                  <span className="font-medium text-foreground">{quota.toLocaleString()}</span> rows this month
                </span>
                <span className={cn('font-medium', remaining === 0 ? 'text-destructive' : 'text-foreground')}>
                  {remaining.toLocaleString()} remaining
                </span>
              </div>
              <Progress value={usagePct} className="h-1.5" />
              {exhausted && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-destructive">Monthly quota reached.</span>
                  <Link to="/pricing">
                    <Button size="sm" className="h-7 gap-1 text-xs">
                      <Sparkles className="h-3 w-3" /> Upgrade
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="export" className="space-y-4">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="export" className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> New export
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-3.5 w-3.5" /> History
            {history.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {history.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4 mt-0">
      {/* Builder */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[360px_1fr]">
          <div className="border-b md:border-b-0 md:border-r bg-muted/10 flex flex-col h-[45dvh] min-h-[280px] md:h-[520px]">
            <div className="px-3 py-2 border-b bg-background/50 shrink-0">
              <div className="text-xs font-medium">Categories</div>
              <div className="text-[10px] text-muted-foreground">
                {selection.keys.size === 0 ? 'All categories' : `${selection.keys.size} selected`}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <CategorySidebar
                aggregatedCounts={counts.length ? counts : undefined}
                selection={selection}
                onChange={setSelection}
                className="h-full"
              />
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Source</Label>
                <Select value={source} onValueChange={(v: any) => setSource(v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="local">Local (KSA)</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Format</Label>
                <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Keyword (optional)</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. phone case"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Number of rows{' '}
                {isFinite(remaining) && <span className="text-muted-foreground">(max {remaining.toLocaleString()})</span>}
              </Label>
              <Input
                type="number"
                min={1}
                max={isFinite(remaining) ? remaining : 2000000}
                value={limit}
                onChange={(e) => setLimit(Math.max(1, Number(e.target.value) || 1))}
                className="h-9 text-xs"
                disabled={blocked || exhausted}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[1000, 10000, 50000, 100000].map((n) => (
                  <Button
                    key={n}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10px]"
                    disabled={blocked || exhausted || submitting}
                    onClick={() => setLimit(isFinite(remaining) ? Math.min(n, remaining) : n)}
                  >
                    {n.toLocaleString()}
                  </Button>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px]"
                  disabled={blocked || exhausted || submitting}
                  onClick={() => setLimit(isFinite(remaining) ? remaining : 2000000)}
                >
                  Whole catalog
                </Button>
              </div>
            </div>

            {progress && (
              <div className="space-y-1.5 rounded-md border bg-muted/20 p-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Preparing your file…
                  </span>
                  <span className="font-medium">
                    {progress.done.toLocaleString()} / {progress.total.toLocaleString()} rows
                  </span>
                </div>
                <Progress
                  value={progress.total ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0}
                  className="h-2"
                />
                <p className="text-[10px] text-muted-foreground">
                  Large exports are downloaded in batches — keep this page open until it finishes.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-1">

              <Button onClick={runExport} disabled={blocked || exhausted || submitting} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export
              </Button>
            </div>
          </div>
        </div>
      </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
      {/* History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-primary" /> Export history
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {history.length.toLocaleString()} exports · {totalExported.toLocaleString()} rows exported in total
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {localExports.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-medium">Available to re-download (this session)</div>
              {localExports.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded border bg-background px-2.5 py-2">
                  <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{item.filename}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {item.rows.toLocaleString()} rows · {formatSize(item.size)}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => downloadAgain(item)}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      removeRecentExport(item.id);
                      setLocalExports(loadRecentExports());
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {loadingHistory ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading history…
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No exports yet. Your export activity will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Format</th>
                    <th className="py-2 pr-3 font-medium">Requested</th>
                    <th className="py-2 pr-3 font-medium text-right">Rows exported</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3 uppercase">
                        <span className="inline-flex items-center gap-1">
                          <FileSpreadsheet className="h-3 w-3 text-primary" />
                          {row.metadata?.format ?? 'csv'}
                        </span>
                      </td>
                      <td className="py-2 pr-3">{Number(row.metadata?.requested ?? 0).toLocaleString() || '—'}</td>
                      <td className="py-2 pr-3 text-right font-medium">{Number(row.count || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
