import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from "@/lib/router-compat";
import { useServerFn } from '@tanstack/react-start';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  getCustomerAccountState, setCustomerSuspended, deleteCustomerAccount,
} from '@/lib/adminCustomers.functions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Wallet, ShoppingCart, Tag as TagIcon, X, Plus,
  MessageSquare, Trash2, Pencil, MapPin, Users, Package,
  Truck, FileText, Activity, RotateCw, ClipboardList, Bell, Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { WalletAdjustDialog } from '@/components/admin/WalletAdjustDialog';
import { SendNotificationDialog } from '@/components/admin/customer/SendNotificationDialog';
import { EditAddressDialog, AdminAddress } from '@/components/admin/customer/EditAddressDialog';
import { AdjustInventoryDialog } from '@/components/admin/warehouse/AdjustInventoryDialog';
import { StaffAccessCard } from '@/components/admin/customer/StaffAccessCard';

import { HeroCard } from './customer-detail/HeroCard';
import { KpiRail } from './customer-detail/KpiRail';
import { ActivityTimeline } from './customer-detail/ActivityTimeline';
import { HealthSnapshot } from './customer-detail/HealthSnapshot';
import { TopProducts, PreferredDestinations } from './customer-detail/TopProducts';
import { CommDrawer } from './customer-detail/CommDrawer';
import { deriveSegments, computeRisk } from './customer-detail/segments';
import { flushEmailQueue } from '@/lib/flushEmails';

const TAG_COLORS = ['slate', 'emerald', 'amber', 'rose', 'sky', 'violet'];
const TAG_CLASS: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  sky: 'bg-sky-100 text-sky-700',
  violet: 'bg-violet-100 text-violet-700',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-sky-100 text-sky-700',
  confirmed: 'bg-sky-100 text-sky-700',
  shipped: 'bg-violet-100 text-violet-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
  rejected: 'bg-rose-100 text-rose-700',
  refunded: 'bg-emerald-100 text-emerald-700',
  approved: 'bg-emerald-100 text-emerald-700',
  active: 'bg-emerald-100 text-emerald-700',
  paid: 'bg-emerald-100 text-emerald-700',
  open: 'bg-amber-100 text-amber-700',
  revoked: 'bg-rose-100 text-rose-700',
  accepted: 'bg-emerald-100 text-emerald-700',
};

const StatusPill = ({ status }: { status: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_CLASS[status?.toLowerCase()] || 'bg-slate-100 text-slate-700'}`}>{status}</span>
);

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [sourcing, setSourcing] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [labelling, setLabelling] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [teamOwned, setTeamOwned] = useState<any[]>([]);
  const [teamMember, setTeamMember] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const highlightTxId = searchParams.get('tx');
  const walletHighlightRef = useRef<HTMLTableRowElement | null>(null);
  useEffect(() => {
    if (!highlightTxId || loading) return;
    const t = setTimeout(() => {
      walletHighlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
    return () => clearTimeout(t);
  }, [highlightTxId, loading, wallet.length]);

  const [walletOpen, setWalletOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AdminAddress | null>(null);
  const [invOpen, setInvOpen] = useState(false);
  const [invItem, setInvItem] = useState<any>(null);

  const [newTag, setNewTag] = useState('');
  const [newTagColor, setNewTagColor] = useState('slate');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  const navigate = useNavigate();
  const getAccountStateFn = useServerFn(getCustomerAccountState);
  const setSuspendedFn = useServerFn(setCustomerSuspended);
  const deleteAccountFn = useServerFn(deleteCustomerAccount);
  const [suspended, setSuspended] = useState(false);
  const [suspendBusy, setSuspendBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    const uid = profile?.user_id;
    if (!uid) return;
    let cancelled = false;
    getAccountStateFn({ data: { userId: uid } })
      .then((res: any) => { if (!cancelled) setSuspended(!!res?.suspended); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [profile?.user_id]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [
      p, o, t, w, tg, n,
      inv, rel, src, qt, lab, ret, addr, tOwn, tMem, inv2, notifs,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', id).maybeSingle(),
      supabase.from('orders').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('tickets').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('wallet_transactions').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('customer_tags').select('*').eq('customer_id', id).order('created_at'),
      supabase.from('customer_notes').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
      supabase.from('warehouse_inventory').select('*').eq('user_id', id).order('last_movement_at', { ascending: false }),
      supabase.from('release_requests').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('sourcing_requests').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('quote_requests').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('labelling_requests').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('return_requests').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('shipping_addresses').select('*').eq('user_id', id).order('is_default', { ascending: false }),
      supabase.from('team_members').select('*').eq('owner_id', id).order('created_at', { ascending: false }),
      supabase.from('team_members').select('*').eq('member_user_id', id).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(30),
    ]);

    setProfile(p.data); setOrders(o.data || []); setTickets(t.data || []);
    setWallet(w.data || []); setTags(tg.data || []); setNotes(n.data || []);
    
    setInventory(inv.data || []); setReleases(rel.data || []);
    setSourcing(src.data || []); setQuotes(qt.data || []);
    setLabelling(lab.data || []); setReturns(ret.data || []);
    setAddresses(addr.data || []);
    setTeamOwned(tOwn.data || []); setTeamMember(tMem.data || []);
    setInvoices(inv2.data || []);
    setNotifications(notifs.data || []);

    const orderIds = (o.data || []).map((x: any) => x.id);
    const retIds = (ret.data || []).map((x: any) => x.id);
    const allIds = [...orderIds, ...retIds];
    if (allIds.length > 0) {
      const { data: aud } = await supabase.from('audit_log').select('*')
        .or(`actor_id.eq.${id},entity_id.in.(${allIds.join(',')})`)
        .order('created_at', { ascending: false }).limit(50);
      setAuditEvents(aud || []);
    } else {
      const { data: aud } = await supabase.from('audit_log').select('*').eq('actor_id', id).order('created_at', { ascending: false }).limit(50);
      setAuditEvents(aud || []);
    }

    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const stats = useMemo(() => {
    const lifetime = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const balance = wallet[0]?.balance_after !== undefined ? Number(wallet[0].balance_after) : 0;
    const openTickets = tickets.filter((t) => !['resolved', 'closed'].includes((t.status || '').toLowerCase())).length;
    const pendingReturns = returns.filter(r => r.status === 'pending').length;
    const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
    return { lifetime, balance, openTickets, pendingReturns, overdueInvoices };
  }, [orders, wallet, tickets, returns, invoices]);




  const segments = useMemo(() => profile ? deriveSegments({
    orders, tickets, returns, joinedAt: profile.created_at,
  }) : [], [orders, tickets, returns, profile]);

  const risk = useMemo(() => computeRisk({
    openTickets: stats.openTickets,
    pendingReturns: stats.pendingReturns,
    walletBalance: stats.balance,
    overdueInvoices: stats.overdueInvoices,
  }), [stats]);

  // ---------- actions ----------
  const renameCustomer = async (name: string) => {
    if (!name.trim() || !id) return;
    const { error } = await supabase.from('profiles').update({ display_name: name.trim() }).eq('user_id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Name updated');
    load();
  };




  const addTag = async () => {
    if (!id || !newTag.trim()) return;
    const { error } = await supabase.from('customer_tags').insert({ customer_id: id, tag: newTag.trim(), color: newTagColor });
    if (error) { toast.error(error.message); return; }
    setNewTag(''); load();
  };
  const removeTag = async (tagId: string) => {
    const { error } = await supabase.from('customer_tags').delete().eq('id', tagId);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) { toast.error(error.message); return; }
    flushEmailQueue();
    toast.success('Order status updated');
    load();
  };

  const deleteAddress = async (aid: string) => {
    if (!confirm('Delete this address?')) return;
    const { error } = await supabase.from('shipping_addresses').delete().eq('id', aid);
    if (error) { toast.error(error.message); return; }
    toast.success('Address deleted');
    load();
  };

  const updateTeamRole = async (memberId: string, member_role: 'viewer' | 'buyer') => {
    const { error } = await supabase.from('team_members').update({ member_role }).eq('id', memberId);
    if (error) { toast.error(error.message); return; }
    toast.success('Role updated');
    load();
  };
  const revokeTeamMember = async (memberId: string) => {
    if (!confirm('Revoke this team member?')) return;
    const { error } = await supabase.from('team_members').update({ status: 'revoked' }).eq('id', memberId);
    if (error) { toast.error(error.message); return; }
    toast.success('Member revoked');
    load();
  };

  const updateInvoiceStatus = async (invId: string, status: string) => {
    const { error } = await supabase.from('invoices').update({ status }).eq('id', invId);
    if (error) { toast.error(error.message); return; }
    toast.success('Invoice updated');
    load();
  };

  const exportCsv = () => {
    if (!profile) return;
    const rows = [
      ['Type', 'ID', 'Date', 'Status', 'Amount', 'Detail'],
      ...orders.map(o => ['order', o.id, o.created_at, o.status, o.total, o.type]),
      ...wallet.map(w => ['wallet', w.id, w.created_at, w.type, w.amount, w.description || '']),
      ...tickets.map(t => ['ticket', t.id, t.created_at, t.status, '', t.subject]),
      ...returns.map(r => ['return', r.id, r.created_at, r.status, r.refund_amount, r.reason]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `customer-${profile.user_id?.slice(0, 8)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Customer data exported');
  };

  const deleteCustomer = () => {
    setDeleteConfirm('');
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!profile?.user_id) return;
    setDeleteBusy(true);
    try {
      await deleteAccountFn({ data: { userId: profile.user_id, confirmEmail: deleteConfirm } });
      toast.success('Customer account deleted');
      setDeleteOpen(false);
      navigate('/admin/customers');
    } catch (e: any) {
      toast.error(e?.message || 'Could not delete customer');
    } finally {
      setDeleteBusy(false);
    }
  };

  const toggleSuspend = async (next: boolean) => {
    if (!profile?.user_id) return;
    setSuspendBusy(true);
    try {
      await setSuspendedFn({ data: { userId: profile.user_id, suspended: next } });
      setSuspended(next);
      toast.success(next ? 'Account suspended — the customer can no longer sign in' : 'Account restored');
    } catch (e: any) {
      toast.error(e?.message || 'Could not update account status');
    } finally {
      setSuspendBusy(false);
    }
  };

  // ---------- filters ----------
  const term = searchTerm.toLowerCase();
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
      if (!term) return true;
      return o.id.toLowerCase().includes(term) || (o.type || '').toLowerCase().includes(term) || String(o.total).includes(term);
    });
  }, [orders, orderStatusFilter, term]);

  // ---------- render ----------
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="space-y-4">
        <Link to="/admin/customers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to customers</Link>
        <Card><CardContent className="p-12 text-center text-muted-foreground">Customer not found</CardContent></Card>
      </div>
    );
  }

  const customerName = profile.display_name || profile.email || 'Customer';
  const tabSignal = (n: number, danger = false) => n > 0 && (
    <span className={`ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-4 px-1 rounded-full text-[9px] font-semibold ${danger ? 'bg-rose-500 text-white' : 'bg-muted text-muted-foreground'}`}>{n}</span>
  );

  return (
    <div className="space-y-5">
      <Link to="/admin/customers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to customers</Link>

      <HeroCard
        profile={profile}
        segments={segments}
        risk={risk}
        tags={tags}
        emailVerified={!!profile.email}
        suspended={suspended}
        suspendBusy={suspendBusy}
        onToggleSuspend={toggleSuspend}
        onRename={renameCustomer}
        onAdjustWallet={() => setWalletOpen(true)}
        onSendNotification={() => setNotifOpen(true)}
        onExportCsv={exportCsv}
        onDeleteCustomer={deleteCustomer}
      />

      <KpiRail orders={orders} wallet={wallet} inventory={inventory} tickets={tickets} />

      <StaffAccessCard customerId={id!} customerName={customerName} />

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="sticky top-0 z-20 bg-background/85 backdrop-blur-sm -mx-2 px-2 py-2 border-b border-border/40">
          <div className="flex flex-wrap items-center gap-2">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="overview"><Activity className="h-3.5 w-3.5" /> Overview</TabsTrigger>
              <TabsTrigger value="orders"><ShoppingCart className="h-3.5 w-3.5" /> Orders {tabSignal(orders.length)}</TabsTrigger>
              <TabsTrigger value="warehouse"><Package className="h-3.5 w-3.5" /> Warehouse {tabSignal(inventory.length)}</TabsTrigger>
              <TabsTrigger value="sourcing"><ClipboardList className="h-3.5 w-3.5" /> Sourcing {tabSignal(sourcing.length + quotes.length)}</TabsTrigger>
              <TabsTrigger value="labelling"><TagIcon className="h-3.5 w-3.5" /> Labelling {tabSignal(labelling.length)}</TabsTrigger>
              <TabsTrigger value="returns"><RotateCw className="h-3.5 w-3.5" /> Returns {tabSignal(returns.length, stats.pendingReturns > 0)}</TabsTrigger>
              <TabsTrigger value="addresses"><MapPin className="h-3.5 w-3.5" /> Addresses {tabSignal(addresses.length)}</TabsTrigger>
              <TabsTrigger value="team"><Users className="h-3.5 w-3.5" /> Team {tabSignal(teamOwned.length + teamMember.length)}</TabsTrigger>
              <TabsTrigger value="billing"><FileText className="h-3.5 w-3.5" /> Billing {tabSignal(invoices.length, stats.overdueInvoices > 0)}</TabsTrigger>
              <TabsTrigger value="activity"><Bell className="h-3.5 w-3.5" /> Activity</TabsTrigger>
            </TabsList>
            <div className="relative ml-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search within customer…" className="h-9 pl-8 w-64" />
            </div>
          </div>
        </div>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Col 1: Tags + Health */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TagIcon className="h-4 w-4" /> Tags & segments</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                    {tags.length === 0 && <span className="text-xs text-muted-foreground">No tags yet</span>}
                    {tags.map((t) => (
                      <span key={t.id} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${TAG_CLASS[t.color] || TAG_CLASS.slate}`}>
                        {t.tag}
                        <button onClick={() => removeTag(t.id)} className="hover:opacity-70"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add tag (e.g. VIP)" className="text-sm h-9" onKeyDown={(e) => e.key === 'Enter' && addTag()} />
                    <select value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} className="px-2 rounded-md border border-input bg-background text-xs">
                      {TAG_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <Button size="sm" onClick={addTag} className="h-9"><Plus className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
              <HealthSnapshot orders={orders} tickets={tickets} returns={returns} />
            </div>

            {/* Col 2: Timeline */}
            <ActivityTimeline
              orders={orders} tickets={tickets} wallet={wallet}
              sourcing={sourcing} quotes={quotes} returns={returns}
              notifications={notifications} labelling={labelling}
            />

            {/* Col 3: Quick links + Top products + Destinations */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Quick links</CardTitle></CardHeader>
                <CardContent className="space-y-1.5">
                  <Link to={`/admin/orders?user=${id}`} className="flex items-center justify-between text-sm hover:bg-muted/40 rounded p-2 -mx-2"><span>All orders</span><span className="text-xs text-muted-foreground">{orders.length}</span></Link>
                  <Link to={`/admin/tickets?user=${id}`} className="flex items-center justify-between text-sm hover:bg-muted/40 rounded p-2 -mx-2"><span>Support tickets</span><span className="text-xs text-muted-foreground">{tickets.length}</span></Link>
                  <Link to={`/admin/warehouse`} className="flex items-center justify-between text-sm hover:bg-muted/40 rounded p-2 -mx-2"><span>Warehouse stock</span><span className="text-xs text-muted-foreground">{inventory.length}</span></Link>
                  {invoices[0]?.pdf_url && (
                    <a href={invoices[0].pdf_url} target="_blank" rel="noreferrer" className="flex items-center justify-between text-sm hover:bg-muted/40 rounded p-2 -mx-2"><span>Latest invoice PDF</span><FileText className="h-3.5 w-3.5 text-muted-foreground" /></a>
                  )}
                </CardContent>
              </Card>
              <TopProducts orders={orders} />
              <PreferredDestinations orders={orders} />
            </div>
          </div>
        </TabsContent>

        {/* ORDERS */}
        <TabsContent value="orders">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm">{filteredOrders.length} of {orders.length} orders</CardTitle>
              <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {filteredOrders.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No matching orders.</p> : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="text-left p-3">Order</th><th className="text-left p-3">Type</th><th className="text-left p-3">Items</th><th className="text-left p-3">Total</th><th className="text-left p-3">Status</th><th className="text-left p-3">Date</th><th className="text-right p-3"></th>
                  </tr></thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                        <td className="p-3"><Badge variant="outline" className="capitalize">{o.type}</Badge></td>
                        <td className="p-3 text-xs text-muted-foreground">{(o.products || []).length} item(s)</td>
                        <td className="p-3 tabular-nums font-medium">SAR {Number(o.total).toFixed(0)}</td>
                        <td className="p-3">
                          <Select value={o.status} onValueChange={(v) => updateOrderStatus(o.id, v)}>
                            <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                        <td className="p-3 text-right"><Button asChild size="sm" variant="outline" className="h-7"><Link to={`/admin/orders/${o.id}`}>Open</Link></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* WAREHOUSE */}
        <TabsContent value="warehouse" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Stored inventory</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {inventory.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No stored stock.</p> : (
                <>
                  {/* Stock-on-hand bars */}
                  <div className="p-4 border-b border-border/50 space-y-2 bg-muted/20">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Stock on hand by SKU</p>
                    {(() => {
                      const max = Math.max(...inventory.map(i => i.qty_on_hand || 0), 1);
                      return inventory.slice(0, 6).map(i => (
                        <div key={i.id} className="flex items-center gap-2">
                          <span className="text-xs font-mono w-24 truncate">{i.sku}</span>
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(i.qty_on_hand / max) * 100}%` }} />
                          </div>
                          <span className="text-xs tabular-nums w-10 text-right">{i.qty_on_hand}</span>
                        </div>
                      ));
                    })()}
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="text-left p-3">SKU</th><th className="text-left p-3">Product</th><th className="text-right p-3">On hand</th><th className="text-right p-3">Reserved</th><th className="text-right p-3">Available</th><th className="text-right p-3"></th>
                    </tr></thead>
                    <tbody>
                      {inventory.map((i) => (
                        <tr key={i.id} className="border-b last:border-0">
                          <td className="p-3 font-mono text-xs">{i.sku}</td>
                          <td className="p-3 font-medium">{i.product_name}</td>
                          <td className="p-3 text-right tabular-nums">{i.qty_on_hand}</td>
                          <td className="p-3 text-right tabular-nums text-muted-foreground">{i.qty_reserved}</td>
                          <td className="p-3 text-right tabular-nums font-semibold">{i.qty_available}</td>
                          <td className="p-3 text-right">
                            <Button size="sm" variant="outline" className="h-7" onClick={() => { setInvItem(i); setInvOpen(true); }}>Adjust</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Truck className="h-4 w-4" /> Release requests</CardTitle></CardHeader>
            <CardContent className="p-0">
              {releases.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No release requests.</p> : (
                <div className="divide-y">
                  {releases.map((r) => (
                    <div key={r.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs">#{r.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{r.fulfillment_type} → {r.destination || '—'} · {new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill status={r.status} />
                        <Button asChild size="sm" variant="outline" className="h-7"><Link to="/admin/warehouse">Open</Link></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SOURCING */}
        <TabsContent value="sourcing" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sourcing requests ({sourcing.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              {sourcing.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No sourcing requests.</p> : (
                <div className="divide-y">
                  {sourcing.map((s) => (
                    <div key={s.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{s.product_name}</p>
                        <p className="text-xs text-muted-foreground">qty {s.quantity} · target SAR {Number(s.target_price_sar).toFixed(0)} · {new Date(s.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill status={s.status} />
                        <Button asChild size="sm" variant="outline" className="h-7"><Link to="/admin/sourcing">Open</Link></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Quote requests ({quotes.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              {quotes.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No quote requests.</p> : (
                <div className="divide-y">
                  {quotes.map((q) => (
                    <div key={q.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs">#{q.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">qty {q.quantity} · target SAR {Number(q.target_price_sar).toFixed(0)} · {new Date(q.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill status={q.status} />
                        <Button asChild size="sm" variant="outline" className="h-7"><Link to="/admin/quotes">Open</Link></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LABELLING */}
        <TabsContent value="labelling">
          <Card>
            <CardContent className="p-0">
              {labelling.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No labelling requests.</p> : (
                <div className="divide-y">
                  {labelling.map((l) => (
                    <div key={l.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{l.type?.toUpperCase()} · {l.items_count} item(s)</p>
                        <p className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}{l.order_id && ' · order #' + l.order_id.slice(0, 8)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill status={l.status} />
                        {l.order_id && <Button asChild size="sm" variant="outline" className="h-7"><Link to={`/admin/orders/${l.order_id}`}>Order</Link></Button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RETURNS */}
        <TabsContent value="returns">
          <Card>
            <CardContent className="p-0">
              {returns.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No return requests.</p> : (
                <div className="divide-y">
                  {returns.map((r) => (
                    <div key={r.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{r.reason}</p>
                        <p className="text-xs text-muted-foreground">refund SAR {Number(r.refund_amount).toFixed(0)} · {(r.photos || []).length} photos · {new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill status={r.status} />
                        <Button asChild size="sm" variant="outline" className="h-7"><Link to="/admin/returns">Open</Link></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADDRESSES */}
        <TabsContent value="addresses">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4" /> Shipping addresses</CardTitle>
              <Button size="sm" onClick={() => { setEditingAddress(null); setAddressOpen(true); }}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
            </CardHeader>
            <CardContent className="p-0">
              {addresses.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No addresses on file.</p> : (
                <div className="divide-y">
                  {addresses.map((a) => (
                    <div key={a.id} className="p-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{a.label || a.recipient_name}</p>
                          <Badge variant="outline" className="text-[10px] capitalize">{a.type}</Badge>
                          {a.is_default && <Badge className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100">default</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{a.recipient_name} · {a.phone}</p>
                        <p className="text-xs text-muted-foreground">{a.address_line1}{a.address_line2 ? ', ' + a.address_line2 : ''}, {a.city}{a.region ? ', ' + a.region : ''} {a.postal_code}, {a.country}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="h-7" onClick={() => { setEditingAddress(a); setAddressOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                        <Button size="sm" variant="outline" className="h-7" onClick={() => deleteAddress(a.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEAM */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Team members invited by this user ({teamOwned.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              {teamOwned.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No team members invited.</p> : (
                <div className="divide-y">
                  {teamOwned.map((m) => (
                    <div key={m.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{m.invite_email}</p>
                        <p className="text-xs text-muted-foreground">invited {new Date(m.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill status={m.status} />
                        <Select value={m.member_role} onValueChange={(v: any) => updateTeamRole(m.id, v)}>
                          <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="buyer">Buyer</SelectItem>
                          </SelectContent>
                        </Select>
                        {m.status !== 'revoked' && <Button size="sm" variant="outline" className="h-7" onClick={() => revokeTeamMember(m.id)}>Revoke</Button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Member of other teams ({teamMember.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              {teamMember.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">Not a member of any team.</p> : (
                <div className="divide-y">
                  {teamMember.map((m) => (
                    <div key={m.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">Owner: {m.owner_id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">role: {m.member_role}</p>
                      </div>
                      <StatusPill status={m.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BILLING */}
        <TabsContent value="billing" className="space-y-4">
          {/* Wallet ledger */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4" /> Wallet ledger ({wallet.length})</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {wallet.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No wallet activity.</p> : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="text-left p-3">Date</th><th className="text-left p-3">Type</th><th className="text-left p-3">Description</th><th className="text-right p-3">Amount</th><th className="text-right p-3">Balance</th>
                  </tr></thead>
                  <tbody>
                    {wallet.slice(0, 50).map((w) => {
                      const isMatch = highlightTxId && w.id === highlightTxId;
                      return (
                      <tr
                        key={w.id}
                        ref={isMatch ? walletHighlightRef : undefined}
                        className={`border-b last:border-0 ${isMatch ? 'bg-primary/5 ring-1 ring-primary/40' : ''}`}
                      >
                        <td className="p-3 text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString()}</td>
                        <td className="p-3"><Badge variant="outline" className="text-[10px] capitalize">{w.type}</Badge></td>
                        <td className="p-3 text-xs">{w.description}</td>
                        <td className={`p-3 text-right tabular-nums font-semibold ${Number(w.amount) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{Number(w.amount) >= 0 ? '+' : ''}{Number(w.amount).toFixed(2)}</td>
                        <td className="p-3 text-right tabular-nums text-muted-foreground">{Number(w.balance_after).toFixed(2)}</td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Invoices ({invoices.length})</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {invoices.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No invoices.</p> : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="text-left p-3">Invoice</th><th className="text-left p-3">Period</th><th className="text-right p-3">Amount</th><th className="text-left p-3">Status</th><th className="text-right p-3"></th>
                  </tr></thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b last:border-0">
                        <td className="p-3 font-mono text-xs">{inv.invoice_number || inv.id.slice(0, 8)}</td>
                        <td className="p-3 text-xs text-muted-foreground">{inv.period_start || '—'} → {inv.period_end || '—'}</td>
                        <td className="p-3 text-right tabular-nums font-medium">SAR {Number(inv.amount).toFixed(2)}</td>
                        <td className="p-3"><StatusPill status={inv.status} /></td>
                        <td className="p-3 text-right">
                          <Select value={inv.status} onValueChange={(v) => updateInvoiceStatus(inv.id, v)}>
                            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['pending', 'paid', 'overdue', 'cancelled'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACTIVITY */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Audit log</CardTitle></CardHeader>
            <CardContent className="p-0">
              {auditEvents.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No audit events.</p> : (
                <div className="divide-y max-h-96 overflow-y-auto">
                  {auditEvents.map((a) => (
                    <div key={a.id} className="p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{a.summary}</p>
                        <Badge variant="outline" className="text-[10px] capitalize">{a.entity_type} · {a.action}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()} · {a.actor_email || a.actor_id?.slice(0, 8) || 'system'}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications sent</CardTitle></CardHeader>
            <CardContent className="p-0">
              {notifications.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No notifications.</p> : (
                <div className="divide-y max-h-96 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{n.title}</p>
                        <Badge variant="outline" className="text-[10px]">{n.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}{n.read_at ? ' · read' : ' · unread'}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating communication drawer */}
      <CommDrawer
        customerId={id!}
        customerName={customerName}
        notes={notes}
        authorId={user?.id}
        notifications={notifications}
        onChanged={load}
      />

      {/* Dialogs */}
      <WalletAdjustDialog
        open={walletOpen}
        onOpenChange={setWalletOpen}
        customerId={id!}
        customerName={customerName}
        currentBalance={stats.balance}
        onSaved={load}
      />
      <SendNotificationDialog
        open={notifOpen}
        onOpenChange={setNotifOpen}
        customerId={id!}
        customerName={customerName}
        customerEmail={profile.email}

      />
      <EditAddressDialog
        open={addressOpen}
        onOpenChange={setAddressOpen}
        customerId={id!}
        address={editingAddress}
        onSaved={load}
      />
      <AdjustInventoryDialog
        open={invOpen}
        onOpenChange={setInvOpen}
        inventory={invItem}
        onAdjusted={load}
      />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this customer permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the account and its data from the backend. Orders, wallet history and
              requests tied to this account are deleted too. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-mono font-medium text-foreground">{profile.email}</span> to confirm.
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Customer email"
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteBusy || deleteConfirm.trim().toLowerCase() !== String(profile.email || '').trim().toLowerCase()}
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBusy ? 'Deleting…' : 'Delete customer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomerDetail;
