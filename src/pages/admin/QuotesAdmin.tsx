import { sellPriceSar } from '@/lib/priceConversion';
import { useEffect, useState } from 'react';
import { FileText, Package, Send, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { triggerAdminPendingCountsRefresh } from '@/hooks/useAdminPendingCounts';

const STATUSES = ['pending', 'reviewing', 'quoted', 'accepted', 'rejected', 'closed'];

export default function QuotesAdmin() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<Record<string, any>>({});
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [active, setActive] = useState<any>(null);

  const load = async () => {
    const { data } = await supabase.from('quote_requests').select('*').order('created_at', { ascending: false });
    setItems(data ?? []);
    const userIds = Array.from(new Set((data ?? []).map(d => d.user_id)));
    const prodIds = Array.from(new Set((data ?? []).map(d => d.product_id)));
    const [pr, pp] = await Promise.all([
      userIds.length ? supabase.from('profiles').select('user_id, display_name, email').in('user_id', userIds) : Promise.resolve({ data: [] } as any),
      prodIds.length ? supabase.from('products').select('id, name, images, sku, price_sar, dropship_price').in('id', prodIds) : Promise.resolve({ data: [] } as any),
    ]);
    const pm: Record<string, any> = {}; (pr.data ?? []).forEach((p: any) => { pm[p.user_id] = p; }); setProfiles(pm);
    const pmap: Record<string, any> = {}; (pp.data ?? []).forEach((p: any) => { pmap[p.id] = p; }); setProducts(pmap);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('admin-quotes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quote_requests' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = items.filter(it => it.status === filter);
  const counts: Record<string, number> = {};
  STATUSES.forEach(s => { counts[s] = items.filter(i => i.status === s).length; });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk quote requests"
        highlight="quotes"
        subtitle="Negotiate bulk pricing on catalog products"
      />

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="flex-wrap h-auto">
          {STATUSES.map(s => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s} {counts[s] > 0 && <Badge variant="secondary" className="ml-2 h-5">{counts[s]}</Badge>}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid gap-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="aux-card p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-semibold">No {filter} quotes</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(it => {
            const product = products[it.product_id];
            const profile = profiles[it.user_id];
            return (
              <button key={it.id} onClick={() => setActive(it)} className="aux-card p-4 text-left hover:border-emerald-300/70 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted/60 overflow-hidden flex items-center justify-center shrink-0">
                    {product?.images?.[0] ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" /> : <Package className="h-5 w-5 text-muted-foreground/40" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{product?.name ?? '—'}</h3>
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">{profile?.display_name ?? profile?.email ?? 'Customer'}</strong> · Qty {it.quantity} · Target SAR {Number(it.target_price_sar).toFixed(2)} · {new Date(it.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <AdminQuoteSheet item={active} product={active ? products[active.product_id] : null} profile={active ? profiles[active.user_id] : null} onClose={() => setActive(null)} onUpdate={load} adminId={user?.id} />
    </div>
  );
}

function AdminQuoteSheet({ item, product, profile, onClose, onUpdate, adminId }: any) {
  const [form, setForm] = useState({ admin_reply: '', quoted_price_sar: '', valid_until: '', status: 'reviewing' });
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!item?.id) return;
    setForm({
      admin_reply: item.admin_reply ?? '',
      quoted_price_sar: item.quoted_price_sar ? String(item.quoted_price_sar) : '',
      valid_until: item.valid_until ?? '',
      status: item.status,
    });
    supabase.from('request_messages').select('*')
      .eq('request_id', item.id).eq('request_type', 'quote')
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data ?? []));
    const ch = supabase.channel(`adm-q-${item.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'request_messages', filter: `request_id=eq.${item.id}` },
        ({ new: m }: any) => setMessages(p => [...p, m]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [item?.id]);

  const save = async () => {
    setWorking(true);
    const qp = form.quoted_price_sar ? Number(form.quoted_price_sar) : null;
    const { error } = await supabase.from('quote_requests').update({
      status: form.status,
      admin_reply: form.admin_reply || null,
      quoted_price_sar: qp,
      quoted_total_sar: qp ? qp * item.quantity : null,
      valid_until: form.valid_until || null,
    }).eq('id', item.id);
    setWorking(false);
    if (error) { toast.error(error.message); return; }
    triggerAdminPendingCountsRefresh();
    toast.success('Quote updated');
    onUpdate();
  };

  const send = async () => {
    if (!reply.trim() || !adminId) return;
    const { error } = await supabase.from('request_messages').insert({
      request_id: item.id, request_type: 'quote', user_id: adminId, is_admin: true, message: reply.trim(),
    });
    if (error) { toast.error(error.message); return; }
    triggerAdminPendingCountsRefresh();
    setReply('');
  };

  if (!item) return null;

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-xl flex flex-col">
        <SheetHeader>
          <SheetTitle className="pr-8">{product?.name ?? 'Quote'}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-4 mt-4">
          <div className="text-xs text-muted-foreground">From <strong className="text-foreground">{profile?.display_name ?? profile?.email ?? 'Customer'}</strong> · {new Date(item.created_at).toLocaleString()}</div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground mb-0.5">Quantity</p><p className="font-medium">{item.quantity}</p></div>
            <div><p className="text-xs text-muted-foreground mb-0.5">Target / unit</p><p className="font-medium">SAR {Number(item.target_price_sar).toFixed(2)}</p></div>
            <div><p className="text-xs text-muted-foreground mb-0.5">Catalog price</p><p className="font-medium">SAR {sellPriceSar(product).toFixed(2)}</p></div>
            <div><p className="text-xs text-muted-foreground mb-0.5">SKU</p><p className="font-medium">{product?.sku ?? '—'}</p></div>
            {item.destination && <div className="col-span-2"><p className="text-xs text-muted-foreground mb-0.5">Destination</p><p className="text-sm">{item.destination}</p></div>}
            {item.notes && <div className="col-span-2"><p className="text-xs text-muted-foreground mb-0.5">Buyer notes</p><p className="text-sm">{item.notes}</p></div>}
          </div>

          <div className="border-t pt-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">Respond with quote</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
              <div>
                <Label>Quoted / unit (SAR)</Label>
                <Input type="number" step="0.01" value={form.quoted_price_sar} onChange={e => setForm({ ...form, quoted_price_sar: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Valid until</Label>
              <Input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} />
            </div>
            <div>
              <Label>Reply to buyer</Label>
              <Textarea rows={3} value={form.admin_reply} onChange={e => setForm({ ...form, admin_reply: e.target.value })} />
            </div>
            {form.quoted_price_sar && (
              <div className="text-sm bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                Total quote: <strong className="text-emerald-700">SAR {(Number(form.quoted_price_sar) * item.quantity).toFixed(2)}</strong> ({item.quantity} units)
              </div>
            )}
            <Button onClick={save} disabled={working} className="w-full">Save & Notify Buyer</Button>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Conversation</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {messages.length === 0 && <p className="text-sm text-muted-foreground italic">No messages yet.</p>}
              {messages.map(m => (
                <div key={m.id} className={`p-2.5 rounded-xl text-sm ${m.is_admin ? 'bg-emerald-50 border border-emerald-200' : 'bg-muted/60'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">{m.is_admin ? 'You (Admin)' : profile?.display_name ?? 'Buyer'}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{m.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t pt-3 mt-3 flex gap-2">
          <Input placeholder="Reply to buyer..." value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
          <Button onClick={send} disabled={!reply.trim()}><Send className="h-4 w-4" /></Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
