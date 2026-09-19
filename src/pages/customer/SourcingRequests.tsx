import { useEffect, useState } from 'react';
import { Link } from "@/lib/router-compat";
import { Plus, Package, ExternalLink, Clock, CheckCircle2, XCircle, MessageCircle, Send, Search } from 'lucide-react';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { PlanFeatureChip } from '@/components/customer/PlanFeatureChip';
import UpgradePrompt from '@/components/UpgradePrompt';

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: 'Pending',   color: 'bg-amber-50 text-amber-700 border-amber-200',     icon: Clock },
  reviewing: { label: 'Reviewing', color: 'bg-sky-50 text-sky-700 border-sky-200',           icon: MessageCircle },
  quoted:    { label: 'Quoted',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  converted: { label: 'In Catalog',color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
  rejected:  { label: 'Declined',  color: 'bg-rose-50 text-rose-700 border-rose-200',         icon: XCircle },
  closed:    { label: 'Closed',    color: 'bg-muted text-muted-foreground border-border',     icon: XCircle },
};

export default function SourcingRequests() {
  const { user } = useAuth();
  const { numericLimit, isUnlimited, hasFeature, planName } = useCurrentPlan();
  const monthlyLimit = numericLimit('sourcing_requests_monthly');
  const monthlyUnlimited = isUnlimited('sourcing_requests_monthly');
  const slaHrs = numericLimit('sourcing_sla_hours');
  const sampleSourcing = numericLimit('sample_sourcing');
  const supplierNeg = hasFeature('supplier_negotiation');
  const privateLabel = hasFeature('private_label_sourcing');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<any>(null);
  const [form, setForm] = useState({ product_name: '', product_link: '', target_price_sar: '', quantity: '1', destination: '', category: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const usedThisMonth = items.filter(i => {
    const d = new Date(i.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const monthlyExceeded = !monthlyUnlimited && monthlyLimit > 0 && usedThisMonth >= monthlyLimit;

  const load = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('sourcing_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user?.id) return;
    const channel = supabase
      .channel('sourcing-buyer')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sourcing_requests', filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const submit = async () => {
    if (!user?.id || !form.product_name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (monthlyExceeded) {
      toast.error(`Monthly limit reached (${monthlyLimit}). Upgrade for more sourcing requests.`);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('sourcing_requests').insert({
      user_id: user.id,
      product_name: form.product_name.trim(),
      product_link: form.product_link.trim() || null,
      target_price_sar: Number(form.target_price_sar) || 0,
      quantity: Number(form.quantity) || 1,
      destination: form.destination.trim(),
      category: form.category.trim(),
      notes: form.notes.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Sourcing request submitted! Our team will reply soon.');
    setForm({ product_name: '', product_link: '', target_price_sar: '', quantity: '1', destination: '', category: '', notes: '' });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product sourcing"
        highlight="sourcing"
        subtitle="Need a product not in our catalog? Tell us and we'll source it for you."
        guide={{
          chip: 'How sourcing works',
          intro: 'We hunt down products you can\u2019t find anywhere else.',
          steps: [
            { title: 'Describe', description: 'Tell us the product, target price, and quantity.' },
            { title: 'We hunt', description: 'Our team checks local and global suppliers for you.' },
            { title: 'Quote', description: 'Receive sourcing options and pricing within 48 hours.' },
          ],
        }}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={monthlyExceeded} className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-600/20">
                <Plus className="h-4 w-4 mr-2" /> New Request
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Request a Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Product name *</Label>
                <Input value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} placeholder="e.g. Wireless car charger 15W" />
              </div>
              <div>
                <Label>Reference link (Amazon, Alibaba, etc.)</Label>
                <Input value={form.product_link} onChange={e => setForm({ ...form, product_link: e.target.value })} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Target price (SAR)</Label>
                  <Input type="number" step="0.01" value={form.target_price_sar} onChange={e => setForm({ ...form, target_price_sar: e.target.value })} />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Electronics" />
                </div>
                <div>
                  <Label>Destination</Label>
                  <Input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="FBA Riyadh / Own warehouse" />
                </div>
              </div>
              <div>
                <Label>Notes / specs</Label>
                <Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Color, packaging, certifications, etc." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={submitting}>Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        }
      />

      {/* Plan perks ribbon */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {monthlyUnlimited ? 'Unlimited requests/mo' : `${usedThisMonth} / ${monthlyLimit || 0} used this month`}
        </Badge>
        {slaHrs > 0 && (
          <Badge variant="outline" className="text-xs text-primary border-primary/40">SLA: {slaHrs}h</Badge>
        )}
        {sampleSourcing > 0
          ? <PlanFeatureChip locked={false} label={`${sampleSourcing} samples/mo`} />
          : <PlanFeatureChip label="Sample sourcing — upgrade" />}
        {supplierNeg
          ? <PlanFeatureChip locked={false} label="Supplier negotiation" />
          : <PlanFeatureChip label="Supplier negotiation — upgrade" />}
        {privateLabel
          ? <PlanFeatureChip locked={false} label="Private-label sourcing" />
          : <PlanFeatureChip label="Private-label — upgrade" />}
      </div>

      {monthlyExceeded && (
        <UpgradePrompt
          currentPlan={planName}
          limitLabel="sourcing requests this month"
          usage={usedThisMonth}
          limit={monthlyLimit}
        />
      )}

      {loading ? (
        <div className="grid gap-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="aux-card p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-semibold mb-1">No sourcing requests yet</p>
          <p className="text-sm text-muted-foreground mb-4">Tell us what product you need and our sourcing team will get back with pricing.</p>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Create your first request</Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map(it => {
            const meta = STATUS_META[it.status] ?? STATUS_META.pending;
            const Icon = meta.icon;
            return (
              <button key={it.id} onClick={() => setActive(it)} className="aux-card p-4 text-left hover:border-emerald-300/70 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{it.product_name}</h3>
                      {it.product_link && <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Qty: <strong className="text-foreground">{it.quantity}</strong></span>
                      <span>Target: <strong className="text-foreground">SAR {Number(it.target_price_sar).toFixed(2)}</strong></span>
                      {it.quoted_price_sar && <span className="text-emerald-700 font-medium">Quoted: SAR {Number(it.quoted_price_sar).toFixed(2)}</span>}
                      <span>{new Date(it.created_at).toLocaleDateString()}</span>
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

      <RequestSheet item={active} onClose={() => setActive(null)} onUpdate={load} />
    </div>
  );
}

function RequestSheet({ item, onClose, onUpdate }: { item: any; onClose: () => void; onUpdate: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!item?.id) return;
    supabase.from('request_messages').select('*')
      .eq('request_id', item.id).eq('request_type', 'sourcing')
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data ?? []));

    const ch = supabase.channel(`sourcing-msg-${item.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'request_messages', filter: `request_id=eq.${item.id}` },
        ({ new: m }: any) => setMessages(p => [...p, m]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [item?.id]);

  const send = async () => {
    if (!reply.trim() || !user?.id || !item?.id) return;
    setSending(true);
    const { error } = await supabase.from('request_messages').insert({
      request_id: item.id, request_type: 'sourcing', user_id: user.id, is_admin: false, message: reply.trim(),
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setReply('');
    onUpdate();
  };

  if (!item) return null;
  const meta = STATUS_META[item.status] ?? STATUS_META.pending;

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="pr-8">{item.product_name}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-4 mt-4">
          <Badge variant="outline" className={meta.color}>{meta.label}</Badge>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Quantity" value={item.quantity} />
            <Field label="Target Price" value={`SAR ${Number(item.target_price_sar).toFixed(2)}`} />
            <Field label="Category" value={item.category || '—'} />
            <Field label="Destination" value={item.destination || '—'} />
            {item.quoted_price_sar && <Field label="Quoted Price" value={`SAR ${Number(item.quoted_price_sar).toFixed(2)}`} highlight />}
            {item.product_link && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Reference</p>
                <a href={item.product_link} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 hover:underline break-all">{item.product_link}</a>
              </div>
            )}
            {item.notes && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{item.notes}</p>
              </div>
            )}
            {item.admin_reply && (
              <div className="col-span-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-900 mb-1">Admin reply</p>
                <p className="text-sm text-emerald-900 whitespace-pre-wrap">{item.admin_reply}</p>
              </div>
            )}
            {item.converted_product_id && (
              <Link to={`/dropshipping/catalog/${item.converted_product_id}`} className="col-span-2">
                <Button variant="outline" className="w-full"><Package className="h-4 w-4 mr-2" /> View product in catalog</Button>
              </Link>
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

function Field({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${highlight ? 'text-emerald-700' : ''}`}>{value}</p>
    </div>
  );
}
