import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin } from 'lucide-react';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/LoadingSkeleton';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { ShipmentTimeline } from '@/components/customer/ShipmentTimeline';

const Delivery = () => {
  const { user } = useAuth();
  const { limits, planName } = useCurrentPlan();
  const deliveryType = limits.delivery_service as string;
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from('orders').select('*').eq('user_id', user.id).in('status', ['shipped', 'processing']).order('created_at', { ascending: false });
      setShipments(data || []);
      setLoading(false);
    };
    fetch();
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active delivery"
        highlight="delivery"
        subtitle="Track your shipments and deliveries"
        guide={{
          chip: 'Tracking shipments',
          intro: 'Stay on top of every active delivery.',
          steps: [
            { title: 'Live status', description: 'See courier, ETA, and current shipment stage.' },
            { title: 'Notifications', description: 'Get alerted on every status change automatically.' },
            { title: 'History', description: 'Past deliveries stay archived for easy reference.' },
          ],
        }}
        actions={
          <Badge variant="secondary" className="text-xs">{planName} Plan — {deliveryType === 'express' ? '🚀 Express delivery available' : '📦 Standard delivery'}</Badge>
        }
      />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : shipments.length === 0 ? (
        <EmptyState icon={<Truck className="h-8 w-8 text-muted-foreground" />} title="No active shipments" description="Your active deliveries will appear here." />
      ) : (
        <div className="space-y-3">
          {shipments.map((o: any, i: number) => (
            <Card key={o.id} className="opacity-0 animate-fade-in-up hover:shadow-md hover:-translate-y-0.5 transition-all duration-300" style={{ animationDelay: `${150 + i * 100}ms`, animationFillMode: 'forwards' }}>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-accent animate-bounce-x" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{o.id.slice(0, 8)}</span>
                        <Badge variant="outline" className="capitalize">{o.type}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {o.destination}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${o.status === 'shipped' ? 'text-emerald-600 animate-pulse-soft' : 'text-blue-600'}`}>{o.status === 'shipped' ? 'In Transit' : 'Preparing'}</p>
                    {o.tracking_number && <p className="text-xs text-muted-foreground">Tracking: {o.tracking_number}</p>}
                  </div>
                </div>
                <ShipmentTimeline status={o.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Delivery;
