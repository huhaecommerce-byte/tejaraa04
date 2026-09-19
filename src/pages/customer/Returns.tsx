import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { EmptyState } from '@/components/ui/LoadingSkeleton';
import { Undo2 } from 'lucide-react';
import { ReturnPhoto } from '@/components/customer/ReturnPhoto';

const statusTone: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  approved: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  refunded: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  rejected: 'bg-destructive/15 text-destructive',
};

const CustomerReturns = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('return_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setItems(data || []);
      setLoading(false);
    })();
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My returns"
        highlight="returns"
        subtitle="Your return requests and refund status"
        guide={{
          chip: 'How returns work',
          intro: 'Submit and track RMA requests in three steps.',
          steps: [
            { title: 'Eligible order', description: 'Pick a delivered order from your history to start.' },
            { title: 'Submit', description: 'Add the reason and photos so we can review quickly.' },
            { title: 'Track', description: 'Watch refund status update from pending to refunded.' },
          ],
        }}
      />
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={<Undo2 className="h-8 w-8 text-muted-foreground" />} title="No return requests yet" description="Open a delivered order and tap Request Return to start a refund." />
      ) : (
        <div className="space-y-3">
          {items.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">Order #{String(r.order_id).slice(0, 8)} · {r.reason}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                  </div>
                  <Badge className={statusTone[r.status] || ''}>{r.status}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Requested SAR {Number(r.refund_amount).toFixed(2)}</span>
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {r.photos?.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    {r.photos.slice(0, 4).map((p: string) => (
                      <ReturnPhoto key={p} value={p} className="h-12 w-12 rounded object-cover border" />
                    ))}
                  </div>
                )}
                {r.admin_notes && <p className="text-xs italic text-muted-foreground border-l-2 border-border pl-2">{r.admin_notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerReturns;
