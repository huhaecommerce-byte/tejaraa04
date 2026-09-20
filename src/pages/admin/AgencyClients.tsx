import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from '@/lib/router-compat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { sar } from '@/hooks/useAgency';
import { ArrowLeft, Loader2, Receipt } from 'lucide-react';

interface ClientRow {
  client_user_id: string;
  display_name: string;
  email: string | null;
  joined_at: string;
  orders: number;
  earned: number;
}

const PAGE_SIZE = 20;

export default function AgencyClients() {
  const params = useParams();
  const id = (params as any).id as string;
  const [agencyName, setAgencyName] = useState('');
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: a }, { data: c }] = await Promise.all([
      supabase.from('agency_profiles').select('company_name').eq('id', id).maybeSingle(),
      supabase.rpc('admin_agency_clients' as never, { _agency_id: id } as never),
    ]);
    setAgencyName((a as any)?.company_name || '');
    setRows((c as unknown as ClientRow[]) || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const term = q.trim().toLowerCase();
  const filtered = term
    ? rows.filter((r) => `${r.display_name} ${r.email || ''}`.toLowerCase().includes(term))
    : rows;
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const slice = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Onboarded dropshippers"
        subtitle={agencyName ? `${agencyName} · ${total} linked seller${total === 1 ? '' : 's'}` : undefined}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/agency-admin/partners/${id}`}><ArrowLeft className="mr-2 h-4 w-4" /> Back to agency</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/agency-admin/partners/${id}/commissions`}><Receipt className="mr-2 h-4 w-4" /> Commission ledger</Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-4">
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder="Search by name or email"
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : slice.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No dropshippers onboarded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Commission earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slice.map((c) => (
                  <TableRow key={c.client_user_id}>
                    <TableCell>
                      <div className="font-medium">{c.display_name}</div>
                      <div className="text-xs text-muted-foreground">{c.email || '—'}</div>
                    </TableCell>
                    <TableCell>{new Date(c.joined_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{c.orders}</TableCell>
                    <TableCell className="text-right font-semibold">{sar(c.earned)}</TableCell>
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
