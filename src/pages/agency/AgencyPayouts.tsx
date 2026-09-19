import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAgency, sar, num } from '@/hooks/useAgency';
import { toast } from 'sonner';
import { Wallet } from 'lucide-react';

interface PayoutRow {
  id: string;
  amount_sar: number;
  status: string;
  reference: string | null;
  admin_note: string | null;
  created_at: string;
  paid_at: string | null;
}

const tone: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  paid: 'bg-blue-100 text-blue-800',
  declined: 'bg-rose-100 text-rose-800',
};

export default function AgencyPayoutsPage() {
  const { agency, reload } = useAgency();
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('agency_payout_requests')
      .select('id, amount_sar, status, reference, admin_note, created_at, paid_at')
      .order('created_at', { ascending: false });
    setRows((data as PayoutRow[]) || []);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const available = num(agency?.balance?.available);
  const min = num(agency?.min_payout);

  const request = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('agency_request_payout' as never, {
        _amount: amount ? Number(amount) : null,
        _note: note || null,
        _method: null,
      } as never);
      if (error) throw error;
      const res = data as { ok: boolean; error?: string; minimum?: number; available?: number; amount?: number };
      if (!res?.ok) {
        const messages: Record<string, string> = {
          below_minimum: `The minimum withdrawal is ${sar(res?.minimum ?? min)}.`,
          insufficient_balance: `You can withdraw up to ${sar(res?.available ?? available)}.`,
          nothing_to_pay: 'There are no unlocked earnings to withdraw yet.',
          not_an_agency: 'Your partner account is not active.',
        };
        toast.error(messages[res?.error || ''] || 'Could not create the request.');
        return;
      }
      toast.success(`Withdrawal of ${sar(res.amount)} requested.`);
      setAmount('');
      setNote('');
      await Promise.all([load(), reload()]);
    } catch (err: any) {
      toast.error(err?.message || 'Could not create the request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Payouts"
        highlight="Payouts"
        subtitle="Withdraw your unlocked earnings. Our finance team reviews each request and confirms once paid."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="space-y-4 p-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available now</div>
              <div className="mt-1 text-3xl font-black text-emerald-600">{sar(available)}</div>
              <p className="mt-1 text-xs text-muted-foreground">Minimum withdrawal {sar(min)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (leave blank for everything)</Label>
              <Input id="amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(available)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note for our finance team</Label>
              <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Bank details, IBAN or preferred transfer method" />
            </div>
            <Button className="w-full" onClick={request} disabled={submitting || available <= 0}>
              <Wallet className="mr-2 h-4 w-4" /> Request withdrawal
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <p className="p-12 text-center text-sm text-muted-foreground">No withdrawal requests yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right font-semibold">{sar(r.amount_sar)}</TableCell>
                      <TableCell><Badge variant="secondary" className={tone[r.status] || ''}>{r.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.reference || r.admin_note || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
