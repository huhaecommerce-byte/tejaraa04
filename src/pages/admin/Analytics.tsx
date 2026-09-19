import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Activity, Users, Eye, MousePointerClick, Timer, Download, RefreshCw, Search as SearchIcon,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';

type Row = Record<string, any>;

interface Summary {
  totals: { visitors: number; sessions: number; page_views: number; signed_in_visitors: number; avg_duration_sec: number };
  live: number;
  bounce_rate: number;
  daily: Row[];
  funnel: Record<string, number>;
  referrers: Row[];
  campaigns: Row[];
  landing_pages: Row[];
  top_pages: Row[];
  top_products: Row[];
  searches: Row[];
  devices: Row[];
  browsers: Row[];
  operating_systems: Row[];
  countries: Row[];
  languages: Row[];
}

const FUNNEL_STEPS: { key: string; label: string }[] = [
  { key: 'visits', label: 'Visited the site' },
  { key: 'product_views', label: 'Viewed a product' },
  { key: 'signups', label: 'Created an account' },
  { key: 'checkout_started', label: 'Started checkout' },
  { key: 'orders', label: 'Placed an order' },
];

function toCsv(rows: Row[]): string {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

function download(name: string, rows: Row[]) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

const Analytics = () => {
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [sessions, setSessions] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [openSession, setOpenSession] = useState<Row | null>(null);
  const [timeline, setTimeline] = useState<Row[] | null>(null);
  const [hideBots, setHideBots] = useState(true);

  // Heuristic: a single-page visit with no referrer, no signed-in user and no
  // measurable dwell time is almost always a crawler or click-farm hit.
  const looksLikeBot = (s: Row) =>
    Number(s['page_views']) <= 1 && !s['referrer'] && !s['user_id'] && !s['converted'];

  const load = async () => {
    setLoading(true);
    const n = Number(days);
    const [s, ss] = await Promise.all([
      (supabase as any).rpc('analytics_summary', { _days: n }),
      (supabase as any).rpc('analytics_sessions', { _days: n, _limit: 300, _search: search || null }),
    ]);
    setSummary((s.data as Summary) || null);
    setSessions(ss.data || []);
    setLoading(false);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [days]);

  useEffect(() => {
    if (!openSession) { setTimeline(null); return; }
    (async () => {
      const { data } = await (supabase as any).rpc('analytics_session_timeline', { _session_id: openSession.session_id });
      setTimeline(data || []);
    })();
  }, [openSession]);

  const visibleSessions = useMemo(
    () => (hideBots ? sessions.filter((s) => !looksLikeBot(s)) : sessions),
    [sessions, hideBots],
  );
  const botCount = sessions.length - visibleSessions.length;

  const daily = useMemo(
    () => (summary?.daily || []).map((d) => ({ ...d, label: String(d.day).slice(5) })),
    [summary],
  );

  const funnel = useMemo(() => {
    const f = summary?.funnel || {};
    const top = Number(f['visits']) || 0;
    return FUNNEL_STEPS.map((s, i, arr) => {
      const value = Number(f[s.key]) || 0;
      const prev = i === 0 ? value : Number(f[arr[i - 1].key]) || 0;
      return {
        ...s,
        value,
        ofTotal: top ? (value / top) * 100 : 0,
        fromPrev: prev ? (value / prev) * 100 : 0,
      };
    });
  }, [summary]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <PageHeader title="Visitor Analytics" subtitle="Traffic, browsing behaviour and conversion funnel across the whole site" />
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {summary?.live ?? 0} active now
          </Badge>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi label="Visitors" value={summary?.totals?.visitors ?? 0} icon={Users} tone="sky" loading={loading} />
        <Kpi label="Sessions" value={summary?.totals?.sessions ?? 0} icon={Activity} tone="violet" loading={loading} />
        <Kpi label="Page views" value={summary?.totals?.page_views ?? 0} icon={Eye} tone="emerald" loading={loading} />
        <Kpi label="Avg time on page" value={`${summary?.totals?.avg_duration_sec ?? 0}s`} icon={Timer} tone="amber" loading={loading} />
        <Kpi label="Bounce rate" value={`${summary?.bounce_rate ?? 0}%`} icon={MousePointerClick} tone="rose" loading={loading} />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardHeader><CardTitle className="text-base">Visitors & sessions per day</CardTitle></CardHeader>
            <CardContent className="h-72">
              {loading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily}>
                    <defs>
                      <linearGradient id="visFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Area type="monotone" dataKey="visitors" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#visFill)" />
                    <Area type="monotone" dataKey="views" stroke="hsl(var(--accent))" strokeWidth={2} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4">
            <ListCard title="Top pages" rows={summary?.top_pages} loading={loading}
              render={(r) => (<><span className="flex-1 truncate font-medium">{r.path}</span>
                <Badge variant="outline" className="text-[10px]">{r.visitors} visitors</Badge>
                <span className="font-bold tabular-nums w-14 text-right">{r.cnt}</span></>)} />
            <ListCard title="Top referrers" rows={summary?.referrers} loading={loading}
              render={(r) => (<><span className="flex-1 truncate font-medium">{r.source}</span>
                <span className="font-bold tabular-nums w-14 text-right">{r.cnt}</span></>)} />
          </div>
        </TabsContent>

        {/* Funnel */}
        <TabsContent value="funnel" className="mt-4">
          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardHeader><CardTitle className="text-base">Conversion funnel</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {loading ? <Skeleton className="h-64 w-full" /> : funnel.map((s, i) => (
                <div key={s.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{i + 1}. {s.label}</span>
                    <span className="flex items-center gap-3">
                      {i > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {s.fromPrev.toFixed(1)}% of previous step
                        </span>
                      )}
                      <span className="font-bold tabular-nums">{s.value}</span>
                    </span>
                  </div>
                  <div className="h-8 rounded-lg bg-muted/50 overflow-hidden">
                    <div
                      className="h-full bg-primary/80 rounded-lg transition-all flex items-center px-2 text-[11px] font-semibold text-primary-foreground"
                      style={{ width: `${Math.max(s.ofTotal, s.value > 0 ? 4 : 0)}%` }}
                    >
                      {s.ofTotal >= 8 ? `${s.ofTotal.toFixed(1)}%` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Traffic */}
        <TabsContent value="traffic" className="mt-4 space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <ListCard title="Referrers" rows={summary?.referrers} loading={loading}
              render={(r) => (<><span className="flex-1 truncate font-medium">{r.source}</span>
                <span className="font-bold tabular-nums w-14 text-right">{r.cnt}</span></>)} />
            <ListCard title="Landing pages" rows={summary?.landing_pages} loading={loading}
              render={(r) => (<><span className="flex-1 truncate font-medium">{r.path}</span>
                <span className="font-bold tabular-nums w-14 text-right">{r.cnt}</span></>)} />
          </div>
          <ListCard title="Campaigns (UTM)" rows={summary?.campaigns} loading={loading}
            render={(r) => (<>
              <span className="flex-1 truncate font-medium">{r.utm_source}</span>
              <span className="flex-1 truncate text-muted-foreground">{r.utm_medium}</span>
              <span className="flex-1 truncate text-muted-foreground">{r.utm_campaign}</span>
              <span className="font-bold tabular-nums w-14 text-right">{r.cnt}</span></>)} />
        </TabsContent>

        {/* Content */}
        <TabsContent value="content" className="mt-4 space-y-4">
          <ListCard title="Most viewed pages" rows={summary?.top_pages} loading={loading}
            onExport={() => download('top-pages.csv', summary?.top_pages || [])}
            render={(r) => (<>
              <span className="flex-1 truncate font-medium">{r.path}</span>
              <Badge variant="outline" className="text-[10px]">{r.avg_sec}s avg</Badge>
              <Badge variant="outline" className="text-[10px]">{r.visitors} visitors</Badge>
              <span className="font-bold tabular-nums w-14 text-right">{r.cnt}</span></>)} />
          <div className="grid lg:grid-cols-2 gap-4">
            <ListCard title="Most viewed products" rows={summary?.top_products} loading={loading}
              render={(r) => (<>
                <a href={`/product/${r.product_id}`} className="flex-1 truncate font-medium hover:underline">{r.name}</a>
                <span className="font-bold tabular-nums w-14 text-right">{r.cnt}</span></>)} />
            <ListCard title="On-site searches" rows={summary?.searches} loading={loading}
              render={(r) => (<>
                <span className="flex-1 truncate font-medium">{r.term}</span>
                {Number(r.zero_results) > 0 && <Badge variant="destructive" className="text-[10px]">{r.zero_results} no results</Badge>}
                <span className="font-bold tabular-nums w-14 text-right">{r.cnt}</span></>)} />
          </div>
        </TabsContent>

        {/* Audience */}
        <TabsContent value="audience" className="mt-4 space-y-4">
          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardHeader><CardTitle className="text-base">Devices</CardTitle></CardHeader>
            <CardContent className="h-56">
              {loading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary?.devices || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={80} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Bar dataKey="cnt" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <div className="grid lg:grid-cols-2 gap-4">
            <ListCard title="Browsers" rows={summary?.browsers} loading={loading}
              render={(r) => (<><span className="flex-1 truncate font-medium">{r.label}</span>
                <span className="font-bold tabular-nums w-14 text-right">{r.cnt}</span></>)} />
            <ListCard title="Operating systems" rows={summary?.operating_systems} loading={loading}
              render={(r) => (<><span className="flex-1 truncate font-medium">{r.label}</span>
                <span className="font-bold tabular-nums w-14 text-right">{r.cnt}</span></>)} />
            <ListCard title="Countries (from timezone)" rows={summary?.countries} loading={loading}
              render={(r) => (<><span className="flex-1 truncate font-medium">{r.label}</span>
                <span className="font-bold tabular-nums w-14 text-right">{r.cnt}</span></>)} />
            <ListCard title="Languages" rows={summary?.languages} loading={loading}
              render={(r) => (<><span className="flex-1 truncate font-medium">{r.label}</span>
                <span className="font-bold tabular-nums w-14 text-right">{r.cnt}</span></>)} />
          </div>
        </TabsContent>

        {/* Visitors */}
        <TabsContent value="visitors" className="mt-4">
          <Card className="bg-card/80 backdrop-blur-sm border-border/60">
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-base">Sessions</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void load(); }}
                    placeholder="Search visitor, session or customer"
                    className="pl-8 w-64"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => void load()}>Search</Button>
                <Button
                  variant={hideBots ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHideBots((v) => !v)}
                  title="Hide single-page visits with no referrer — usually crawlers"
                >
                  {hideBots ? `Bots hidden (${botCount})` : 'Hide bots'}
                </Button>
                <Button variant="outline" size="icon" onClick={() => download('sessions.csv', visibleSessions)} aria-label="Export CSV">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? <Skeleton className="h-64 w-full" /> : visibleSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No sessions recorded in this range yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b">
                      <th className="py-2 pr-3">Visitor</th>
                      <th className="py-2 pr-3">Customer</th>
                      <th className="py-2 pr-3">Landing</th>
                      <th className="py-2 pr-3">Last page</th>
                      <th className="py-2 pr-3">Device</th>
                      <th className="py-2 pr-3">Country</th>
                      <th className="py-2 pr-3 text-right">Pages</th>
                      <th className="py-2 pr-3">Last seen</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSessions.map((s) => (
                      <tr key={s.session_id} className="border-b border-border/50 hover:bg-muted/40">
                        <td className="py-2 pr-3 font-mono text-[11px]">{String(s.visitor_id).slice(0, 12)}</td>
                        <td className="py-2 pr-3">
                          {s.user_id ? (
                            <a href={`/admin/customers/${s.user_id}`} className="hover:underline font-medium">
                              {s.display_name || s.email || 'Customer'}
                            </a>
                          ) : <span className="text-muted-foreground">Guest</span>}
                        </td>
                        <td className="py-2 pr-3 max-w-[180px] truncate">{s.landing_page}</td>
                        <td className="py-2 pr-3 max-w-[180px] truncate">{s.last_page}</td>
                        <td className="py-2 pr-3">{s.device_type} · {s.browser}</td>
                        <td className="py-2 pr-3">{s.country || '—'}</td>
                        <td className="py-2 pr-3 text-right font-bold tabular-nums">{s.page_views}</td>
                        <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground text-[12px]">
                          {new Date(s.last_seen).toLocaleString()}
                        </td>
                        <td className="py-2">
                          <Button variant="ghost" size="sm" onClick={() => setOpenSession(s)}>Timeline</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!openSession} onOpenChange={(o) => !o && setOpenSession(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Browse history — {openSession?.display_name || openSession?.email || 'Guest visitor'}</DialogTitle>
          </DialogHeader>
          {!timeline ? <Skeleton className="h-40 w-full" /> : timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing recorded for this session.</p>
          ) : (
            <ol className="relative border-l border-border/70 ml-2 space-y-4">
              {timeline.map((t, i) => (
                <li key={i} className="ml-4">
                  <span className={`absolute -left-1.5 h-3 w-3 rounded-full ${t.kind === 'event' ? 'bg-emerald-500' : 'bg-primary'}`} />
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-[11px] text-muted-foreground break-all">{t.detail}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(t.at).toLocaleString()}</p>
                </li>
              ))}
            </ol>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const TONES: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700',
  sky: 'bg-sky-100 text-sky-700',
  violet: 'bg-violet-100 text-violet-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
};

function Kpi({ label, value, icon: Icon, tone, loading }: any) {
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/60">
      <CardContent className="p-4">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${TONES[tone]}`}><Icon className="h-4 w-4" /></span>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold mt-0.5 truncate">{loading ? '—' : value}</p>
      </CardContent>
    </Card>
  );
}

function ListCard({ title, rows, loading, render, onExport }: {
  title: string; rows?: Row[]; loading: boolean;
  render: (r: Row) => React.ReactNode; onExport?: () => void;
}) {
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/60">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        {onExport && (
          <Button variant="outline" size="icon" onClick={onExport} aria-label="Export CSV">
            <Download className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-48 w-full" /> : !rows?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">No data in this range</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                {render(r)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default Analytics;
