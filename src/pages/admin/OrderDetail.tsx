import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from "@/lib/router-compat";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Send, Package, MapPin, Truck, Calendar, MessageSquare, Save } from 'lucide-react';
import { triggerAdminPendingCountsRefresh } from '@/hooks/useAdminPendingCounts';
import { flushEmailQueue } from '@/lib/flushEmails';

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', processing: 'bg-blue-100 text-blue-800',
  labelling: 'bg-purple-100 text-purple-800', shipped: 'bg-green-100 text-green-800',
  delivered: 'bg-green-200 text-green-900', cancelled: 'bg-red-100 text-red-800',
};
const statuses = ['pending', 'processing', 'labelling', 'shipped', 'delivered', 'cancelled'];

const AdminOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [trackingEdit, setTrackingEdit] = useState('');
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const [orderRes, msgRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', id).single(),
        supabase.from('order_messages').select('*').eq('order_id', id).order('created_at', { ascending: true }),
      ]);
      setOrder(orderRes.data);
      setTrackingEdit(orderRes.data?.tracking_number || '');
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
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateStatus = async (status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id!);
    if (error) { toast.error(error.message); return; }
    flushEmailQueue();
    triggerAdminPendingCountsRefresh();
    toast.success(`Status changed to ${status}`);
    setOrder((prev: any) => ({ ...prev, status }));
  };

  const saveTracking = async () => {
    const { error } = await supabase.from('orders').update({ tracking_number: trackingEdit }).eq('id', id!);
    if (error) { toast.error(error.message); return; }
    flushEmailQueue();
    toast.success('Tracking number saved');
    setOrder((prev: any) => ({ ...prev, tracking_number: trackingEdit }));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !id) return;
    setSending(true);
    const { data, error } = await supabase.from('order_messages').insert({
      order_id: id, user_id: user.id, message: newMessage.trim(), is_admin: true,
    }).select().single();
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setMessages(prev => [...prev, data]);
    setNewMessage('');
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>;
  if (!order) return <div className="text-center py-12 text-muted-foreground">Order not found.</div>;

  const products = Array.isArray(order.products) ? order.products : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/orders')} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
      </Button>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
            <Select defaultValue={order.status} onValueChange={updateStatus}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2"><Package className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground text-xs">Type</p><p className="font-medium capitalize">{order.type}</p></div></div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground text-xs">Destination</p><p className="font-medium">{order.destination || '—'}</p></div></div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground text-xs">Date</p><p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p></div></div>
            <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground text-xs">Customer</p><p className="font-medium">{order.customer_name || '—'}</p></div></div>
          </div>

          <div className="flex items-center gap-2">
            <Input className="h-8 text-sm max-w-[200px]" placeholder="Tracking number" value={trackingEdit} onChange={e => setTrackingEdit(e.target.value)} />
            <Button size="sm" variant="outline" onClick={saveTracking}><Save className="h-3 w-3 mr-1" /> Save</Button>
          </div>

          {products.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/50 text-muted-foreground"><th className="text-left p-3">Image</th><th className="text-left p-3">Product</th><th className="text-right p-3">Qty</th><th className="text-right p-3">Price</th></tr></thead>
                <tbody>
                  {products.map((p: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="p-3"><img src={productImages[p.product_id] || '/placeholder.svg'} alt={p.name} className="h-10 w-10 rounded object-cover" /></td>
                      <td className="p-3">{p.name}</td><td className="p-3 text-right">{p.quantity}</td><td className="p-3 text-right">SAR {Number(p.unit_price * p.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="text-right text-lg font-bold">Total: SAR {Number(order.total).toFixed(2)}</div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-80 overflow-y-auto mb-4 pr-1">
            {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No messages yet.</p>}
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.is_admin ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                  <p className="text-xs opacity-70 mb-1">{m.is_admin ? 'You (Admin)' : 'Customer'} · {new Date(m.created_at).toLocaleString()}</p>
                  <p>{m.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2">
            <Textarea placeholder="Reply to customer..." value={newMessage} onChange={e => setNewMessage(e.target.value)} className="min-h-[60px] resize-none" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
            <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon" className="shrink-0 self-end h-10 w-10">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrderDetail;
