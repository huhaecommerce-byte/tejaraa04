import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from "@/lib/router-compat";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ArrowLeft, Send, Package, MapPin, Truck, Calendar, MessageSquare, Undo2, XCircle, Clock,
  Copy, RefreshCw, CreditCard, Hash, ChevronRight,
} from 'lucide-react';
import { RequestReturnDialog } from '@/components/customer/RequestReturnDialog';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { ShipmentTimeline } from '@/components/customer/ShipmentTimeline';
import { cn } from '@/lib/utils';
import { flushEmailQueue } from '@/lib/flushEmails';

const statusPillCls: Record<string, string> = {
  pending: 'aux-pill aux-pill-amber',
  processing: 'aux-pill aux-pill-sky',
  labelling: 'aux-pill aux-pill-violet',
  shipped: 'aux-pill aux-pill-sky',
  delivered: 'aux-pill aux-pill-emerald',
  cancelled: 'aux-pill aux-pill-rose',
};

const heroGradient: Record<string, string> = {
  pending: 'from-amber-500/20 via-amber-500/5 to-transparent',
  processing: 'from-sky-500/20 via-sky-500/5 to-transparent',
  labelling: 'from-violet-500/20 via-violet-500/5 to-transparent',
  shipped: 'from-sky-500/25 via-sky-500/5 to-transparent',
  delivered: 'from-emerald-500/25 via-emerald-500/5 to-transparent',
  cancelled: 'from-rose-500/20 via-rose-500/5 to-transparent',
};

const CustomerOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { numericLimit, planName } = useCurrentPlan();
  const editWindowHrs = numericLimit('order_edit_window_hours');
  const [order, setOrder] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [returnOpen, setReturnOpen] = useState(false);
  const [hasReturn, setHasReturn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user?.id) return;
    supabase.from('return_requests').select('id').eq('order_id', id).eq('user_id', user.id).limit(1)
      .then(({ data }) => setHasReturn((data?.length || 0) > 0));
  }, [id, user?.id]);

  useEffect(() => {
    if (!id || !user?.id) return;
    const load = async () => {
      setLoading(true);
      const [orderRes, msgRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', id).eq('user_id', user.id).single(),
        supabase.from('order_messages').select('*').eq('order_id', id).order('created_at', { ascending: true }),
      ]);
      setOrder(orderRes.data);
      setMessages(msgRes.data || []);
      const prods = Array.isArray(orderRes.data?.products) ? orderRes.data.products : [];
      const productIds = prods.map((p: any) => p.product_id).filter(Boolean);
      if (productIds.length > 0) {
        const { data: prodData } = await supabase.from('products').select('id, images').in('id', productIds);
        const imgMap: Record<string, string> = {};
        prodData?.forEach((p: any) => { if (p.images?.[0]) imgMap[p.id] = p.images[0]; });
        setProductImages(imgMap);
      }
      setLoading(false);
    };
    load();
  }, [id, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !id) return;
    setSending(true);
    const { data, error } = await supabase.from('order_messages').insert({
      order_id: id, user_id: user.id, message: newMessage.trim(), is_admin: false,
    }).select().single();
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setMessages(prev => [...prev, data]);
    setNewMessage('');
  };

  const cancelOrder = async () => {
    if (!order || !user?.id) return;
    if (!confirm('Cancel this order and refund the wallet? This cannot be undone.')) return;
    setCancelling(true);
    const { error: refundErr } = await supabase.rpc('wallet_admin_adjust', {
      _amount: Number(order.total) || 0,
      _description: `Refund for cancelled order #${order.id.slice(0, 8)}`,
      _type: 'refund',
      _user_id: user.id,
    });
    if (refundErr) console.warn('Refund failed, cancelling without refund:', refundErr.message);
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id).eq('user_id', user.id);
    setCancelling(false);
    if (error) { toast.error(error.message); return; }
    flushEmailQueue();
    toast.success('Order cancelled and wallet refunded');
    setOrder({ ...order, status: 'cancelled' });
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Copy failed');
    }
  };

  const reorder = () => {
    toast.success('Re-order: opening catalog');
    navigate('/dropshipping/catalog');
  };

  if (loading) return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
    </div>
  );
  if (!order) return <div className="text-center py-12 text-muted-foreground">Order not found.</div>;

  const products = Array.isArray(order.products) ? order.products : [];
  const itemCount = products.reduce((s: number, p: any) => s + (Number(p.quantity) || 0), 0);
  const subtotal = products.reduce((s: number, p: any) => s + Number(p.unit_price || 0) * Number(p.quantity || 0), 0);
  const shipping = Math.max(0, Number(order.total) - subtotal);
  const ageHours = (Date.now() - new Date(order.created_at).getTime()) / 3_600_000;
  const editable = editWindowHrs > 0 && ageHours < editWindowHrs && order.status === 'pending';
  const remainingMins = Math.max(0, Math.round((editWindowHrs - ageHours) * 60));
  const placedAt = new Date(order.created_at);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Button variant="ghost" size="sm" onClick={() => navigate('/dropshipping/orders')} className="mb-2 rounded-full">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
      </Button>

      {/* Hero */}
      <div className={cn(
        'aux-card relative overflow-hidden bg-gradient-to-br',
        heroGradient[order.status] || 'from-muted/30 to-transparent'
      )}>
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative p-6 space-y-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Hash className="h-3 w-3" /> Order
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight aux-num">
                  #{order.id.slice(0, 8)}
                </h1>
                <button
                  onClick={() => copyText(order.id, 'Order ID')}
                  className="aux-chip aux-chip-emerald hover:scale-105 transition-transform"
                  aria-label="Copy order ID"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Placed {placedAt.toLocaleString()}
              </p>
            </div>
            <span className={cn(statusPillCls[order.status] || 'aux-pill aux-pill-slate', 'capitalize text-sm')}>
              {order.status}
            </span>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-background/60 backdrop-blur-sm border border-border/60 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Items</p>
              <p className="text-lg font-bold mt-0.5 aux-num">{itemCount}</p>
            </div>
            <div className="rounded-xl bg-background/60 backdrop-blur-sm border border-border/60 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Total</p>
              <p className="text-lg font-bold mt-0.5 aux-num">SAR {Number(order.total).toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-background/60 backdrop-blur-sm border border-border/60 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Type</p>
              <p className="text-sm font-semibold mt-1 capitalize flex items-center gap-1">
                <Package className="h-3.5 w-3.5 text-primary" /> {order.type}
              </p>
            </div>
            <div className="rounded-xl bg-background/60 backdrop-blur-sm border border-border/60 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Payment</p>
              <p className="text-sm font-semibold mt-1 flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5 text-primary" /> Wallet
              </p>
            </div>
          </div>

          {/* Timeline */}
          {order.status !== 'cancelled' && (
            <div className="rounded-xl bg-background/60 backdrop-blur-sm border border-border/60 p-4">
              <ShipmentTimeline
                status={order.status}
                hasLabelling={!!(
                  order.metadata?.labelling ||
                  order.type === 'labelling' ||
                  products.some((p: any) => p.labelling || p.labelling_available)
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: items + summary + actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Items ({products.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No items</p>
              ) : (
                products.map((p: any, i: number) => {
                  const lineTotal = Number(p.unit_price || 0) * Number(p.quantity || 0);
                  return (
                    <button
                      key={i}
                      onClick={() => p.product_id && navigate(`/dropshipping/catalog/${p.product_id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-muted/40 transition-all text-left group"
                    >
                      <img
                        src={productImages[p.product_id] || '/placeholder.svg'}
                        alt={p.name}
                        className="h-14 w-14 rounded-lg object-cover ring-1 ring-border shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.quantity} × SAR {Number(p.unit_price).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold aux-num">SAR {lineTotal.toFixed(2)}</p>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground inline-block mt-1 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="aux-num">SAR {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping & fees</span>
                <span className="aux-num">SAR {shipping.toFixed(2)}</span>
              </div>
              <div className="border-t border-border/60 my-2" />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="aux-num">SAR {Number(order.total).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {order.status === 'delivered' && (
              <>
                <Button variant="outline" size="sm" onClick={() => setReturnOpen(true)} disabled={hasReturn} className="rounded-full">
                  <Undo2 className="h-4 w-4 mr-1" />
                  {hasReturn ? 'Return submitted' : 'Request return'}
                </Button>
                <Button size="sm" onClick={reorder} className="rounded-full">
                  <RefreshCw className="h-4 w-4 mr-1" /> Re-order
                </Button>
              </>
            )}
            {order.status === 'cancelled' && (
              <Button size="sm" onClick={reorder} className="rounded-full">
                <RefreshCw className="h-4 w-4 mr-1" /> Re-order
              </Button>
            )}
            {order.status === 'pending' && (
              editable ? (
                <Button variant="outline" size="sm" onClick={cancelOrder} disabled={cancelling} className="rounded-full">
                  <XCircle className="h-4 w-4 mr-1" />
                  {cancelling ? 'Cancelling…' : `Cancel order (${remainingMins}m left)`}
                </Button>
              ) : editWindowHrs > 0 ? (
                <Badge variant="outline" className="text-xs gap-1">
                  <Clock className="h-3 w-3" /> Edit window expired ({editWindowHrs}h on {planName})
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  Cancel/edit not available — upgrade plan
                </Badge>
              )
            )}
          </div>
        </div>

        {/* RIGHT: delivery + info + messages */}
        <div className="space-y-6">
          {/* Delivery */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" /> Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Destination</p>
                  <p className="font-medium break-words">{order.destination || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Hash className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Tracking number</p>
                  {order.tracking_number ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs truncate">{order.tracking_number}</span>
                      <button
                        onClick={() => copyText(order.tracking_number, 'Tracking number')}
                        className="text-primary hover:scale-110 transition-transform shrink-0"
                        aria-label="Copy tracking"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">Not yet assigned</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Order info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Placed</span>
                <span>{placedAt.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span>{placedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">{order.type}</span>
              </div>
              {order.status === 'pending' && editWindowHrs > 0 && (
                <div className="mt-2 pt-2 border-t border-border/60">
                  <Badge variant="outline" className="text-[10px] gap-1 w-full justify-center py-1">
                    <Clock className="h-3 w-3" />
                    {editable ? `${remainingMins}m left to cancel` : 'Edit window expired'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" /> Messages
                {messages.length > 0 && (
                  <span className="aux-pill aux-pill-slate text-[10px]">{messages.length}</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-72 overflow-y-auto mb-3 pr-1">
                {messages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No messages yet. Send a message to the team.
                  </p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.is_admin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                      m.is_admin ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
                    }`}>
                      <p className="text-[10px] opacity-70 mb-1">
                        {m.is_admin ? 'Admin' : 'You'} · {new Date(m.created_at).toLocaleString()}
                      </p>
                      <p className="break-words">{m.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[50px] resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon" className="shrink-0 self-end h-10 w-10 rounded-full">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <RequestReturnDialog
        open={returnOpen}
        onOpenChange={setReturnOpen}
        orderId={order.id}
        orderTotal={Number(order.total) || 0}
        onSubmitted={() => setHasReturn(true)}
      />
    </div>
  );
};

export default CustomerOrderDetail;
