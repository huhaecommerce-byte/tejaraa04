import { useCallback, useEffect, useState } from 'react';
import { Link } from '@/lib/router-compat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { sar } from '@/hooks/useAgency';
import { toast } from 'sonner';
import { Handshake, Search } from 'lucide-react';

export interface AgencyRow {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  status: string;
  invite_code: string;
  commission_rate: number | null;
  created_at: string;
  clients: number;
  lifetime: number;
  pending: number;
  available: number;
}

const tone: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
  suspended: 'bg-slate-200 text-slate-700',
};

export default function AgenciesAdmin() {
  const [rows, setRows] = useState<AgencyRow[]>([]);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_list_agencies' as never, {
      _status: status === 'all' ? null : status,
      _search: search || null,
    } as never);
    if (error) toast.error(error.message);
    setRows((data as unknown as AgencyRow[]) || []);
    setLoading(false);
  }, [status, search]);

  useEffect(() => { void load(); }, [load]);

  const decide = async (id: string, next: string) => {
    const reason = next === 'rejected' ? window.prompt('Reason for rejection (sent to the applicant):') || '' : null;
    const { data, error } = await supabase.rpc('agency_admin_set_status' as never, {
      _agency_id: id, _status: next, _reason: reason, _rate: null,
    } as never);
    if (error || !(data as any)?.ok) {
      toast.error(error?.message || 'Could not update the agency.');
      return;
    }
    toast.success(`Agency ${next}`);
    void load();
  };

  return (
    <>
      <PageHeader
        title="Agencies & VAs"
        highlight="Agencies"
        subtitle="Review applications, set commission rates and track how much each partner has earned."
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Tabs value={status} onValueChange={setStatus}>
            <TabsList>
              {['pending', 'approved', 'rejected', 'suspended', 'all'].map((s) => (
                <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name, email, code" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <Handshake className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No agencies in this list.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agency</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Sellers</TableHead>
                    <TableHead className="text-right">Lifetime</TableHead>
                    <TableHead className="text-right">Owed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link to={`/admin/agencies/${r.id}`} className="font-medium hover:underline">{r.company_name}</Link>
                        <div className="text-xs text-muted-foreground">{r.contact_name} · {r.email}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.invite_code}</TableCell>
                      <TableCell className="text-right">{r.clients}</TableCell>
                      <TableCell className="text-right">{sar(r.lifetime)}</TableCell>
                      <TableCell className="text-right">{sar(r.available)}</TableCell>
                      <TableCell><Badge variant="secondary" className={tone[r.status] || ''}>{r.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {r.status !== 'approved' && (
                            <Button size="sm" onClick={() => decide(r.id, 'approved')}>Approve</Button>
                          )}
                          {r.status === 'pending' && (
                            <Button size="sm" variant="outline" onClick={() => decide(r.id, 'rejected')}>Reject</Button>
                          )}
                          {r.status === 'approved' && (
                            <Button size="sm" variant="outline" onClick={() => decide(r.id, 'suspended')}>Suspend</Button>
                          )}
                          <Button size="sm" variant="ghost" asChild>
                            <Link to={`/admin/agencies/${r.id}`}>Open</Link>
                          </Button>
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
