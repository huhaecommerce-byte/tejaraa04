import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from '@/lib/router-compat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { sar } from '@/hooks/useAgency';
import { ArrowLeft, Loader2, Users } from 'lucide-react';

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

const commissionTone: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  available: 'bg-emerald-100 text-emerald-800',
  paid: 'bg-blue-100 text-blue-800',
  reversed: 'bg-rose-100 text-rose-800',
};

const PAGE_SIZE = 20;

export default function AgencyCommissions() {
  const params = useParams();
  const id = (params as any).id as string;
  const [agencyName, setAgencyName] = useState('');
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: a }, { data: cm }] = await Promise.all([
      supabase.from('agency_profiles').select('company_name').eq('id', id).maybeSingle(),
      supabase.rpc('admin_agency_commissions' as never, { _agency_id: id } as never),
    ]);
    setAgencyName((a as any)?.company_name || '');
    setRows((cm as unknown as CommissionRow[]) || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const filtered = status === 'all' ? rows : rows.filter((r) => r.status === status);
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const slice = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);
  const sum = filtered.reduce((acc, r) => acc + Number(r.amount_sar || 0), 0);

  return (
    <>
      <PageHeader
        title="Commission ledger"
        subtitle={agencyName ? `${agencyName} · ${total} entr${total === 1 ? 'y' : 'ies'} · ${sar(sum)}` : undefined}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/agency-admin/partners/${id}`}><ArrowLeft className="mr-2 h-4 w-4" /> Back to agency</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/agency-admin/partners/${id}/clients`}><Users className="mr-2 h-4 w-4" /> Onboarded dropshippers</Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-4">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="reversed">Reversed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : slice.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No commission entries yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Order total</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slice.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.order_ref || '—'}</TableCell>
                    <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={commissionTone[c.status] || ''}>{c.status}</Badge>
                      {c.reversal_reason && (
                        <div className="mt-1 text-xs text-muted-foreground">{c.reversal_reason}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{c.order_total_sar != null ? sar(c.order_total_sar) : '—'}</TableCell>
                    <TableCell className="text-right">{c.rate_percent != null ? `${c.rate_percent}%` : '—'}</TableCell>
                    <TableCell className="text-right font-semibold">{sar(c.amount_sar)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {current * PAGE_SIZE + 1}–{Math.min(total, current * PAGE_SIZE + PAGE_SIZE)} of {total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next</Button>
          </div>
        </div>
      )}
    </>
  );
}
