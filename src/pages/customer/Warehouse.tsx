import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from "@/lib/router-compat";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Boxes, Download, Send, Search, Package2 } from 'lucide-react';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReleaseStockDialog } from '@/components/customer/warehouse/ReleaseStockDialog';
import { format, formatDistanceToNow } from 'date-fns';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import UpgradePrompt from '@/components/UpgradePrompt';
import { PlanFeatureChip } from '@/components/customer/PlanFeatureChip';

type Inventory = {
  id: string; product_id: string; sku: string; product_name: string;
  qty_on_hand: number; qty_reserved: number; qty_available: number;
  storage_started_at: string; last_movement_at: string;
  image_url?: string | null;
};

type Release = {
  id: string; status: string; fulfillment_type: string; destination: string;
  tracking_number: string | null; items: any[]; created_at: string; shipped_at: string | null;
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-muted text-foreground',
  processing: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  shipped: 'bg-primary/15 text-primary',
  delivered: 'bg-green-500/15 text-green-700 dark:text-green-300',
  cancelled: 'bg-destructive/15 text-destructive',
};

export default function Warehouse() {
  const { user } = useAuth();
  const { numericLimit, isUnlimited, planName, getLimit, hasFeature } = useCurrentPlan();
  const kittingTier = getLimit('kitting_bundling') || 'no'; // no | basic | advanced
  const lowStockTier = getLimit('low_stock_alerts') || 'no'; // no | yes | auto_reorder
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(params.get('tab') || 'stock');
  const [inv, setInv] = useState<Inventory[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [releaseTarget, setReleaseTarget] = useState<Inventory | null>(null);

  const freeUnits = numericLimit('storage_units_free');
  const freeDays = numericLimit('storage_free_days');
  const storageRate = numericLimit('storage_rate_sar');
  const releasesLimit = numericLimit('release_requests_monthly');
  const releasesUnlimited = isUnlimited('release_requests_monthly');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: i }, { data: r }] = await Promise.all([
      supabase.from('warehouse_inventory').select('*').eq('user_id', user.id).order('last_movement_at', { ascending: false }),
      supabase.from('release_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    const invRows = (i as any[]) || [];
    const productIds = Array.from(new Set(invRows.map(x => x.product_id).filter(Boolean)));
    let imageMap: Record<string, string> = {};
    if (productIds.length) {
      const { data: prods } = await supabase.from('products').select('id, images').in('id', productIds);
      (prods || []).forEach((p: any) => { imageMap[p.id] = p.images?.[0] || ''; });
    }
    setInv(invRows.map(x => ({ ...x, image_url: imageMap[x.product_id] || null })));
    setReleases((r as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filteredInv = inv.filter(x =>
    !search || x.sku.toLowerCase().includes(search.toLowerCase()) || x.product_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnits = inv.reduce((s, x) => s + x.qty_on_hand, 0);
  const totalReserved = inv.reduce((s, x) => s + x.qty_reserved, 0);

  const exportCSV = () => {
    const headers = 'SKU,Product,On Hand,Reserved,Available,Stored Since\n';
    const rows = filteredInv.map(x =>
      `"${x.sku}","${x.product_name}",${x.qty_on_hand},${x.qty_reserved},${x.qty_available},"${format(new Date(x.storage_started_at), 'yyyy-MM-dd')}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `warehouse-inventory-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4 flex w-full flex-wrap sm:[&>button]:flex-1">
          <TabsTrigger value="stock">
            <Package2 />
            <div className="flex flex-col leading-tight">
              <span>My Stock</span>
              <span className="hidden sm:block text-xs font-normal opacity-70">Stored inventory</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="releases">
            <Send />
            <div className="flex flex-col leading-tight">
              <span>Release History</span>
              <span className="hidden sm:block text-xs font-normal opacity-70">Shipped out</span>
            </div>
          </TabsTrigger>
        </TabsList>
      </Tabs>


      <PageHeader
        title="My warehouse"
        highlight="warehouse"
        subtitle="Stock stored with Tejaraa — release anytime to FBA, Noon, or direct."
        guide={{
          chip: 'How storage works',
          intro: 'Send once, ship anytime.',
          steps: [
            { title: 'Store', description: 'Place a bulk order with the "Store in warehouse" option.' },
            { title: 'Track', description: 'Monitor on-hand, reserved, and available units in real time.' },
            { title: 'Release', description: 'Ship units to FBA, Noon, or direct customers anytime.' },
          ],
        }}
        actions={
          <Button variant="outline" onClick={exportCSV} disabled={!filteredInv.length} className="rounded-full">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      {/* Storage plan ribbon */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="outline">
          {totalUnits} / {freeUnits || '∞'} free units
        </Badge>
        <Badge variant="outline">{freeDays || 0} free storage days</Badge>
        {storageRate > 0 && <Badge variant="outline">SAR {storageRate}/unit/mo after free</Badge>}
        <Badge variant="outline" className="text-primary border-primary/40">
          Release SLA: {numericLimit('release_sla_hours') || 72}h
        </Badge>
        {kittingTier !== 'no'
          ? <PlanFeatureChip locked={false} label={`Kitting: ${kittingTier}`} />
          : <PlanFeatureChip label="Kitting / bundling — upgrade" />}
        {lowStockTier === 'auto_reorder'
          ? <PlanFeatureChip locked={false} label="Auto-reorder alerts" />
          : lowStockTier === 'yes'
            ? <PlanFeatureChip locked={false} label="Low-stock alerts" />
            : <PlanFeatureChip label="Low-stock alerts — upgrade" />}
      </div>

      {!releasesUnlimited && releasesLimit > 0 && releases.filter(r => new Date(r.created_at).getMonth() === new Date().getMonth()).length >= releasesLimit && (
        <UpgradePrompt
          currentPlan={planName}
          limitLabel="release requests this month"
          usage={releases.filter(r => new Date(r.created_at).getMonth() === new Date().getMonth()).length}
          limit={releasesLimit}
        />
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="aux-card aux-card-pad text-center">
          <div className="text-2xl font-bold text-primary">{inv.length}</div>
          <div className="text-xs text-muted-foreground">SKUs</div>
        </div>
        <div className="aux-card aux-card-pad text-center">
          <div className="text-2xl font-bold">{totalUnits}</div>
          <div className="text-xs text-muted-foreground">Units</div>
        </div>
        <div className="aux-card aux-card-pad text-center">
          <div className="text-2xl font-bold text-amber-600">{totalReserved}</div>
          <div className="text-xs text-muted-foreground">Reserved</div>
        </div>
      </div>


      {tab === 'stock' && (
        <div className="aux-card aux-card-pad space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search SKU or product…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : filteredInv.length === 0 ? (
            <div className="p-12 text-center">
              <Boxes className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold text-foreground">No stored stock yet</h3>
              <p className="text-sm text-muted-foreground mt-1">When you place a bulk order with the "Store in warehouse" option, your units appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Product</th>
                    <th className="text-right px-4 py-3">On Hand</th>
                    <th className="text-right px-4 py-3">Reserved</th>
                    <th className="text-right px-4 py-3">Available</th>
                    <th className="text-left px-4 py-3">Stored</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredInv.map(row => (
                    <tr key={row.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {row.image_url ? (
                            <img src={row.image_url} alt={row.product_name} className="h-12 w-12 rounded-md object-cover border border-border bg-muted flex-shrink-0" loading="lazy" />
                          ) : (
                            <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                              <Package2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-foreground line-clamp-2">{row.product_name}</div>
                            <div className="text-xs text-muted-foreground">{row.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right px-4 py-3 font-medium">{row.qty_on_hand}</td>
                      <td className="text-right px-4 py-3 text-amber-600">{row.qty_reserved}</td>
                      <td className="text-right px-4 py-3 font-bold text-primary">{row.qty_available}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDistanceToNow(new Date(row.storage_started_at), { addSuffix: true })}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" disabled={row.qty_available === 0} onClick={() => navigate(`/dropshipping/warehouse/release/${row.id}`)}>
                          <Send className="h-3.5 w-3.5" /> Release
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'releases' && (
        <div className="space-y-3">
          {loading ? (
            <div className="aux-card aux-card-pad text-center text-muted-foreground">Loading…</div>
          ) : releases.length === 0 ? (
            <div className="aux-card aux-card-pad text-center py-12">
              <Send className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold">No release requests yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Release stock from the "My Stock" tab to ship units out.</p>
            </div>
          ) : releases.map(r => {
            const totalQty = (r.items || []).reduce((s: number, i: any) => s + (i.qty || 0), 0);
            return (
              <div key={r.id} className="aux-card aux-card-pad">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">Release #{r.id.slice(0, 8)}</span>
                      <Badge className={STATUS_COLOR[r.status] || ''} variant="secondary">{r.status}</Badge>
                      <Badge variant="outline">{r.fulfillment_type.toUpperCase()}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {totalQty} units · {r.destination || '—'} · {format(new Date(r.created_at), 'PP')}
                    </p>
                    {r.tracking_number && (
                      <p className="text-xs mt-1">Tracking: <span className="font-mono">{r.tracking_number}</span></p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ReleaseStockDialog
        open={!!releaseTarget}
        onOpenChange={(o) => !o && setReleaseTarget(null)}
        inventory={releaseTarget}
        onReleased={load}
      />
    </div>
  );
}
