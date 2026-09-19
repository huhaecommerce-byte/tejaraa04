import { useCallback, useEffect, useState } from 'react';
import { Link } from '@/lib/router-compat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { sar } from '@/hooks/useAgency';
import { toast } from 'sonner';
import { Wallet } from 'lucide-react';

interface Row {
  id: string;
  agency_id: string;
  amount_sar: number;
  status: string;
  note: string | null;
  admin_note: string | null;
  reference: string | null;
  created_at: string;
  agency_profiles?: { company_name: string; contact_name: string; email: string } | null;
}

const tone: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  paid: 'bg-blue-100 text-blue-800',
  declined: 'bg-rose-100 text-rose-800',
};

export default function AgencyPayoutsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('agency_payout_requests')
      .select('id, agency_id, amount_sar, status, note, admin_note, reference, created_at, agency_profiles(company_name, contact_name, email)')
      .order('created_at', { ascending: false });
    if (status !== 'all') q = q.eq('status', status);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows((data as unknown as Row[]) || []);
    setLoading(false);
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  const act = async (id: string, action: 'approve' | 'paid' | 'decline') => {
    const reference = action === 'paid' ? window.prompt('Transfer reference (optional):') : null;
    const adminNote = action === 'decline' ? window.prompt('Reason (optional):') : null;
    const { data, error } = await supabase.rpc('agency_admin_decide_payout' as never, {
      _id: id, _action: action, _reference: reference, _admin_note: adminNote,
    } as never);
    if (error || !(data as any)?.ok) { toast.error(error?.message || 'Could not update the payout.'); return; }
    toast.success('Payout updated');
    void load();
  };

  return (
    <>
      <PageHeader
        title="Agency payouts"
        highlight="payouts"
        subtitle="Approve withdrawal requests and mark them paid once the transfer has gone out."
      />

      <Card>
        <CardContent className="p-4">
          <Tabs value={status} onValueChange={setStatus}>
            <TabsList>
              {['pending', 'approved', 'paid', 'declined', 'all'].map((s) => (
                <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nothing here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agency</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link to={`/admin/agencies/${r.agency_id}`} className="font-medium hover:underline">
                          {r.agency_profiles?.company_name || 'Agency'}
                        </Link>
                        <div className="text-xs text-muted-foreground">{r.agency_profiles?.email}</div>
                      </TableCell>
                      <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right font-semibold">{sar(r.amount_sar)}</TableCell>
                      <TableCell className="max-w-[240px] text-xs text-muted-foreground">{r.note || r.admin_note || r.reference || '—'}</TableCell>
                      <TableCell><Badge variant="secondary" className={tone[r.status] || ''}>{r.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {r.status === 'pending' && <Button size="sm" onClick={() => act(r.id, 'approve')}>Approve</Button>}
                          {(r.status === 'pending' || r.status === 'approved') && (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => act(r.id, 'paid')}>Mark paid</Button>
                              <Button size="sm" variant="outline" onClick={() => act(r.id, 'decline')}>Decline</Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
