import { useEffect, useMemo, useState } from 'react';
import { Link } from "@/lib/router-compat";
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, ArrowRight, MessageCircle, RefreshCw, Search } from 'lucide-react';

type LogRow = {
  id: string;
  created_at: string;
  direction: string;
  ticket_id: string | null;
  user_id: string | null;
  customer_name: string;
  to_number: string;
  from_number: string | null;
  body: string;
  wa_msg_id: string | null;
  status: string;
  error: string | null;
};

const PAGE_SIZE = 50;

const directionLabel = (d: string) => {
  switch (d) {
    case 'outbound_admin': return 'To Admin';
    case 'outbound_buyer': return 'To Buyer';
    case 'inbound_admin': return 'From Admin';
    case 'test': return 'Test';
    default: return d;
  }
};

const directionVariant = (d: string): 'default' | 'secondary' | 'outline' => {
  if (d === 'inbound_admin') return 'default';
  if (d === 'test') return 'outline';
  return 'secondary';
};

const statusVariant = (s: string): 'default' | 'destructive' | 'secondary' => {
  if (s === 'failed') return 'destructive';
  if (s === 'received') return 'default';
  return 'secondary';
};

const WhatsappLogs = () => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [direction, setDirection] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('whatsapp_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (direction !== 'all') q = q.eq('direction', direction);
    if (search.trim()) {
      const s = search.trim();
      q = q.or(`customer_name.ilike.%${s}%,body.ilike.%${s}%,ticket_id.ilike.%${s}%`);
    }

    const { data, count, error } = await q;
    if (!error) {
      setRows((data || []) as LogRow[]);
      setTotal(count || 0);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, direction, search]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" /> WhatsApp Message Logs
          </CardTitle>
          <CardDescription>
            Every WhatsApp message sent or received via the Wahooks integration. Use this to audit the flow between buyers, admins, and the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Select value={direction} onValueChange={(v) => { setPage(0); setDirection(v); }}>
              <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All directions</SelectItem>
                <SelectItem value="outbound_admin">Outbound → Admin</SelectItem>
                <SelectItem value="outbound_buyer">Outbound → Buyer</SelectItem>
                <SelectItem value="inbound_admin">Inbound from Admin</SelectItem>
                <SelectItem value="test">Test messages</SelectItem>
              </SelectContent>
            </Select>
            <form
              className="flex gap-2 flex-1"
              onSubmit={(e) => { e.preventDefault(); setPage(0); setSearch(searchInput); }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search by customer, ticket id, or message body…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary">Search</Button>
              <Button type="button" variant="outline" size="icon" onClick={load} title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </form>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">When</TableHead>
                  <TableHead className="w-32">Direction</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="w-24">Ticket</TableHead>
                  <TableHead className="w-40">To / From</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-6 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No messages logged yet.</TableCell></TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={directionVariant(r.direction)}>{directionLabel(r.direction)}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{r.customer_name || '—'}</TableCell>
                      <TableCell>
                        {r.ticket_id ? (
                          <Link to="/admin/tickets" className="text-primary hover:underline text-xs font-mono">
                            #{r.ticket_id.slice(0, 8).toUpperCase()}
                          </Link>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {r.direction === 'inbound_admin' ? (r.from_number || '—') : (r.to_number || '—')}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="text-sm line-clamp-2 whitespace-pre-wrap" title={r.body}>{r.body}</div>
                        {r.error && <div className="text-xs text-destructive mt-1">{r.error}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {total > 0 ? `${page * PAGE_SIZE + 1}–${Math.min(total, (page + 1) * PAGE_SIZE)} of ${total}` : '0 results'}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <span className="text-xs text-muted-foreground">Page {page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsappLogs;
