import { useEffect, useState } from 'react';
import { Link } from "@/lib/router-compat";
import { FileText, Clock, CheckCircle2, XCircle, MessageCircle, Send, Package, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { useMonthlyUsage } from '@/hooks/useMonthlyUsage';

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: 'Pending',   color: 'bg-amber-50 text-amber-700 border-amber-200',       icon: Clock },
  reviewing: { label: 'Reviewing', color: 'bg-sky-50 text-sky-700 border-sky-200',             icon: MessageCircle },
  quoted:    { label: 'Quoted',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  accepted:  { label: 'Accepted',  color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
  rejected:  { label: 'Declined',  color: 'bg-rose-50 text-rose-700 border-rose-200',          icon: XCircle },
  closed:    { label: 'Closed',    color: 'bg-muted text-muted-foreground border-border',      icon: XCircle },
};

export default function QuoteRequests() {
  const { user } = useAuth();
  const { numericLimit, isUnlimited } = useCurrentPlan();
  const monthlyLimit = numericLimit('quote_requests_monthly');
  const monthlyUnlimited = isUnlimited('quote_requests_monthly');
  const slaHrs = numericLimit('sourcing_sla_hours');
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<any>(null);

  const usedThisMonth = items.filter(i => {
    const d = new Date(i.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const load = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('quote_requests').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setItems(data ?? []);
    const ids = Array.from(new Set((data ?? []).map(d => d.product_id)));
    if (ids.length) {
      const { data: prods } = await supabase.from('products').select('id, name, images, sku').in('id', ids);
      const map: Record<string, any> = {};
      (prods ?? []).forEach(p => { map[p.id] = p; });
      setProducts(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user?.id) return;
    const channel = supabase.channel('quotes-buyer')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quote_requests', filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk quotes"
        highlight="quotes"
        subtitle="Negotiated bulk pricing on products in our catalog. Request a quote from any product page."
        guide={{
          chip: 'Negotiating bulk pricing',
          intro: 'Get tailored pricing on volume orders.',
          steps: [
            { title: 'Pick product', description: 'Choose any item from our catalog to negotiate on.' },
            { title: 'Submit RFQ', description: 'Send your quantity and target price as a request.' },
            { title: 'Reply', description: 'Receive a tailored quote within 24 business hours.' },
          ],
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {monthlyUnlimited ? 'Unlimited quotes/mo' : `${usedThisMonth} / ${monthlyLimit || 0} used this month`}
        </Badge>
        {slaHrs > 0 && (
          <Badge variant="outline" className="text-xs text-primary border-primary/40">Reply SLA: {slaHrs}h</Badge>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="aux-card p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-semibold mb-1">No quote requests yet</p>
          <p className="text-sm text-muted-foreground mb-4">Browse the catalog and click "Request Bulk Quote" on any product to negotiate pricing.</p>
          <Link to="/dropshipping/catalog"><Button>Browse Catalog</Button></Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map(it => {
            const meta = STATUS_META[it.status] ?? STATUS_META.pending;
            const Icon = meta.icon;
            const product = products[it.product_id];
            return (
              <button key={it.id} onClick={() => setActive(it)} className="aux-card p-4 text-left hover:border-emerald-300/70 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-muted/60 overflow-hidden flex items-center justify-center shrink-0">
                    {product?.images?.[0] ? (
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate mb-1">{product?.name ?? 'Product'}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Qty: <strong className="text-foreground">{it.quantity}</strong></span>
                      <span>Target: <strong className="text-foreground">SAR {Number(it.target_price_sar).toFixed(2)}</strong></span>
                      {it.quoted_price_sar && <span className="text-emerald-700 font-medium">Quoted: SAR {Number(it.quoted_price_sar).toFixed(2)}/unit</span>}
                    </div>
                  </div>
                  <Badge variant="outline" className={meta.color + ' shrink-0'}>
                    <Icon className="h-3 w-3 mr-1" /> {meta.label}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <QuoteSheet item={active} product={active ? products[active.product_id] : null} onClose={() => setActive(null)} onUpdate={load} />
    </div>
  );
}

function QuoteSheet({ item, product, onClose, onUpdate }: { item: any; product: any; onClose: () => void; onUpdate: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!item?.id) return;
    supabase.from('request_messages').select('*')
      .eq('request_id', item.id).eq('request_type', 'quote')
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data ?? []));
    const ch = supabase.channel(`quote-msg-${item.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'request_messages', filter: `request_id=eq.${item.id}` },
        ({ new: m }: any) => setMessages(p => [...p, m]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [item?.id]);

  const send = async () => {
    if (!reply.trim() || !user?.id || !item?.id) return;
    setSending(true);
    const { error } = await supabase.from('request_messages').insert({
      request_id: item.id, request_type: 'quote', user_id: user.id, is_admin: false, message: reply.trim(),
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setReply('');
    onUpdate();
  };

  const accept = async () => {
    if (!item?.id) return;
    const { error } = await supabase.from('quote_requests').update({ status: 'accepted' }).eq('id', item.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Quote accepted! Place your order from the catalog.');
    onUpdate();
    onClose();
  };

  if (!item) return null;
  const meta = STATUS_META[item.status] ?? STATUS_META.pending;

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="pr-8">{product?.name ?? 'Quote Request'}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-4 mt-4">
          <Badge variant="outline" className={meta.color}>{meta.label}</Badge>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground mb-0.5">Quantity</p><p className="font-medium">{item.quantity}</p></div>
            <div><p className="text-xs text-muted-foreground mb-0.5">Target / unit</p><p className="font-medium">SAR {Number(item.target_price_sar).toFixed(2)}</p></div>
            {item.quoted_price_sar && (
              <>
                <div><p className="text-xs text-muted-foreground mb-0.5">Quoted / unit</p><p className="font-medium text-emerald-700">SAR {Number(item.quoted_price_sar).toFixed(2)}</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Quoted total</p><p className="font-medium text-emerald-700">SAR {Number(item.quoted_total_sar ?? item.quoted_price_sar * item.quantity).toFixed(2)}</p></div>
              </>
            )}
            {item.destination && <div className="col-span-2"><p className="text-xs text-muted-foreground mb-0.5">Destination</p><p className="text-sm">{item.destination}</p></div>}
            {item.notes && <div className="col-span-2"><p className="text-xs text-muted-foreground mb-0.5">Notes</p><p className="text-sm">{item.notes}</p></div>}
            {item.admin_reply && (
              <div className="col-span-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-900 mb-1">Admin reply</p>
                <p className="text-sm text-emerald-900 whitespace-pre-wrap">{item.admin_reply}</p>
                {item.valid_until && <p className="text-xs text-emerald-700 mt-2">Valid until: {new Date(item.valid_until).toLocaleDateString()}</p>}
              </div>
            )}
            {item.status === 'quoted' && (
              <div className="col-span-2 flex gap-2">
                <Button onClick={accept} className="flex-1 bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="h-4 w-4 mr-2" /> Accept Quote</Button>
              </div>
            )}
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Conversation</p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {messages.length === 0 && <p className="text-sm text-muted-foreground italic">No messages yet.</p>}
              {messages.map(m => (
                <div key={m.id} className={`p-2.5 rounded-xl text-sm ${m.is_admin ? 'bg-emerald-50 border border-emerald-200' : 'bg-muted/60'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">{m.is_admin ? 'Tejaraa Team' : 'You'}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{m.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t pt-3 mt-3 flex gap-2">
          <Input placeholder="Reply..." value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
          <Button onClick={send} disabled={sending || !reply.trim()}><Send className="h-4 w-4" /></Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
