import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from '@/lib/router-compat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { sar, num } from '@/hooks/useAgency';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, Receipt, Users } from 'lucide-react';

interface Agency {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  website: string | null;
  audience: string | null;
  status: string;
  invite_code: string;
  commission_rate: number | null;
  payout_method: string | null;
  payout_details: Record<string, any> | null;
  created_at: string;
}


interface Balance {
  lifetime: number; pending: number; available: number; requested: number; paid: number; clients: number; orders: number;
}

interface CommissionRow {
  id: string;
  order_ref: string | null;
  order_total_sar: number | null;
  rate_percent: number | null;
  amount_sar: number;
  status: string;
  reversal_reason: string | null;
  created_at: string;
}


export default function AgencyDetail() {
  const params = useParams();
  const id = (params as any).id as string;
  const [agency, setAgency] = useState<Agency | null>(null);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [rate, setRate] = useState('');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [{ data: a }, { data: b }, { data: cm }] = await Promise.all([
      supabase.from('agency_profiles').select('*').eq('id', id).maybeSingle(),
      supabase.rpc('agency_balance' as never, { _agency_id: id } as never),
      supabase.rpc('admin_agency_commissions' as never, { _agency_id: id } as never),
    ]);
    setAgency((a as Agency) || null);
    setBalance((b as unknown as Balance) || null);
    setCommissions((cm as unknown as CommissionRow[]) || []);
    setRate(a && (a as any).commission_rate != null ? String((a as any).commission_rate) : '');
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const setStatus = async (status: string) => {
    const reason = status === 'rejected' ? window.prompt('Reason (sent to the applicant):') || '' : null;
    setBusy(true);
    const { data, error } = await supabase.rpc('agency_admin_set_status' as never, {
      _agency_id: id, _status: status, _reason: reason, _rate: rate === '' ? null : Number(rate),
    } as never);
    setBusy(false);
    if (error || !(data as any)?.ok) { toast.error(error?.message || 'Update failed'); return; }
    toast.success('Updated');
    void load();
  };

  const saveRate = async () => {
    if (!agency) return;
    setBusy(true);
    const { error } = await supabase.rpc('agency_admin_set_status' as never, {
      _agency_id: id, _status: agency.status, _reason: null, _rate: rate === '' ? null : Number(rate),
    } as never);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success('Commission rate saved'); void load(); }
  };

  const addAdjustment = async () => {
    if (!adjAmount || !adjReason) { toast.error('Enter an amount and a reason.'); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc('agency_admin_adjust' as never, {
      _agency_id: id, _amount: Number(adjAmount), _reason: adjReason,
    } as never);
    setBusy(false);
    if (error || !(data as any)?.ok) { toast.error(error?.message || 'Could not add the adjustment'); return; }
    toast.success('Adjustment added');
    setAdjAmount(''); setAdjReason('');
    void load();
  };

  if (!agency) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <>
      <PageHeader
        title={agency.company_name}
        subtitle={`${agency.contact_name} · ${agency.email} · code ${agency.invite_code}`}
        actions={
          <Button variant="outline" asChild>
            <Link to="/agency-admin/partners"><ArrowLeft className="mr-2 h-4 w-4" /> All agencies</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Lifetime earned', sar(balance?.lifetime)],
          ['Pending', sar(balance?.pending)],
          ['Owed now', sar(balance?.available)],
          ['Paid out', sar(balance?.paid)],
        ].map(([k, v]) => (
          <Card key={k}><CardContent className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{k}</div>
            <div className="mt-1 text-2xl font-black">{v}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</div>
            <Badge variant="secondary" className="mt-1 capitalize">{agency.status}</Badge>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">Commission rate (% of profit)</Label>
            <Input id="rate" className="w-40" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Platform default" />
          </div>
          <Button variant="outline" onClick={saveRate} disabled={busy}>Save rate</Button>
          <div className="ml-auto flex gap-2">
            {agency.status !== 'approved' && <Button onClick={() => setStatus('approved')} disabled={busy}>Approve</Button>}
            {agency.status === 'pending' && <Button variant="outline" onClick={() => setStatus('rejected')} disabled={busy}>Reject</Button>}
            {agency.status === 'approved' && <Button variant="outline" onClick={() => setStatus('suspended')} disabled={busy}>Suspend</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 p-6 md:grid-cols-2">
          <div>
            <h2 className="mb-3 font-bold">Application details</h2>
            <dl className="space-y-2 text-sm">
              {[
                ['Phone', agency.phone],
                ['Country', agency.country],
                ['Website', agency.website],
                ['Applied', new Date(agency.created_at).toLocaleDateString()],
                ['Payout method', agency.payout_method],
                ['IBAN', agency.payout_details?.iban],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-4 border-b pb-1">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right">{(v as string) || '—'}</dd>
                </div>
              ))}
            </dl>
            {agency.audience && <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm">{agency.audience}</p>}
          </div>
          <div>
            <h2 className="mb-3 font-bold">Manual adjustment</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Use a positive amount for a bonus, a negative amount for a clawback.
            </p>
            <div className="space-y-3">
              <Input type="number" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} placeholder="Amount in SAR" />
              <Input value={adjReason} onChange={(e) => setAdjReason(e.target.value)} placeholder="Reason" />
              <Button variant="outline" onClick={addAdjustment} disabled={busy}>Add adjustment</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <div>
              <div className="flex items-center gap-2 font-bold"><Users className="h-4 w-4" /> Onboarded dropshippers</div>
              <p className="mt-1 text-2xl font-black">{num(balance?.clients)}</p>
              <p className="text-xs text-muted-foreground">Sellers linked with this invite code</p>
            </div>
            <Button asChild>
              <Link to={`/agency-admin/partners/${id}/clients`}>View <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <div>
              <div className="flex items-center gap-2 font-bold"><Receipt className="h-4 w-4" /> Commission ledger</div>
              <p className="mt-1 text-2xl font-black">{commissions.length}</p>
              <p className="text-xs text-muted-foreground">Entries across all orders</p>
            </div>
            <Button asChild>
              <Link to={`/agency-admin/partners/${id}/commissions`}>View <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
