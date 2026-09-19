import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Boxes, Search, Settings2, Truck } from 'lucide-react';
import { AdjustInventoryDialog } from '@/components/admin/warehouse/AdjustInventoryDialog';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { PageHeader } from '@/components/customer/aux/PageHeader';

type Row = {
  id: string; user_id: string; product_id: string; sku: string; product_name: string;
  qty_on_hand: number; qty_reserved: number; qty_available: number; storage_started_at: string;
};
type Release = {
  id: string; user_id: string; status: string; fulfillment_type: string;
  destination: string; tracking_number: string | null; items: any[]; created_at: string;
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-muted',
  processing: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  shipped: 'bg-primary/15 text-primary',
  delivered: 'bg-green-500/15 text-green-700 dark:text-green-300',
  cancelled: 'bg-destructive/15 text-destructive',
};

export default function WarehouseAdmin() {
  const [tab, setTab] = useState('inventory');
  const [rows, setRows] = useState<Row[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [adjust, setAdjust] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: inv }, { data: rel }] = await Promise.all([
      supabase.from('warehouse_inventory').select('*').order('last_movement_at', { ascending: false }),
      supabase.from('release_requests').select('*').order('created_at', { ascending: false }),
    ]);
    const ids = Array.from(new Set([...(inv || []).map((r: any) => r.user_id), ...(rel || []).map((r: any) => r.user_id)]));
    if (ids.length) {
      const { data: pp } = await supabase.from('profiles').select('user_id, display_name, email').in('user_id', ids);
      const map: Record<string, string> = {};
      (pp || []).forEach((p: any) => { map[p.user_id] = p.display_name || p.email || p.user_id.slice(0, 8); });
      setProfiles(map);
    }
    setRows((inv as any) || []);
    setReleases((rel as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateRelease = async (id: string, patch: Partial<Release>) => {
    const { error } = await supabase.from('release_requests').update(patch).eq('id', id);
    if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Release updated' });
    load();
  };

  const filteredRows = rows.filter(r =>
    !search || r.sku.toLowerCase().includes(search.toLowerCase())
    || r.product_name.toLowerCase().includes(search.toLowerCase())
    || (profiles[r.user_id] || '').toLowerCase().includes(search.toLowerCase())
  );

  const queue = releases.filter(r => ['pending', 'processing'].includes(r.status));
  const history = releases.filter(r => !['pending', 'processing'].includes(r.status));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse console"
        highlight="warehouse"
        subtitle="All customer stored inventory and the release pipeline"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Total SKUs</div><div className="text-2xl font-bold">{rows.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Units stored</div><div className="text-2xl font-bold text-primary">{rows.reduce((s, r) => s + r.qty_on_hand, 0)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Pending releases</div><div className="text-2xl font-bold text-amber-600">{queue.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Customers</div><div className="text-2xl font-bold">{new Set(rows.map(r => r.user_id)).size}</div></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inventory"><Boxes className="h-4 w-4" /> All Inventory</TabsTrigger>
          <TabsTrigger value="queue"><Truck className="h-4 w-4" /> Release Queue ({queue.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search customer / SKU / product…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {loading ? <Card className="p-8 text-center text-muted-foreground">Loading…</Card> : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3">Customer</th>
                      <th className="text-left px-4 py-3">Product</th>
                      <th className="text-right px-4 py-3">On Hand</th>
                      <th className="text-right px-4 py-3">Reserved</th>
                      <th className="text-right px-4 py-3">Available</th>
                      <th className="text-left px-4 py-3">Stored</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRows.map(r => (
                      <tr key={r.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3">{profiles[r.user_id] || r.user_id.slice(0, 8)}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{r.product_name}</div>
                          <div className="text-xs text-muted-foreground">{r.sku}</div>
                        </td>
                        <td className="text-right px-4 py-3 font-medium">{r.qty_on_hand}</td>
                        <td className="text-right px-4 py-3 text-amber-600">{r.qty_reserved}</td>
                        <td className="text-right px-4 py-3 font-bold text-primary">{r.qty_available}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.storage_started_at), { addSuffix: true })}</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => setAdjust(r)}>
                            <Settings2 className="h-3.5 w-3.5" /> Adjust
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!filteredRows.length && (
                      <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No inventory yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="queue" className="space-y-3">
          {queue.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">No pending releases 🎉</Card>
          ) : queue.map(r => {
            const totalQty = (r.items || []).reduce((s: number, i: any) => s + (i.qty || 0), 0);
            return (
              <Card key={r.id} className="p-4 space-y-3">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">#{r.id.slice(0, 8)}</span>
                      <Badge className={STATUS_COLOR[r.status]} variant="secondary">{r.status}</Badge>
                      <Badge variant="outline">{r.fulfillment_type.toUpperCase()}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {profiles[r.user_id] || 'Customer'} · {totalQty} units · {r.destination || '—'} · {format(new Date(r.created_at), 'PP')}
                    </p>
                    <ul className="text-xs mt-2 space-y-0.5">
                      {(r.items || []).map((it: any, i: number) => (
                        <li key={i} className="text-muted-foreground">• {it.qty}× {it.sku}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2 items-start">
                    {r.status === 'pending' && (
                      <Button size="sm" onClick={() => updateRelease(r.id, { status: 'processing' })}>Approve</Button>
                    )}
                    {r.status === 'processing' && (
                      <div className="flex gap-2">
                        <Input
                          className="w-44"
                          placeholder="Tracking #"
                          defaultValue={r.tracking_number || ''}
                          onBlur={(e) => e.target.value !== (r.tracking_number || '') && updateRelease(r.id, { tracking_number: e.target.value })}
                        />
                        <Button size="sm" onClick={() => updateRelease(r.id, { status: 'shipped' })}>Mark shipped</Button>
                      </div>
                    )}
                    <Select value={r.status} onValueChange={(v) => updateRelease(r.id, { status: v as any })}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {history.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">No completed releases yet</Card>
          ) : history.map(r => {
            const totalQty = (r.items || []).reduce((s: number, i: any) => s + (i.qty || 0), 0);
            return (
              <Card key={r.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">#{r.id.slice(0, 8)}</span>
                      <Badge className={STATUS_COLOR[r.status]} variant="secondary">{r.status}</Badge>
                      <Badge variant="outline">{r.fulfillment_type.toUpperCase()}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {profiles[r.user_id] || 'Customer'} · {totalQty} units · {r.tracking_number ? `Track: ${r.tracking_number}` : '—'}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      <AdjustInventoryDialog
        open={!!adjust}
        onOpenChange={(o) => !o && setAdjust(null)}
        inventory={adjust}
        onAdjusted={load}
      />
    </div>
  );
}
