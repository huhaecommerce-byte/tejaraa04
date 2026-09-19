import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { toast } from 'sonner';
import { Search, Save, RotateCcw, Infinity as InfinityIcon, Users, Sliders, Settings2 } from 'lucide-react';
import { FEATURE_REGISTRY, type FeatureDefinition } from '@/data/featureRegistry';

type DbRow = { limit_key: string; label: string; limit_value: string };
type Customer = { user_id: string; display_name: string | null; email: string | null };

const UNLIMITED = 'unlimited';

function normalise(value: string): string {
  const v = value.trim();
  if (!v) return UNLIMITED;
  if (/^(unlimited|∞)$/i.test(v)) return UNLIMITED;
  return v;
}

function describe(value: string): string {
  const v = normalise(value);
  return v === UNLIMITED ? 'Unlimited' : v;
}

const DEFAULT_SENTINEL = '__default__';

/** Auto-populated control: yes/no for toggles, option list for selects, qty + unlimited for numbers. */
function FeatureValueControl({
  feature,
  value,
  onChange,
  allowDefault = false,
  defaultLabel,
}: {
  feature: FeatureDefinition;
  value: string;
  onChange: (v: string) => void;
  allowDefault?: boolean;
  defaultLabel?: string;
}) {
  const optionList =
    feature.valueType === 'toggle'
      ? ['yes', 'no']
      : feature.valueType === 'select'
        ? (feature.options ?? ['yes', 'no'])
        : null;

  if (optionList) {
    return (
      <Select
        value={value === '' ? (allowDefault ? DEFAULT_SENTINEL : '') : value}
        onValueChange={(v) => onChange(v === DEFAULT_SENTINEL ? '' : v)}
      >
        <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
        <SelectContent>
          {allowDefault && <SelectItem value={DEFAULT_SENTINEL}>{defaultLabel ?? 'Use default'}</SelectItem>}
          {optionList.map((o) => (
            <SelectItem key={o} value={o}>{o === 'yes' ? 'Yes' : o === 'no' ? 'No' : o.replace(/_/g, ' ')}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // qty
  const isUnlimited = /^(unlimited|∞)$/i.test(value.trim());
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        inputMode="numeric"
        className="w-28 h-9"
        disabled={isUnlimited}
        value={isUnlimited ? '' : value}
        placeholder={isUnlimited ? '∞' : allowDefault ? (defaultLabel ?? 'default') : 'qty'}
        onChange={(e) => onChange(e.target.value)}
      />
      {feature.unit && <span className="text-xs text-muted-foreground w-20 shrink-0">{feature.unit}</span>}
      <Button
        type="button"
        size="sm"
        variant={isUnlimited ? 'default' : 'outline'}
        className="h-9 px-2"
        title="Unlimited"
        onClick={() => onChange(isUnlimited ? '' : UNLIMITED)}
      >
        <InfinityIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}


export default function PlanUsageAdmin() {
  /* ---------------- global defaults ---------------- */
  const [dbValues, setDbValues] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);

  /** Every feature the app knows about, grouped by section, with its saved default (or unlimited). */
  const sections = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, FeatureDefinition[]>();
    for (const f of FEATURE_REGISTRY) {
      const s = f.section || 'Other';
      if (!map.has(s)) { map.set(s, []); order.push(s); }
      map.get(s)!.push(f);
    }
    return order.map((name) => ({ name, features: map.get(name)! }));
  }, []);

  const valueOf = (key: string) => dbValues[key] ?? UNLIMITED;

  const loadDefaults = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('usage_limit_defaults')
      .select('limit_key, label, limit_value');
    if (error) toast.error(error.message);
    const rows: DbRow[] = data ?? [];
    const map = Object.fromEntries(rows.map((r) => [r.limit_key, r.limit_value]));
    setDbValues(map);
    setDraft(map);
    setLoading(false);
  };

  useEffect(() => { loadDefaults(); }, []);

  const dirtyKeys = useMemo(
    () => FEATURE_REGISTRY.filter((f) => normalise(draft[f.key] ?? '') !== normalise(valueOf(f.key))).map((f) => f.key),
    [dbValues, draft],
  );

  const saveDefault = async (f: FeatureDefinition) => {
    setSavingKey(f.key);
    const value = normalise(draft[f.key] ?? '');
    const { error } = await (supabase as any)
      .from('usage_limit_defaults')
      .upsert(
        { limit_key: f.key, label: f.label, limit_value: value, updated_at: new Date().toISOString() },
        { onConflict: 'limit_key' },
      );
    setSavingKey(null);
    if (error) return toast.error(error.message);
    setDbValues((prev) => ({ ...prev, [f.key]: value }));
    setDraft((d) => ({ ...d, [f.key]: value }));
    toast.success('Default limit saved');
  };

  const saveAllDefaults = async () => {
    setSavingAll(true);
    const rows = dirtyKeys.map((key) => {
      const f = FEATURE_REGISTRY.find((x) => x.key === key)!;
      return { limit_key: f.key, label: f.label, limit_value: normalise(draft[key] ?? ''), updated_at: new Date().toISOString() };
    });
    const { error } = await (supabase as any)
      .from('usage_limit_defaults')
      .upsert(rows, { onConflict: 'limit_key' });
    setSavingAll(false);
    if (error) return toast.error(error.message);
    toast.success('All default limits saved');
    loadDefaults();
  };

  /* ---------------- per-customer overrides ---------------- */
  const PAGE_SIZE = 25;
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [overrideDraft, setOverrideDraft] = useState<Record<string, string>>({});
  const [savingOverride, setSavingOverride] = useState<string | null>(null);

  const mapRows = (rows: any[]): Customer[] =>
    rows.map((r: any) => ({ user_id: r.user_id, display_name: r.display_name, email: r.email }));

  const fetchCustomers = async (offset: number, append: boolean) => {
    if (append) setLoadingMore(true); else setSearching(true);
    const { data, error } = await (supabase as any).rpc('admin_list_customers', {
      _search: search.trim() || null,
      _limit: PAGE_SIZE,
      _offset: offset,
    });
    setSearching(false);
    setLoadingMore(false);
    if (error) return toast.error(error.message);
    const rows = data ?? [];
    setTotalCount(rows[0]?.total_count ?? rows.length ?? 0);
    setResults((prev) => (append ? [...prev, ...mapRows(rows)] : mapRows(rows)));
  };

  useEffect(() => {
    const t = setTimeout(() => fetchCustomers(0, false), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const selectCustomer = async (c: Customer) => {
    setSelected(c);
    setDialogOpen(true);
    const { data, error } = await (supabase as any)
      .from('customer_usage_limits')
      .select('limit_key, limit_value')
      .eq('user_id', c.user_id);
    if (error) return toast.error(error.message);
    const map = Object.fromEntries((data ?? []).map((r: any) => [r.limit_key, r.limit_value]));
    setOverrides(map);
    setOverrideDraft(map);
  };

  const saveOverride = async (key: string) => {
    if (!selected) return;
    setSavingOverride(key);
    const raw = (overrideDraft[key] ?? '').trim();
    if (!raw) {
      const { error } = await (supabase as any)
        .from('customer_usage_limits')
        .delete()
        .eq('user_id', selected.user_id)
        .eq('limit_key', key);
      setSavingOverride(null);
      if (error) return toast.error(error.message);
      const next = { ...overrides }; delete next[key];
      setOverrides(next);
      setOverrideDraft(next);
      return toast.success('Override removed — customer now uses the default');
    }
    const value = normalise(raw);
    const { error } = await (supabase as any)
      .from('customer_usage_limits')
      .upsert(
        { user_id: selected.user_id, limit_key: key, limit_value: value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,limit_key' },
      );
    setSavingOverride(null);
    if (error) return toast.error(error.message);
    setOverrides((o) => ({ ...o, [key]: value }));
    setOverrideDraft((o) => ({ ...o, [key]: value }));
    toast.success('Customer limit saved');
  };

  const clearAllOverrides = async () => {
    if (!selected) return;
    const { error } = await (supabase as any)
      .from('customer_usage_limits')
      .delete()
      .eq('user_id', selected.user_id);
    if (error) return toast.error(error.message);
    setOverrides({});
    setOverrideDraft({});
    toast.success('All overrides cleared for this customer');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plan usage & limits"
        subtitle="Every feature limit available in the app. Everything is unlimited by default — set a general cap for all customers, or override it for one specific customer."
      />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general"><Sliders className="h-4 w-4 mr-1.5" /> General limits</TabsTrigger>
          <TabsTrigger value="customer"><Users className="h-4 w-4 mr-1.5" /> Per customer</TabsTrigger>
        </TabsList>

        {/* ---------- General ---------- */}
        <TabsContent value="general" className="space-y-4 pt-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">
              Enter a number to cap a feature, or leave it as <code>unlimited</code> for no cap.
              Toggle features accept <code>yes</code>/<code>no</code>. Monthly limits reset on the 1st of each month.
            </p>
            <Button size="sm" disabled={dirtyKeys.length === 0 || savingAll} onClick={saveAllDefaults}>
              <Save className="h-4 w-4 mr-1.5" />
              {savingAll ? 'Saving…' : `Save all${dirtyKeys.length ? ` (${dirtyKeys.length})` : ''}`}
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            sections.map((section) => (
              <Card key={section.name}>
                <CardContent className="p-0">
                  <div className="px-4 py-3 border-b bg-muted/40">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section.name}</p>
                  </div>
                  <div className="divide-y">
                    {section.features.map((f) => {
                      const dirty = normalise(draft[f.key] ?? '') !== normalise(valueOf(f.key));
                      return (
                        <div key={f.key} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{f.label}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {f.key}{f.unit ? <span className="font-sans"> · {f.unit}</span> : null}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {normalise(valueOf(f.key)) === UNLIMITED && f.valueType === 'qty' && (
                              <Badge variant="secondary" className="gap-1"><InfinityIcon className="h-3 w-3" /> Unlimited</Badge>
                            )}
                            <FeatureValueControl
                              feature={f}
                              value={draft[f.key] ?? ''}
                              onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
                            />

                            <Button
                              size="sm"
                              variant={dirty ? 'default' : 'outline'}
                              disabled={!dirty || savingKey === f.key}
                              onClick={() => saveDefault(f)}
                            >
                              {savingKey === f.key ? 'Saving…' : 'Save'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ---------- Per customer ---------- */}
        <TabsContent value="customer" className="space-y-4 pt-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search a customer by name or email…"
                />
              </div>
              <div className="rounded-lg border divide-y max-h-[60vh] overflow-y-auto">
                {searching && <p className="p-3 text-xs text-muted-foreground">Loading customers…</p>}
                {!searching && results.length === 0 && (
                  <p className="p-3 text-xs text-muted-foreground">No customers match.</p>
                )}
                {results.map((c) => (
                  <button
                    key={c.user_id}
                    onClick={() => selectCustomer(c)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/60"
                  >
                    <span className="truncate font-medium">{c.display_name || 'Customer'}</span>
                    <span className="text-xs text-muted-foreground truncate">{c.email}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Showing {results.length} of {totalCount} customers
                </span>
                {results.length < totalCount && (
                  <Button size="sm" variant="outline" className="h-8" disabled={loadingMore} onClick={() => fetchCustomers(results.length, true)}>
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90dvh] overflow-y-auto p-0">
              <DialogHeader className="px-6 pt-6 pb-2 sticky top-0 bg-background z-10 border-b">
                <DialogTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  Customer limits
                </DialogTitle>
                <DialogDescription>
                  {selected ? (
                    <span className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-medium text-foreground">{selected.display_name || 'Customer'}</span>
                      <span className="text-muted-foreground">{selected.email}</span>
                    </span>
                  ) : (
                    'Select a customer to configure limits.'
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 py-4 space-y-4">
                {selected && (
                  <div className="flex items-center justify-end">
                    <Button size="sm" variant="outline" onClick={clearAllOverrides} disabled={Object.keys(overrides).length === 0}>
                      <RotateCcw className="h-4 w-4 mr-1.5" /> Reset all to defaults
                    </Button>
                  </div>
                )}

                {sections.map((section) => (
                  <Card key={section.name}>
                    <CardContent className="p-0">
                      <div className="px-4 py-3 border-b bg-muted/40">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section.name}</p>
                      </div>
                      <div className="divide-y">
                        {section.features.map((f) => {
                          const current = overrides[f.key];
                          const dirty = (overrideDraft[f.key] ?? '') !== (current ?? '');
                          return (
                            <div key={f.key} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{f.label}</p>
                                <p className="text-xs text-muted-foreground">
                                  Default: {describe(valueOf(f.key))}
                                  {current !== undefined && <span className="ml-2 text-primary">· override: {describe(current)}</span>}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <FeatureValueControl
                                  feature={f}
                                  value={overrideDraft[f.key] ?? ''}
                                  onChange={(v) => setOverrideDraft((d) => ({ ...d, [f.key]: v }))}
                                  allowDefault
                                  defaultLabel={`Default (${describe(valueOf(f.key))})`}
                                />

                                <Button
                                  size="sm"
                                  variant={dirty ? 'default' : 'outline'}
                                  disabled={!dirty || savingOverride === f.key}
                                  onClick={() => saveOverride(f.key)}
                                >
                                  {savingOverride === f.key ? 'Saving…' : 'Save'}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <p className="text-xs text-muted-foreground">
                  Leave a field empty and save to remove the override — the customer falls back to the general limit.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
