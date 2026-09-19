import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from "@/lib/router-compat";
import { Cloud, RefreshCw, Wallet, ListChecks,
  Webhook, Activity, Settings as SettingsIcon, Search, Plus,
  Loader2, Copy, CheckCircle2, XCircle, ExternalLink, BookOpen, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSunsky } from '@/hooks/useSunsky';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SunskyCategoryTree } from '@/components/admin/sunsky/CategoryTree';
import { SunskyProductBrowser } from '@/components/admin/sunsky/ProductBrowser';
import { SunskyOrdersPanel, SunskyCouponsPanel, SunskyHotItemsPanel } from '@/components/admin/sunsky/OpsPanels';
import { SUNSKY_DOCS, SUNSKY_DOC_GROUPS, SUNSKY_PRODUCT_STATUS, statusLabel, SUNSKY_LEAD_TIME } from '@/data/sunskyDocs';

const TABS = [
  { id: 'overview',   label: 'Overview',   icon: Activity },
  { id: 'products',   label: 'Products',   icon: Search },
  { id: 'catalog',    label: 'Bulk import', icon: ListChecks },
  { id: 'imported',   label: 'Imported',   icon: ListChecks },
  { id: 'orders',     label: 'Orders',     icon: Truck },
  { id: 'coupons',    label: 'Coupons',    icon: Wallet },
  { id: 'stats',      label: 'Hot items',  icon: Activity },
  { id: 'callbacks',  label: 'Webhooks',   icon: Webhook },
  { id: 'logs',       label: 'Logs',       icon: Activity },
  { id: 'docs',       label: 'Docs',       icon: BookOpen },
  { id: 'settings',   label: 'Settings',   icon: SettingsIcon },
] as const;

type TabId = typeof TABS[number]['id'];

export default function SunSkyHub() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabId) || 'overview';
  const setTab = (t: TabId) => {
    const np = new URLSearchParams(params);
    np.set('tab', t);
    setParams(np, { replace: true });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white flex items-center justify-center shadow-md">
            <Cloud className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SunSky Integration</h1>
            <p className="text-sm text-muted-foreground">Catalog · Categories · Webhooks — all in one panel.</p>
          </div>
        </div>
        <KpiStrip />
      </header>

      <div className="space-y-4">
        <ScrollArea className="w-full">
          <div role="tablist" className="bg-muted/40 p-1 rounded-xl flex w-max gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center justify-start gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted/60 hover:text-foreground ${tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
              >
                <t.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </ScrollArea>

        {tab === 'overview' && <OverviewTab />}
        {tab === 'products' && <SunskyProductBrowser />}
        {tab === 'catalog' && <CatalogTab />}
        {tab === 'imported' && <ImportedTab />}
        {tab === 'orders' && <SunskyOrdersPanel />}
        {tab === 'coupons' && <SunskyCouponsPanel />}
        {tab === 'stats' && <SunskyHotItemsPanel />}
        {tab === 'callbacks' && <CallbacksTab />}
        {tab === 'logs' && <LogsTab />}
        {tab === 'docs' && <DocsTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  KPI Strip                                                                 */
/* ========================================================================== */
function KpiStrip() {
  const [stats, setStats] = useState({ balance: '—', currency: '', calls24: 0, errors24: 0, imported: 0 });
  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [{ data: s }, { count: callCount }, { count: errCount }, { count: impCount }] = await Promise.all([
        supabase.from('sunsky_settings').select('last_balance_value,last_balance_currency').eq('id', true).maybeSingle(),
        supabase.from('sunsky_sync_log').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('sunsky_sync_log').select('id', { count: 'exact', head: true }).gte('created_at', since).neq('result', 'success'),
        supabase.from('sunsky_imported_products').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        balance: s?.last_balance_value != null ? Number(s.last_balance_value).toFixed(2) : '—',
        currency: s?.last_balance_currency ?? '',
        calls24: callCount ?? 0,
        errors24: errCount ?? 0,
        imported: impCount ?? 0,
      });
    })();
  }, []);
  const items = [
    { label: 'Balance',    value: `${stats.balance} ${stats.currency}`.trim(), icon: Wallet, color: 'text-emerald-600' },
    { label: 'Calls 24h',  value: String(stats.calls24),                       icon: Activity, color: 'text-sky-600' },
    { label: 'Errors 24h', value: String(stats.errors24),                      icon: XCircle, color: stats.errors24 > 0 ? 'text-red-600' : 'text-muted-foreground' },
    { label: 'Imported',   value: String(stats.imported),                      icon: ListChecks, color: 'text-violet-600' },
  ];
  return (
    <div className="grid grid-cols-2 md:flex md:gap-2 gap-2">
      {items.map((k) => (
        <div key={k.label} className="rounded-xl border bg-card px-3 py-2 min-w-[110px]">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide">
            <k.icon className={`h-3 w-3 ${k.color}`} /> {k.label}
          </div>
          <div className="text-sm font-bold">{k.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ========================================================================== */
/*  Overview                                                                  */
/* ========================================================================== */
function OverviewTab() {
  const { call, loading } = useSunsky();
  const [pingResult, setPingResult] = useState<null | { ok: boolean; msg: string }>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => { loadLogs(); }, []);
  async function loadLogs() {
    const { data } = await supabase.from('sunsky_sync_log').select('*').order('created_at', { ascending: false }).limit(8);
    setRecentLogs(data ?? []);
  }

  async function ping() {
    const r = await call('account/balance');
    setPingResult({
      ok: r.result === 'success',
      msg: r.result === 'success' ? 'Connection healthy ✔' : (r.messages?.join(' · ') ?? 'Failed'),
    });
    loadLogs();
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Connection</CardTitle>
          <CardDescription>Test that the API key & secret work.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={ping} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Ping SunSky (refresh balance)
          </Button>
          {pingResult && (
            <div className={`text-sm rounded-lg px-3 py-2 flex items-center gap-2
              ${pingResult.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
              {pingResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {pingResult.msg}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Recent API activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No calls yet — try the Ping button.</p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((l) => (
                <div key={l.id} className="text-xs flex items-center justify-between border-b pb-1.5 last:border-0">
                  <div className="flex items-center gap-2">
                    {l.result === 'success' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-red-600" />}
                    <span className="font-mono">{l.endpoint}</span>
                    <Badge variant="outline" className="text-[10px]">{l.latency_ms ?? '?'}ms</Badge>
                  </div>
                  <span className="text-muted-foreground">{new Date(l.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ========================================================================== */
/*  Catalog — bulk category import                                            */
/* ========================================================================== */
function CatalogTab() {
  const { call, loading } = useSunsky();
  const [category, setCategory] = useState<{ categoryId: number | null; path: string }>({ categoryId: null, path: '' });
  const [keyword, setKeyword] = useState('');
  const [inStockOnly, setInStockOnly] = useState(true);
  const [minStock, setMinStock] = useState<number>(1);
  const [maxItems, setMaxItems] = useState<number>(0); // 0 = all
  // Which SunSky statuses to actually persist (Appendix B). Default: Active + OOS only.
  const [allowedStatuses, setAllowedStatuses] = useState<Record<number, boolean>>({
    1: true,  // Active (Valid)
    3: true,  // Out of stock
    2: false, // Deleted
    4: false, // Hidden
  });
  const [preview, setPreview] = useState<{ items: any[]; total: number; pageCount: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  function pickFromTree(id: number, path: string) {
    setCategory({ categoryId: id, path });
    setPreview(null);
  }
  function clearCategory() {
    setCategory({ categoryId: null, path: '' });
    setPreview(null);
  }

  // Are all four statuses on? then we can let SunSky do the filtering server-side (faster)
  const allowedList = useMemo(
    () => Object.entries(allowedStatuses).filter(([, on]) => on).map(([k]) => Number(k)),
    [allowedStatuses]
  );
  // status=-1 = all; status=1 = valid only. We pass -1 unless ONLY 1 is selected.
  const sunskyStatusParam = allowedList.length === 1 && allowedList[0] === 1 ? 1 : -1;

  async function loadPreview() {
    if (category.categoryId == null) return;
    setPreviewLoading(true);
    const r = await call('import/preview', {
      categoryId: category.categoryId,
      keyword: keyword || undefined,
      sunskyStatus: sunskyStatusParam,
    });
    setPreviewLoading(false);
    if (r.result === 'success') {
      setPreview(r.data ?? { items: [], total: 0, pageCount: 0 });
    }
  }

  // Auto-preview when a category is picked
  useEffect(() => {
    if (category.categoryId != null) void loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.categoryId, sunskyStatusParam]);

  async function startImport() {
    if (category.categoryId == null) { toast.error('Pick a category first'); return; }
    if (allowedList.length === 0) { toast.error('Pick at least one product status to import'); return; }
    setStarting(true);
    const r = await call('import/start', {
      categoryId: category.categoryId,
      categoryPath: category.path,
      filters: {
        inStockOnly,
        minStock: inStockOnly ? Math.max(1, minStock) : 0,
        maxItems: maxItems > 0 ? maxItems : 0,
        keyword: keyword || undefined,
        sunskyStatus: sunskyStatusParam,
        allowedStatuses: allowedList,
      },
    });
    setStarting(false);
    if (r.result === 'success') {
      toast.success(`Bulk import started — ~${r.data?.totalEstimate ?? '?'} products to scan`);
    }
  }

  function priceOf(it: any) {
    if (it.price != null) return Number(it.price).toFixed(2);
    if (Array.isArray(it.priceList) && it.priceList.length) return Number(it.priceList[0].value).toFixed(2);
    return '—';
  }
  function imgOf(it: any) {
    const itemNo = it.itemNo ?? it.item_no ?? it.id;
    if (it.imageUrl) return it.imageUrl;
    if (Array.isArray(it.images) && it.images[0]) return it.images[0];
    if (itemNo) return `https://img.sunsky-online.com/${itemNo}.jpg`;
    return '';
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <SunskyCategoryTree
          onBrowse={pickFromTree}
          selectedCategoryId={category.categoryId}
        />
      </aside>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Bulk Import from Category</CardTitle>
            <CardDescription>
              Pick a category in the sidebar, then import every matching product in one go. Imports run in the background — you can leave this page.
            </CardDescription>
            {category.categoryId != null && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                <span>Category:</span>
                <Badge variant="secondary">{category.path || `#${category.categoryId}`}</Badge>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={clearCategory}>
                  Clear
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {category.categoryId == null ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Pick a Top → Sub → Detail category from the sidebar to begin.
              </p>
            ) : (
              <>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border bg-muted/30 p-3">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs">Keyword filter (optional)</Label>
                    <Input
                      placeholder="e.g. case, charger — leave empty to import the whole category"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      onBlur={loadPreview}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-card border px-3 py-2">
                    <div>
                      <div className="text-sm font-semibold">In stock only</div>
                      <div className="text-[11px] text-muted-foreground">Skip products with 0 stock</div>
                    </div>
                    <Switch checked={inStockOnly} onCheckedChange={setInStockOnly} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Minimum stock {inStockOnly ? '' : '(disabled)'}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={minStock}
                      onChange={(e) => setMinStock(Number(e.target.value) || 1)}
                      disabled={!inStockOnly}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Max items to import (0 = all)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={maxItems}
                      onChange={(e) => setMaxItems(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Estimated matches</Label>
                    <div className="h-9 flex items-center px-3 rounded-md border bg-background text-sm font-mono">
                      {previewLoading ? '…' : (preview?.total?.toLocaleString() ?? '—')}
                    </div>
                  </div>
                </div>

                {/* Status filters — Appendix B */}
                <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Product statuses to import</Label>
                    <span className="text-[11px] text-muted-foreground">SunSky Appendix B</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { code: 1, label: 'Active', desc: 'Valid + sellable' },
                      { code: 3, label: 'Out of stock', desc: 'Active SKU, 0 stock' },
                      { code: 2, label: 'Deleted', desc: 'Removed by SunSky' },
                      { code: 4, label: 'Hidden', desc: 'Aged / discontinued' },
                    ].map((s) => {
                      const on = !!allowedStatuses[s.code];
                      return (
                        <label key={s.code} className={`flex items-start gap-2 rounded-lg border bg-card px-2.5 py-2 cursor-pointer transition-colors ${on ? 'ring-1 ring-primary/40' : ''}`}>
                          <Switch checked={on} onCheckedChange={(v) => setAllowedStatuses((p) => ({ ...p, [s.code]: v }))} />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold">{s.label}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{s.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Action */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={startImport} disabled={starting || loading || !preview} size="lg">
                    {starting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Import all from this category
                  </Button>
                  <Button variant="outline" onClick={loadPreview} disabled={previewLoading}>
                    {previewLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Refresh preview
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Imports run in the background — check the Jobs panel below.
                  </span>
                </div>

                {/* Preview thumbs */}
                {preview && preview.items.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Preview (first {preview.items.length} of {preview.total.toLocaleString()})</div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {preview.items.map((it, i) => {
                        const itemNo = it.itemNo ?? it.item_no ?? it.id ?? `idx-${i}`;
                        const img = imgOf(it);
                        const inStk = Number(it.stock ?? 0) > 0;
                        return (
                          <div key={String(itemNo)} className="rounded-lg border bg-card p-1.5">
                            {img ? (
                              <img
                                src={img}
                                alt={it.name ?? itemNo}
                                className="w-full h-16 object-cover rounded bg-muted"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                              />
                            ) : <div className="w-full h-16 rounded bg-muted" />}
                            <div className="text-[10px] font-mono truncate mt-1">{itemNo}</div>
                            <div className="flex items-center justify-between text-[10px] mt-0.5">
                              <span className="font-bold text-emerald-700">${priceOf(it)}</span>
                              <Badge variant={inStk ? 'outline' : 'secondary'} className="text-[9px] px-1 py-0">
                                {inStk ? `stk ${it.stock}` : 'OOS'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <ImportJobsList />
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  Bulk import jobs — live progress                                          */
/* ========================================================================== */
function ImportJobsList() {
  const { call } = useSunsky();
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase.from('sunsky_import_jobs')
        .select('*').order('created_at', { ascending: false }).limit(20);
      if (mounted) setJobs(data ?? []);
    }
    void load();
    const ch = supabase
      .channel('sunsky_import_jobs_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sunsky_import_jobs' }, () => { void load(); })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  async function cancelJob(id: string) {
    await call('import/cancel', { jobId: id });
  }

  function statusBadge(s: string) {
    const map: Record<string, string> = {
      queued: 'bg-slate-100 text-slate-700',
      running: 'bg-sky-100 text-sky-800',
      done: 'bg-emerald-100 text-emerald-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-amber-100 text-amber-800',
    };
    return <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${map[s] ?? 'bg-muted'}`}>{s}</span>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-4 w-4" /> Bulk Import Jobs
        </CardTitle>
        <CardDescription>Live progress of category-level imports.</CardDescription>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No bulk imports yet. Pick a category above and click "Import all".
          </p>
        ) : (
          <div className="space-y-2">
            {jobs.map((j) => {
              const total = Math.max(1, j.total_estimate || 1);
              const pct = Math.min(100, Math.round((j.processed / total) * 100));
              return (
                <div key={j.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {statusBadge(j.status)}
                        <span className="text-sm font-semibold truncate">{j.category_path || `#${j.category_id}`}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(j.created_at).toLocaleString()}
                        {j.filters?.inStockOnly ? ' · in-stock only' : ''}
                        {j.filters?.minStock ? ` · min ${j.filters.minStock}` : ''}
                        {j.filters?.maxItems ? ` · max ${j.filters.maxItems}` : ''}
                      </div>
                    </div>
                    {(j.status === 'queued' || j.status === 'running') && (
                      <Button size="sm" variant="outline" onClick={() => cancelJob(j.id)}>Cancel</Button>
                    )}
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all ${j.status === 'failed' ? 'bg-red-500' : j.status === 'cancelled' ? 'bg-amber-500' : 'bg-sky-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] mt-2">
                    <Badge variant="outline">processed {j.processed}/{j.total_estimate || '?'}</Badge>
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700">imported {j.imported}</Badge>
                    <Badge variant="outline" className="border-sky-300 text-sky-700">updated {j.updated}</Badge>
                    {j.skipped_oos > 0 && <Badge variant="outline" className="border-amber-300 text-amber-700">OOS skipped {j.skipped_oos}</Badge>}
                    {j.failed > 0 && <Badge variant="outline" className="border-red-300 text-red-700">failed {j.failed}</Badge>}
                  </div>
                  {j.error_message && (
                    <div className="mt-2 text-[11px] text-red-700 bg-red-50 rounded px-2 py-1">{j.error_message}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ========================================================================== */
/*  Imported products                                                         */
/* ========================================================================== */
function ImportedTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'out'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | '1' | '3' | '2' | '4'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => { (async () => {
    const { data } = await supabase.from('sunsky_imported_products')
      .select('*').order('imported_at', { ascending: false }).limit(500);
    setRows(data ?? []); setLoading(false);
  })(); }, []);

  async function unlink(id: string) {
    if (!confirm('Unlink this SunSky import?')) return;
    await supabase.from('sunsky_imported_products').delete().eq('id', id);
    setRows((r) => r.filter((x) => x.id !== id));
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (stockFilter === 'in' && !r.in_stock) return false;
      if (stockFilter === 'out' && r.in_stock) return false;
      if (statusFilter !== 'all') {
        const code = Number(r.raw_payload?.status ?? 1);
        if (String(code) !== statusFilter) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        if (!String(r.sunsky_item_no).toLowerCase().includes(s)
          && !String(r.last_category_path ?? '').toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [rows, stockFilter, statusFilter, search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Imported SunSky Products</CardTitle>
        <CardDescription>Items pulled from SunSky bulk imports. Stock state reflects the last sync.</CardDescription>
        <div className="flex flex-wrap gap-2 mt-2">
          <Input placeholder="Search by SKU or category…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
            {(['all', 'in', 'out'] as const).map((k) => (
              <button key={k} type="button"
                onClick={() => setStockFilter(k)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${stockFilter === k ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {k === 'all' ? 'All stock' : k === 'in' ? 'In stock' : 'Out of stock'}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
            {([
              ['all', 'All status'], ['1', 'Active'], ['3', 'OOS'], ['2', 'Deleted'], ['4', 'Hidden'],
            ] as const).map(([k, label]) => (
              <button key={k} type="button"
                onClick={() => setStatusFilter(k as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${statusFilter === k ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {label}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground self-center">{filtered.length.toLocaleString()} of {rows.length.toLocaleString()}</span>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-32" /> :
          filtered.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No products match these filters.</p> :
          <Table>
            <TableHeader><TableRow>
              <TableHead>SunSky #</TableHead><TableHead>Category</TableHead>
              <TableHead>Last Price</TableHead><TableHead>Status</TableHead><TableHead>Stock</TableHead>
              <TableHead>Linked</TableHead><TableHead>Imported</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const code = Number(r.raw_payload?.status ?? 1);
                const tone = SUNSKY_PRODUCT_STATUS[code]?.tone ?? 'active';
                const toneCls =
                  tone === 'active' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' :
                  tone === 'oos'    ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' :
                  tone === 'deleted'? 'bg-rose-100 text-rose-800 hover:bg-rose-100' :
                                       'bg-slate-200 text-slate-700 hover:bg-slate-200';
                const lt = Number(r.raw_payload?.leadTimeLevel ?? 0);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.sunsky_item_no}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">{r.last_category_path ?? '—'}</TableCell>
                    <TableCell>${Number(r.last_price_usd ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={toneCls}>{statusLabel(code)}</Badge>
                      {lt >= 4 && (
                        <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Truck className="h-3 w-3" />{SUNSKY_LEAD_TIME[lt]}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.in_stock
                        ? <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">In stock · {r.last_stock_qty ?? 0}</Badge>
                        : <Badge variant="secondary">Out of stock</Badge>}
                    </TableCell>
                    <TableCell className="text-xs">{r.product_id ? <span className="font-mono">{r.product_id.slice(0,8)}…</span> : <Badge variant="outline">unlinked</Badge>}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.imported_at).toLocaleDateString()}</TableCell>
                    <TableCell><Button size="sm" variant="ghost" onClick={() => unlink(r.id)}>Unlink</Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        }
      </CardContent>
    </Card>
  );
}

/* ========================================================================== */
/*  Docs — in-app SunSky Open API reference                                   */
/* ========================================================================== */
function DocsTab() {
  const [activeId, setActiveId] = useState(SUNSKY_DOCS[0].id);
  const active = SUNSKY_DOCS.find((d) => d.id === activeId) ?? SUNSKY_DOCS[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">SunSky Open API</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto">
            {SUNSKY_DOC_GROUPS.map((g) => {
              const items = SUNSKY_DOCS.filter((d) => d.group === g);
              if (!items.length) return null;
              return (
                <div key={g}>
                  <div className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wide mb-1">{g}</div>
                  <div className="space-y-0.5">
                    {items.map((d) => (
                      <button key={d.id} type="button" onClick={() => setActiveId(d.id)}
                        className={`block w-full text-left text-xs px-2 py-1.5 rounded-md transition-colors ${activeId === d.id ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
                        {d.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </aside>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <Badge variant="outline" className="mb-1">{active.group}</Badge>
            <CardTitle>{active.title}</CardTitle>
          </div>
          <a href={active.href} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap">
            Open original <ExternalLink className="h-3 w-3" />
          </a>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm leading-6 font-sans text-foreground">{active.markdown}</pre>
        </CardContent>
      </Card>
    </div>
  );
}

/* ========================================================================== */
/*  Callbacks (webhook events)                                                */
/* ========================================================================== */
function CallbacksTab() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { (async () => {
    const { data } = await supabase.from('sunsky_callback_events').select('*').order('received_at', { ascending: false }).limit(50);
    setRows(data ?? []);
  })(); }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Incoming webhook events</CardTitle>
        <CardDescription>Order updates, balance changes, image-list changes pushed by SunSky.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No callbacks received yet. Configure the webhook URL in Settings.</p> :
          <Table>
            <TableHeader><TableRow>
              <TableHead>Type</TableHead><TableHead>Signature</TableHead><TableHead>Processed</TableHead><TableHead>IP</TableHead><TableHead>When</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Badge variant="outline">{r.event_type}</Badge></TableCell>
                  <TableCell>{r.signature_ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-red-600" />}</TableCell>
                  <TableCell>{r.processed ? <Badge>Yes</Badge> : <Badge variant="secondary">Pending</Badge>}</TableCell>
                  <TableCell className="text-xs">{r.ip_address ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.received_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
      </CardContent>
    </Card>
  );
}

/* ========================================================================== */
/*  Logs                                                                      */
/* ========================================================================== */
function LogsTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  useEffect(() => { (async () => {
    const { data } = await supabase.from('sunsky_sync_log').select('*').order('created_at', { ascending: false }).limit(200);
    setRows(data ?? []);
  })(); }, []);
  const filtered = useMemo(() =>
    rows.filter((r) => !filter || r.endpoint.includes(filter) || (r.error_message ?? '').includes(filter))
  , [rows, filter]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>API call log</CardTitle>
        <CardDescription>Every signed request the proxy made to SunSky.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Filter by endpoint or error…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <div className="border rounded-xl divide-y max-h-[60vh] overflow-auto">
          {filtered.map((r) => (
            <div key={r.id} className="px-3 py-2 text-xs flex items-start gap-3">
              {r.result === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold">{r.endpoint}</span>
                  <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()} · {r.latency_ms ?? '?'}ms</span>
                </div>
                {r.error_message && <div className="text-red-700 mt-1 break-words">{r.error_message}</div>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No log entries.</div>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ========================================================================== */
/*  Settings                                                                  */
/* ========================================================================== */
function SettingsTab() {
  const [s, setS] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const projectRef = (import.meta.env.VITE_SUPABASE_URL || '').replace('https://', '').split('.')[0];
  const webhookUrl = (typeof window === "undefined" ? "" : `${window.location.origin}/api/public/sunsky-callback`);

  useEffect(() => { (async () => {
    const { data } = await supabase.from('sunsky_settings').select('*').eq('id', true).maybeSingle();
    setS(data ?? null);
  })(); }, []);

  async function save() {
    if (!s) return;
    setSaving(true);
    const { error } = await supabase.from('sunsky_settings').update({
      mode: s.mode, base_url: s.base_url, default_currency: s.default_currency,
      default_country: s.default_country, default_markup_percent: s.default_markup_percent,
      webhook_secret: s.webhook_secret, notes: s.notes,
    }).eq('id', true);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success('Settings saved');
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  if (!s) return <Skeleton className="h-64" />;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
          <CardDescription>API key & secret are stored as backend secrets and never sent to the browser.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-emerald-50 text-emerald-800 text-sm p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> SUNSKY_API_KEY & SUNSKY_API_SECRET are configured.
          </div>
          <div className="space-y-1.5">
            <Label>Mode</Label>
            <div className="flex items-center gap-3">
              <Switch checked={s.mode === 'live'} onCheckedChange={(v) => setS({ ...s, mode: v ? 'live' : 'test' })} />
              <span className="text-sm">{s.mode === 'live' ? 'Live (real orders)' : 'Test'}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Base URL</Label>
            <Input value={s.base_url} onChange={(e) => setS({ ...s, base_url: e.target.value })} />
            <p className="text-[11px] text-muted-foreground">Override only if your SunSky sales manager gave you a different host.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Default currency</Label>
              <Input value={s.default_currency} onChange={(e) => setS({ ...s, default_currency: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Default ship country</Label>
              <Input value={s.default_country} onChange={(e) => setS({ ...s, default_country: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Default markup %</Label>
            <Input type="number" value={s.default_markup_percent}
              onChange={(e) => setS({ ...s, default_markup_percent: Number(e.target.value) })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Webhook className="h-4 w-4" /> Webhook (Callback Hook)</CardTitle>
          <CardDescription>Paste this URL into the SunSky panel to receive order/image updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(webhookUrl, 'Webhook URL')}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Shared secret (optional)</Label>
            <Input value={s.webhook_secret} onChange={(e) => setS({ ...s, webhook_secret: e.target.value })} placeholder="Leave blank to skip header check" />
            <p className="text-[11px] text-muted-foreground">If set, SunSky must send this in the <code>x-sunsky-signature</code> header.</p>
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} value={s.notes} onChange={(e) => setS({ ...s, notes: e.target.value })} placeholder="Internal notes about this integration…" />
          </div>
          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save settings
          </Button>
          <a href="https://doc.sunsky-online.com/" target="_blank" rel="noreferrer"
            className="text-xs text-sky-600 inline-flex items-center gap-1 hover:underline">
            SunSky API documentation <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
