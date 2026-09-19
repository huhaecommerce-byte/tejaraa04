import { useEffect, useState } from 'react';
import { Inbox, ExternalLink, Package, Send, ArrowRight, Wand2 } from 'lucide-react';
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

const STATUSES = ['pending', 'reviewing', 'quoted', 'converted', 'rejected', 'closed'];

export default function SourcingInbox() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [active, setActive] = useState<any>(null);

  const load = async () => {
    const { data } = await supabase.from('sourcing_requests').select('*').order('created_at', { ascending: false });
    setItems(data ?? []);
    const ids = Array.from(new Set((data ?? []).map(d => d.user_id)));
    if (ids.length) {
      const { data: ps } = await supabase.from('profiles').select('user_id, display_name, email').in('user_id', ids);
      const map: Record<string, any> = {};
      (ps ?? []).forEach(p => { map[p.user_id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('admin-sourcing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sourcing_requests' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = items.filter(it => it.status === filter);
  const counts: Record<string, number> = {};
  STATUSES.forEach(s => { counts[s] = items.filter(i => i.status === s).length; });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sourcing inbox"
        highlight="inbox"
        subtitle="Buyer requests for products to source"
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
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-semibold">No {filter} requests</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(it => {
            const profile = profiles[it.user_id];
            return (
              <button key={it.id} onClick={() => setActive(it)} className="aux-card p-4 text-left hover:border-emerald-300/70 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{it.product_name}</h3>
                      {it.product_link && <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />}
                    </div>
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

      <AdminSourcingSheet item={active} profile={active ? profiles[active.user_id] : null} onClose={() => setActive(null)} onUpdate={load} adminId={user?.id} />
    </div>
  );
}

function AdminSourcingSheet({ item, profile, onClose, onUpdate, adminId }: any) {
  const [form, setForm] = useState({ admin_reply: '', quoted_price_sar: '', status: 'reviewing' });
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!item?.id) return;
    setForm({ admin_reply: item.admin_reply ?? '', quoted_price_sar: item.quoted_price_sar ? String(item.quoted_price_sar) : '', status: item.status });
    supabase.from('request_messages').select('*')
      .eq('request_id', item.id).eq('request_type', 'sourcing')
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data ?? []));
    const ch = supabase.channel(`adm-src-${item.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'request_messages', filter: `request_id=eq.${item.id}` },
        ({ new: m }: any) => setMessages(p => [...p, m]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [item?.id]);

  const save = async () => {
    setWorking(true);
    const { error } = await supabase.from('sourcing_requests').update({
      status: form.status,
      admin_reply: form.admin_reply || null,
      quoted_price_sar: form.quoted_price_sar ? Number(form.quoted_price_sar) : null,
    }).eq('id', item.id);
    setWorking(false);
    if (error) { toast.error(error.message); return; }
    triggerAdminPendingCountsRefresh();
    toast.success('Request updated');
    onUpdate();
  };

  const send = async () => {
    if (!reply.trim() || !adminId) return;
    const { error } = await supabase.from('request_messages').insert({
      request_id: item.id, request_type: 'sourcing', user_id: adminId, is_admin: true, message: reply.trim(),
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
          <SheetTitle className="pr-8">{item.product_name}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-4 mt-4">
          <div className="text-xs text-muted-foreground">From <strong className="text-foreground">{profile?.display_name ?? profile?.email ?? 'Customer'}</strong> · {new Date(item.created_at).toLocaleString()}</div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Quantity" value={item.quantity} />
            <Field label="Target price" value={`SAR ${Number(item.target_price_sar).toFixed(2)}`} />
            <Field label="Category" value={item.category || '—'} />
            <Field label="Destination" value={item.destination || '—'} />
            {item.product_link && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Reference link</p>
                <a href={item.product_link} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 hover:underline break-all">{item.product_link}</a>
              </div>
            )}
            {item.notes && <div className="col-span-2"><p className="text-xs text-muted-foreground mb-1">Buyer notes</p><p className="text-sm">{item.notes}</p></div>}
          </div>

          <div className="border-t pt-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">Manage</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
              <div>
                <Label>Quoted price (SAR)</Label>
                <Input type="number" step="0.01" value={form.quoted_price_sar} onChange={e => setForm({ ...form, quoted_price_sar: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Admin reply (visible to buyer)</Label>
              <Textarea rows={3} value={form.admin_reply} onChange={e => setForm({ ...form, admin_reply: e.target.value })} placeholder="Pricing details, lead time, alternatives..." />
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={working} className="flex-1">Save & Notify Buyer</Button>
              <ConvertToProductButton item={item} onConverted={onUpdate} />
            </div>
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

function Field({ label, value }: any) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function ConvertToProductButton({ item, onConverted }: any) {
  const [working, setWorking] = useState(false);

  const convert = async () => {
    if (item.converted_product_id) {
      toast.info('Already converted');
      return;
    }
    if (!confirm(`Create a product from "${item.product_name}"? You can edit details after.`)) return;
    setWorking(true);
    try {
      const sku = `SRC-${item.id.slice(0, 8).toUpperCase()}`;
      const price = Number(item.quoted_price_sar) || Number(item.target_price_sar) || 0;
      const { data: product, error } = await supabase.from('products').insert({
        sku,
        name: item.product_name,
        top_category: item.category || 'General',
        sub_category: '',
        detailed_category: '',
        source: 'sourcing',
        moq: 1,
        weight_kg: 0,
        price_sar: price,
        cost_usd: 0,
        description: item.notes || '',
      }).select('id').single();
      if (error) throw error;
      await supabase.from('sourcing_requests').update({
        converted_product_id: product.id,
        status: 'converted',
      }).eq('id', item.id);
      toast.success('Product created — open the catalog to refine details');
      onConverted();
    } catch (e: any) {
      toast.error(e.message || 'Failed to convert');
    } finally {
      setWorking(false);
    }
  };

  return (
    <Button onClick={convert} disabled={working || !!item.converted_product_id} variant="outline" className="shrink-0">
      <Wand2 className="h-4 w-4 mr-1.5" />
      {item.converted_product_id ? 'Converted' : 'Convert to Product'}
    </Button>
  );
}
