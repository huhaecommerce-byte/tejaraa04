import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Flame, Ticket, Truck, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSunsky } from '@/hooks/useSunsky';

function rowsOf(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  const d = (data ?? {}) as Record<string, any>;
  const list = d.result ?? d.list ?? d.items ?? d.orders ?? d.coupons ?? d.data;
  return Array.isArray(list) ? list : [];
}

/* -------------------------------------------------------------------------- */
/*  Orders                                                                    */
/* -------------------------------------------------------------------------- */
export function SunskyOrdersPanel() {
  const { call, loading } = useSunsky();
  const [orders, setOrders] = useState<any[] | null>(null);
  const [orderNo, setOrderNo] = useState('');
  const [balance, setBalance] = useState<string>('—');

  async function loadOrders() {
    const r = await call('order/search', { page: 1, pageSize: 50 });
    if (r.result === 'success') setOrders(rowsOf(r.data));
  }
  async function loadBalance() {
    const r = await call('account/balance', {}, { silent: true });
    if (r.result === 'success') {
      const d = (r.data ?? {}) as Record<string, any>;
      setBalance(`${d.balance ?? d.amount ?? '—'} ${d.currency ?? ''}`.trim());
    }
  }
  useEffect(() => { void loadBalance(); }, []);

  async function lookup() {
    if (!orderNo.trim()) return;
    const r = await call('order/details', { orderNo: orderNo.trim() });
    if (r.result === 'success') setOrders(rowsOf(r.data).length ? rowsOf(r.data) : [r.data]);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Truck className="h-4 w-4" /> SunSky orders</CardTitle>
          <CardDescription>Look up orders placed on your SunSky account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Order number</Label>
              <Input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="e.g. SO123456" className="w-56" />
            </div>
            <Button onClick={lookup} disabled={loading} variant="outline">Look up</Button>
            <Button onClick={loadOrders} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Load recent orders
            </Button>
            <Badge variant="outline" className="ml-auto gap-1"><Wallet className="h-3 w-3" /> Balance {balance}</Badge>
          </div>

          {orders == null ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No orders loaded yet.</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o, i) => (
                    <TableRow key={o.orderNo ?? o.id ?? i}>
                      <TableCell className="font-mono text-xs">{o.orderNo ?? o.id ?? '—'}</TableCell>
                      <TableCell className="text-xs">{o.statusName ?? o.status ?? '—'}</TableCell>
                      <TableCell className="text-xs font-semibold">{o.totalAmount ?? o.amount ?? '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{o.createTime ?? o.createdAt ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Coupons                                                                   */
/* -------------------------------------------------------------------------- */
export function SunskyCouponsPanel() {
  const { call, loading } = useSunsky();
  const [rows, setRows] = useState<any[] | null>(null);

  async function load() {
    const r = await call('coupon/list', {});
    if (r.result === 'success') setRows(rowsOf(r.data));
  }
  useEffect(() => { void load(); }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Ticket className="h-4 w-4" /> Coupons</CardTitle>
        <CardDescription>Coupons available on your SunSky account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={load} disabled={loading} variant="outline" size="sm" className="mb-3">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
        {rows == null || rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No coupons available.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((c, i) => (
              <div key={c.code ?? c.id ?? i} className="rounded-xl border bg-card p-3">
                <div className="font-mono text-sm font-bold">{c.code ?? c.couponCode ?? '—'}</div>
                <div className="text-xs text-muted-foreground">{c.name ?? c.description ?? ''}</div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="font-semibold text-emerald-700">{c.amount ?? c.value ?? '—'}</span>
                  <span className="text-muted-foreground">{c.expireTime ?? c.endTime ?? ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hot items                                                                 */
/* -------------------------------------------------------------------------- */
export function SunskyHotItemsPanel() {
  const { call, loading } = useSunsky();
  const [rows, setRows] = useState<any[] | null>(null);

  async function load() {
    const r = await call('stats/hot', { page: 1, pageSize: 40, lang: 'en' });
    if (r.result === 'success') setRows(rowsOf(r.data));
  }
  useEffect(() => { void load(); }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Flame className="h-4 w-4" /> Hot items</CardTitle>
        <CardDescription>SunSky's current best sellers.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={load} disabled={loading} variant="outline" size="sm" className="mb-3">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
        {rows == null || rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No hot items returned.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {rows.map((it, i) => {
              const itemNo = it.itemNo ?? it.item_no ?? it.id ?? `i-${i}`;
              const img = it.imageUrl ?? (Array.isArray(it.images) ? it.images[0] : null)
                ?? `https://img.sunsky-online.com/${itemNo}.jpg`;
              return (
                <div key={String(itemNo)} className="rounded-lg border bg-card p-1.5">
                  <img src={img} alt="" className="w-full h-20 object-cover rounded bg-muted"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                  <div className="text-[10px] font-mono truncate mt-1">{String(itemNo)}</div>
                  <div className="text-[11px] font-bold text-emerald-700">
                    {it.price != null ? `$${Number(it.price).toFixed(2)}` : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
