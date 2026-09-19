import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollText, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';

interface AuditEntry {
  id: string;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  diff: any;
  created_at: string;
}

const actionColor: Record<string, string> = {
  insert: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  update: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  delete: 'bg-red-500/15 text-red-700 dark:text-red-400',
};

export default function AuditLog() {
  const { user } = useAuth();
  const { numericLimit, isUnlimited } = useCurrentPlan();
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [selected, setSelected] = useState<AuditEntry | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const retentionDays = numericLimit('audit_log_days');
  const retentionUnlimited = isUnlimited('audit_log_days') || isAdmin;

  useEffect(() => {
    if (!user?.id) return;
    supabase.rpc('has_role', { _role: 'admin', _user_id: user.id })
      .then(({ data }) => setIsAdmin(!!data));
  }, [user?.id]);

  const load = async () => {
    setLoading(true);
    let q: any = supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (!retentionUnlimited && retentionDays > 0) {
      const cutoff = new Date(Date.now() - retentionDays * 86400_000).toISOString();
      q = q.gte('created_at', cutoff);
    }
    const { data } = await q;
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [retentionDays, retentionUnlimited]);

  const filtered = rows.filter(r => {
    if (entityFilter !== 'all' && r.entity_type !== entityFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.actor_email || '').toLowerCase().includes(q) ||
           r.summary.toLowerCase().includes(q) ||
           (r.entity_id || '').includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, entityFilter, pageSize]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        highlight="log"
        subtitle={
          retentionUnlimited
            ? 'Who changed what, and when'
            : `Showing the last ${retentionDays} days (plan retention limit)`
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-3">
            <Input placeholder="Search by email, summary, or ID..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="return">Returns</SelectItem>
                <SelectItem value="promo_code">Promo codes</SelectItem>
              </SelectContent>
            </Select>
            <CardTitle className="ml-auto text-sm font-normal text-muted-foreground self-center">
              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No entries found</TableCell></TableRow>
              ) : paginated.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{r.actor_email || <span className="text-muted-foreground italic">system</span>}</TableCell>
                  <TableCell><Badge variant="outline" className={actionColor[r.action]}>{r.action}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{r.entity_type}</Badge></TableCell>
                  <TableCell className="text-sm max-w-md truncate">{r.summary}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => setSelected(r)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!loading && filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows per page</span>
                <Select value={String(pageSize)} onValueChange={v => setPageSize(Number(v))}>
                  <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="ml-2">
                  {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={safePage === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <span className="text-sm text-muted-foreground">Page {safePage} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Audit entry details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Actor:</span> {selected.actor_email || 'system'}</div>
                <div><span className="text-muted-foreground">When:</span> {new Date(selected.created_at).toLocaleString()}</div>
                <div><span className="text-muted-foreground">Entity:</span> {selected.entity_type}</div>
                <div><span className="text-muted-foreground">Entity ID:</span> <code className="text-xs">{selected.entity_id}</code></div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Changes:</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-96">{JSON.stringify(selected.diff, null, 2)}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
