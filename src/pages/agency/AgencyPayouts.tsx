import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAgency, sar, num } from '@/hooks/useAgency';
import { toast } from 'sonner';
import { Wallet } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';

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
  const { t } = useLocale();
  const { agency, reload } = useAgency();
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [amount, setAmount] = useState('');
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
        _note: null,
        _method: null,
      } as never);
      if (error) throw error;
      const res = data as { ok: boolean; error?: string; minimum?: number; available?: number; amount?: number };
      if (!res?.ok) {
        const messages: Record<string, string> = {
          below_minimum: t('agency.payouts.errorBelowMinimum', { amount: sar(res?.minimum ?? min) }),
          insufficient_balance: t('agency.payouts.errorInsufficientBalance', { amount: sar(res?.available ?? available) }),
          nothing_to_pay: t('agency.payouts.errorNothingToPay'),
          not_an_agency: t('agency.payouts.errorNotAnAgency'),
        };
        toast.error(messages[res?.error || ''] || t('agency.payouts.errorGeneric'));
        return;
      }
      toast.success(t('agency.payouts.requestSuccess', { amount: sar(res.amount) }));
      setAmount('');
      await Promise.all([load(), reload()]);
    } catch (err: any) {
      toast.error(err?.message || t('agency.payouts.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t('agency.payouts.title')}
        highlight={t('agency.payouts.highlight')}
        subtitle={t('agency.payouts.subtitle')}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="space-y-4 p-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('agency.payouts.availableNow')}</div>
              <div className="mt-1 text-3xl font-black text-emerald-600">{sar(available)}</div>
              <p className="mt-1 text-xs text-muted-foreground">{t('agency.payouts.minimumWithdrawal', { amount: sar(min) })}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">{t('agency.payouts.amountLabel')}</Label>
              <Input id="amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(available)} />
            </div>
            <Button className="w-full" onClick={request} disabled={submitting || available <= 0}>
              <Wallet className="mr-2 h-4 w-4" /> {t('agency.payouts.requestButton')}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <p className="p-12 text-center text-sm text-muted-foreground">{t('agency.payouts.empty')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('agency.payouts.colRequested')}</TableHead>
                    <TableHead className="text-right">{t('agency.payouts.colAmount')}</TableHead>
                    <TableHead>{t('agency.payouts.colStatus')}</TableHead>
                    <TableHead>{t('agency.payouts.colReference')}</TableHead>
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
