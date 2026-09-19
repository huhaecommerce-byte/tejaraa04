import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Eye } from 'lucide-react';
import { useNavigate } from "@/lib/router-compat";
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { triggerAdminPendingCountsRefresh } from '@/hooks/useAdminPendingCounts';
import { flushEmailQueue } from '@/lib/flushEmails';

const statusColor: Record<string, string> = {
  new: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-yellow-100 text-yellow-800', processing: 'bg-blue-100 text-blue-800', labelling: 'bg-purple-100 text-purple-800',
  shipped: 'bg-green-100 text-green-800', delivered: 'bg-green-200 text-green-900', cancelled: 'bg-red-100 text-red-800',
};
const STATUSES_BY_KIND: Record<string, string[]> = {
  dashboard: ['pending', 'processing', 'labelling', 'shipped', 'delivered', 'cancelled'],
  store: ['new', 'processing', 'shipped', 'delivered', 'cancelled'],
};

const OrdersAdmin = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingEdits, setTrackingEdits] = useState<Record<string, string>>({});

  const fetchOrders = async () => {
    setLoading(true);
    const [{ data: dashboardOrders, error: e1 }, { data: storeOrders, error: e2 }] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      (supabase as any).from('shop_orders').select('*').order('created_at', { ascending: false }),
    ]);
    if (e1) toast.error(e1.message);
    if (e2) toast.error(e2.message);
    const normalizedStore = (storeOrders || []).map((o: any) => ({
      id: o.id,
      kind: 'store' as const,
      customer_name: o.customer_name || 'Guest',
      type: `store · ${o.payment_method === 'cod' ? 'COD' : 'card'}`,
      status: o.status || 'new',
      total: Number(o.total_sar) || 0,
      tracking_number: null,
      created_at: o.created_at,
      order_ref: o.order_ref,
    }));
    const normalizedDashboard = (dashboardOrders || []).map((o: any) => ({ ...o, kind: 'dashboard' as const }));
    const merged = [...normalizedStore, ...normalizedDashboard]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setOrders(merged);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: string, status: string, kind: string) => {
    const { error } = kind === 'store'
      ? await (supabase as any).from('shop_orders').update({ status }).eq('id', id)
      : await supabase.from('orders').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    flushEmailQueue();
    triggerAdminPendingCountsRefresh();
    toast.success(`Order status changed to ${status}`);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const saveTracking = async (id: string) => {
    const tracking_number = trackingEdits[id];
    if (!tracking_number) return;
    const { error } = await supabase.from('orders').update({ tracking_number }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    flushEmailQueue();
    toast.success('Tracking number saved');
    setOrders(prev => prev.map(o => o.id === id ? { ...o, tracking_number } : o));
    setTrackingEdits(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Order Management" subtitle="All customer orders and shipping status" />
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-2">
            {orders.length === 0 && (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No orders yet</CardContent></Card>
            )}
            {orders.map((o: any, i: number) => (
              <Card
                key={o.id}
                onClick={() => o.kind !== 'store' && navigate(`/admin/orders/${o.id}`)}
                className={`opacity-0 animate-fade-in-up active:scale-[0.99] transition-all min-h-[72px] ${o.kind !== 'store' ? 'cursor-pointer' : ''}`}
                style={{ animationDelay: `${100 + i * 50}ms`, animationFillMode: 'forwards' }}
              >
                <CardContent className="p-4 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{o.order_ref || `#${o.id.slice(0, 8)}`} · {o.customer_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {o.type} · {new Date(o.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${statusColor[o.status] || ''}`}>{o.status}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-semibold text-sm">SAR {Number(o.total).toFixed(2)}</span>
                    {o.tracking_number && (
                      <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">{o.tracking_number}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50 text-muted-foreground">
                  <th className="text-left p-3">Order ID</th><th className="text-left p-3">Customer</th><th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Status</th><th className="text-left p-3">Total</th><th className="text-left p-3">Tracking</th>
                  <th className="text-left p-3">Date</th><th className="text-left p-3">Status</th><th className="text-left p-3">Actions</th>
                </tr></thead>
                <tbody>
                  {orders.map((o: any, i: number) => (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30 opacity-0 animate-fade-in transition-all duration-300" style={{ animationDelay: `${250 + i * 60}ms`, animationFillMode: 'forwards' }}>
                      <td className="p-3 font-medium">{o.order_ref || o.id.slice(0, 8)}</td>
                      <td className="p-3">{o.customer_name}</td>
                      <td className="p-3"><Badge variant="outline" className="capitalize">{o.type}</Badge></td>
                      <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[o.status] || ''}`}>{o.status}</span></td>
                      <td className="p-3 font-semibold">SAR {Number(o.total).toFixed(2)}</td>
                      <td className="p-3">
                        {o.kind === 'store' ? <span className="text-xs text-muted-foreground">—</span> : (
                          <div className="flex items-center gap-1">
                            <Input
                              className="h-7 w-28 text-xs"
                              placeholder="Track #"
                              defaultValue={o.tracking_number || ''}
                              onChange={e => setTrackingEdits(prev => ({ ...prev, [o.id]: e.target.value }))}
                            />
                            {trackingEdits[o.id] && (
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveTracking(o.id)}>
                                <Save className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Select defaultValue={o.status} onValueChange={(v) => updateStatus(o.id, v, o.kind)}>
                          <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(STATUSES_BY_KIND[o.kind] || STATUSES_BY_KIND.dashboard).map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        {o.kind !== 'store' && (
                          <Button size="sm" variant="outline" onClick={() => navigate(`/admin/orders/${o.id}`)}>
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No orders yet</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default OrdersAdmin;
