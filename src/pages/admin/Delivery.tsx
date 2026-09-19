import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/LoadingSkeleton';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { computeSla, slaBadgeClass } from '@/lib/sla';
import { flushEmailQueue } from '@/lib/flushEmails';

const statuses = ['processing', 'labelling', 'shipped', 'delivered'];

const DeliveryAdmin = () => {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingFee, setCheckingFee] = useState<string | null>(null);
  const [feeResults, setFeeResults] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from('orders').select('*').in('status', ['shipped', 'processing', 'labelling']).order('created_at', { ascending: false });
      setShipments(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    flushEmailQueue();
    toast({ title: 'Updated', description: `Shipment status changed to ${status}` });
    if (['delivered', 'cancelled'].includes(status)) {
      setShipments(prev => prev.filter(s => s.id !== id));
    } else {
      setShipments(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    }
  };

  const checkOtoFee = async (order: any) => {
    setCheckingFee(order.id);
    try {
      const { data, error } = await supabase.functions.invoke('tryoto-proxy', {
        body: {
          action: 'checkOTODeliveryFee',
          shipment: {
            destination_city: order.destination || 'Riyadh',
            weight: 1,
            cod_amount: order.total || 0,
          },
        },
      });
      if (error || !data?.success) {
        toast({ title: 'Error', description: data?.error || error?.message || 'Failed to check fee', variant: 'destructive' });
      } else {
        setFeeResults(prev => ({ ...prev, [order.id]: data.data }));
        toast({ title: 'Fee Retrieved', description: 'Delivery fee options loaded.' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setCheckingFee(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Delivery Management" subtitle="Active shipments and OTO delivery quotes" />
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : shipments.length === 0 ? (
        <EmptyState icon={<Truck className="h-8 w-8 text-muted-foreground" />} title="No active shipments" description="Active shipments will appear here." />
      ) : (
        <div className="space-y-3">
          {shipments.map((o: any, i: number) => (
            <Card key={o.id} className="opacity-0 animate-fade-in-up hover:shadow-md hover:-translate-y-0.5 transition-all duration-300" style={{ animationDelay: `${150 + i * 100}ms`, animationFillMode: 'forwards' }}>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-accent animate-bounce-x" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{o.id.slice(0, 8)}</span>
                        <Badge variant="outline" className="capitalize">{o.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{o.customer_name} → {o.destination}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge>{o.status}</Badge>
                    {(() => { const s = computeSla(o.created_at, o.status); return (
                      <Badge variant="outline" className={slaBadgeClass(s.tone)}>SLA: {s.label}</Badge>
                    ); })()}
                    <Select defaultValue={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                      <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      disabled={checkingFee === o.id}
                      onClick={() => checkOtoFee(o)}
                    >
                      {checkingFee === o.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />}
                      Check OTO Fee
                    </Button>
                  </div>
                </div>
                {feeResults[o.id] && (
                  <div className="bg-muted/40 rounded-lg p-3 text-xs space-y-1">
                    <p className="font-medium text-sm">TryOTO Delivery Options:</p>
                    {Array.isArray(feeResults[o.id]?.carriers) ? (
                      feeResults[o.id].carriers.map((c: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                          <span>{c.carrier_name || c.name || `Carrier ${idx + 1}`}</span>
                          <Badge variant="secondary">SAR {c.price || c.fee || '—'}</Badge>
                        </div>
                      ))
                    ) : (
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{JSON.stringify(feeResults[o.id], null, 2)}</pre>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryAdmin;
