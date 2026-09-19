import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, Calendar, DollarSign, Store, Eye, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { InvoiceViewer } from '@/components/customer/InvoiceViewer';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
};

const CustomerInvoices = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [storeFilter, setStoreFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      setLoading(true);
      const [invRes, storeRes] = await Promise.all([
        supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('store_integrations').select('id, store_name').eq('user_id', user.id),
      ]);
      setInvoices(invRes.data || []);
      setStores(storeRes.data || []);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const filtered = storeFilter === 'all' ? invoices : invoices.filter(i => i.store_id === storeFilter);

  const totalAmount = invoices.reduce((s, i) => s + Number(i.amount || 0), 0);
  const paidCount = invoices.filter(i => i.status === 'paid').length;

  const summaryCards = [
    { label: 'Total Invoices', value: invoices.length, icon: FileText, bg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Total Amount', value: `${totalAmount.toFixed(2)} SAR`, icon: DollarSign, bg: 'bg-green-50', iconColor: 'text-green-600' },
    { label: 'Paid', value: paidCount, icon: FileText, bg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'Pending', value: invoices.length - paidCount, icon: Calendar, bg: 'bg-yellow-50', iconColor: 'text-yellow-600' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My invoices"
        highlight="invoices"
        subtitle="ZATCA Phase 1 compliant tax invoices"
        guide={{
          chip: 'ZATCA compliant',
          intro: 'Everything your accountant needs in one place.',
          steps: [
            { title: 'Browse', description: 'Filter invoices by date range and payment status.' },
            { title: 'Download', description: 'Grab VAT-compliant PDFs ready for bookkeeping.' },
            { title: 'Reconcile', description: 'Match invoices to your orders and payments easily.' },
          ],
        }}
        actions={
          stores.length > 0 ? (
            <Select value={storeFilter} onValueChange={setStoreFilter}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Filter by store" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.store_name}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : undefined
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />) :
          summaryCards.map((s, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      {/* Invoice List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No invoices yet</p>
              <p className="text-xs text-muted-foreground">Invoices will appear here once generated</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(inv => (
                <div
                  key={inv.id}
                  className="flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-4 p-4 border rounded-xl hover:bg-muted/30 transition-colors min-h-[72px] active:scale-[0.99] transition-transform"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-[60%] md:min-w-0">
                    <p className="text-sm font-semibold truncate">{inv.invoice_number || `INV-${inv.id.slice(0, 8).toUpperCase()}`}</p>
                    <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground mt-0.5">
                      {inv.period_start && <span>{new Date(inv.period_start).toLocaleDateString()} – {new Date(inv.period_end).toLocaleDateString()}</span>}
                      <span>{new Date(inv.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold ml-auto md:ml-0">{Number(inv.amount).toFixed(2)} SAR</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[inv.status] || 'bg-muted'}`}>
                    {inv.status}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSelectedInvoice(inv); setViewerOpen(true); }}
                  >
                    <Eye className="h-4 w-4 mr-1.5" /> View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InvoiceViewer invoice={selectedInvoice} open={viewerOpen} onOpenChange={setViewerOpen} />
    </div>
  );
};

export default CustomerInvoices;
