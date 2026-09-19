import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { EmptyState } from '@/components/ui/LoadingSkeleton';
import { Undo2, Check, X, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReturnPhoto } from '@/components/customer/ReturnPhoto';

const tone: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  approved: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  refunded: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  rejected: 'bg-destructive/15 text-destructive',
};

const Returns = () => {
  const [items, setItems] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('return_requests').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    const userIds = Array.from(new Set((data || []).map(r => r.user_id)));
    if (userIds.length) {
      const { data: profs } = await supabase.from('profiles').select('user_id, display_name, email').in('user_id', userIds);
      const map: Record<string, any> = {};
      profs?.forEach(p => { map[p.user_id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const decide = async (id: string, status: 'approved' | 'rejected', refund_amount: number, admin_notes: string) => {
    setBusy(id);
    const { error } = await supabase.from('return_requests').update({ status, refund_amount, admin_notes }).eq('id', id);
    setBusy(null);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: status === 'approved' ? 'Return approved & refunded' : 'Return rejected' });
    load();
  };

  const visible = items.filter(r => filter === 'all' || r.status === 'pending');

  return (
    <div className="space-y-6">
      <PageHeader title="Returns / RMA Inbox" subtitle="Review return requests and issue refunds" />
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({items.filter(r => r.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
      ) : visible.length === 0 ? (
        <EmptyState icon={<Undo2 className="h-8 w-8 text-muted-foreground" />} title="No return requests" description="When buyers request returns they will appear here." />
      ) : (
        <div className="space-y-3">
          {visible.map(r => (
            <ReturnCard key={r.id} r={r} profile={profiles[r.user_id]} busy={busy === r.id} onDecide={decide} />
          ))}
        </div>
      )}
    </div>
  );
};

function ReturnCard({ r, profile, busy, onDecide }: any) {
  const [refund, setRefund] = useState(Number(r.refund_amount) || 0);
  const [notes, setNotes] = useState(r.admin_notes || '');
  const isPending = r.status === 'pending';

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="font-semibold text-sm">
              Order #{String(r.order_id).slice(0, 8)} · {r.reason}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile?.display_name || profile?.email || 'Buyer'} · {new Date(r.created_at).toLocaleString()}
            </p>
          </div>
          <Badge className={tone[r.status] || ''}>{r.status}</Badge>
        </div>

        <p className="text-sm">{r.description}</p>

        {r.photos?.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {r.photos.map((p: string) => (
              <ReturnPhoto key={p} value={p} linkable className="h-20 w-20 rounded object-cover border hover:opacity-80" />
            ))}
          </div>
        )}

        {isPending ? (
          <div className="grid sm:grid-cols-[160px_1fr_auto] gap-2 items-end pt-2 border-t">
            <div>
              <label className="text-xs text-muted-foreground">Refund (SAR)</label>
              <Input type="number" value={refund} onChange={e => setRefund(Number(e.target.value))} className="h-9" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Admin notes (sent to buyer)</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={1} className="resize-none" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={busy} onClick={() => onDecide(r.id, 'rejected', 0, notes)}>
                <X className="h-4 w-4 mr-1" /> Reject
              </Button>
              <Button size="sm" disabled={busy || refund <= 0} onClick={() => onDecide(r.id, 'approved', refund, notes)}>
                {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                Approve & Refund
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground border-t pt-2">
            Refund: SAR {Number(r.refund_amount).toFixed(2)} {r.admin_notes && <> · {r.admin_notes}</>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default Returns;
