import { useEffect, useMemo, useState } from 'react';
import { Link } from "@/lib/router-compat";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { Search, Wallet, ExternalLink, Users } from 'lucide-react';
import { WalletAdjustDialog } from '@/components/admin/WalletAdjustDialog';

type Row = {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  orderCount: number;
  lifetime: number;
  walletBalance: number;
  tags: { tag: string; color: string }[];
};

const TAG_CLASS: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  sky: 'bg-sky-100 text-sky-700',
  violet: 'bg-violet-100 text-violet-700',
};

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

const CustomersAdmin = () => {
  const [customers, setCustomers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [walletOpen, setWalletOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<Row | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    const { data, error: rpcError } = await (supabase as any).rpc('admin_list_customers', {
      _search: debouncedSearch || null,
      _limit: pageSize,
      _offset: page * pageSize,
    });

    if (rpcError) {
      setError(rpcError.message);
      setCustomers([]);
      setLoading(false);
      return;
    }

    const rows: Row[] = (data || []).map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      display_name: r.display_name,
      email: r.email,
      avatar_url: r.avatar_url,
      created_at: r.created_at,
      orderCount: Number(r.order_count) || 0,
      lifetime: Number(r.lifetime) || 0,
      walletBalance: Number(r.wallet_balance) || 0,
      tags: Array.isArray(r.tags) ? r.tags : [],
    }));

    setTotal(Number((data || [])[0]?.total_count) || 0);
    setCustomers(rows);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [debouncedSearch, page, pageSize]);

  const filtered = customers;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min(total, page * pageSize + filtered.length);


  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer management"
        subtitle="Search buyers, see lifetime value, wallet and jump into a full account view."
      />

      {/* Filters */}
      <div className="aux-card aux-card-pad flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" className="pl-9" />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> {rangeStart}–{rangeEnd} of {total}
          </div>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Card><CardContent className="p-4 text-sm text-destructive">
          Could not load customers: {error}
          <Button size="sm" variant="outline" className="ml-3 h-7" onClick={fetchAll}>Retry</Button>
        </CardContent></Card>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (

        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.length === 0 && (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No customers match.</CardContent></Card>
            )}
            {filtered.map((c, i) => (
              <Card key={c.id} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${100 + i * 30}ms`, animationFillMode: 'forwards' }}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{c.display_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    </div>
                    
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{c.orderCount} orders · SAR {c.lifetime.toFixed(0)}</span>
                    <span>Wallet: SAR {c.walletBalance.toFixed(0)}</span>
                  </div>
                  {c.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {c.tags.map((t, idx) => (
                        <span key={idx} className={`px-1.5 py-0.5 rounded text-[10px] ${TAG_CLASS[t.color] || TAG_CLASS.slate}`}>{t.tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button asChild size="sm" variant="default" className="flex-1 h-8">
                      <Link to={`/admin/customers/${c.user_id}`}><ExternalLink className="h-3.5 w-3.5 mr-1" /> Open</Link>
                    </Button>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => { setActiveRow(c); setWalletOpen(true); }}>
                      <Wallet className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left p-3 font-medium">Customer</th>
                    
                    <th className="text-left p-3 font-medium">Orders</th>
                    <th className="text-left p-3 font-medium">Lifetime</th>
                    <th className="text-left p-3 font-medium">Wallet</th>
                    <th className="text-left p-3 font-medium">Tags</th>
                    <th className="text-left p-3 font-medium">Joined</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map((c, i) => (
                      <tr
                        key={c.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors opacity-0 animate-fade-in"
                        style={{ animationDelay: `${150 + i * 40}ms`, animationFillMode: 'forwards' }}
                      >
                        <td className="p-3">
                          <p className="font-medium">{c.display_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </td>
                        
                        <td className="p-3 tabular-nums">{c.orderCount}</td>
                        <td className="p-3 tabular-nums font-medium">SAR {c.lifetime.toFixed(0)}</td>
                        <td className="p-3 tabular-nums">SAR {c.walletBalance.toFixed(2)}</td>
                        <td className="p-3">
                          <div className="flex gap-1 flex-wrap max-w-[150px]">
                            {c.tags.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                            {c.tags.map((t, idx) => (
                              <span key={idx} className={`px-1.5 py-0.5 rounded text-[10px] ${TAG_CLASS[t.color] || TAG_CLASS.slate}`}>{t.tag}</span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                        <td className="p-3">
                          <div className="flex gap-1.5 justify-end">
                            <Button asChild size="sm" variant="outline" className="h-8">
                              <Link to={`/admin/customers/${c.user_id}`}>Open</Link>
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => { setActiveRow(c); setWalletOpen(true); }} title="Adjust wallet">
                              <Wallet className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No customers match the filters.</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">Showing {rangeStart}–{rangeEnd} of {total}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(0)}>First</Button>
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button>
              <span className="text-xs text-muted-foreground px-1">Page {page + 1} of {pageCount}</span>
              <Button size="sm" variant="outline" disabled={page + 1 >= pageCount} onClick={() => setPage((p) => p + 1)}>Next</Button>
              <Button size="sm" variant="outline" disabled={page + 1 >= pageCount} onClick={() => setPage(pageCount - 1)}>Last</Button>
            </div>
          </div>
        </>
      )}


      {activeRow && (
        <WalletAdjustDialog
          open={walletOpen}
          onOpenChange={(v) => { setWalletOpen(v); if (!v) setActiveRow(null); }}
          customerId={activeRow.user_id}
          customerName={activeRow.display_name || activeRow.email || 'Customer'}
          currentBalance={activeRow.walletBalance}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
};

export default CustomersAdmin;
