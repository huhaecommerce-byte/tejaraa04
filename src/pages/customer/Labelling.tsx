import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { useMonthlyUsage } from '@/hooks/useMonthlyUsage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tag, Palette, Package, ChevronRight, Send, Sparkles, Search,
  Check, ArrowLeft, ArrowRight, Edit3, ShoppingBag, FileText, ClipboardCheck,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import LabelPreview from '@/components/customer/LabelPreview';
import UpgradePrompt from '@/components/UpgradePrompt';
import { SegmentedToggle } from '@/components/customer/SegmentedToggle';
import { computeSla, slaBadgeClass } from '@/lib/sla';
import { cn } from '@/lib/utils';

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};
const serviceTierLabel: Record<string, string> = { basic: '📦 Basic Labelling', priority: '⚡ Priority Queue' };

interface OrderProduct {
  name: string;
  sku?: string;
  qty?: number;
  price?: number;
  image?: string;
}

const labelTypeOptions = [
  { label: 'Amazon FBA', value: 'fba' },
  { label: 'Noon FBN', value: 'fbn' },
  { label: 'Custom', value: 'custom' },
];

const Labelling = () => {
  const { user } = useAuth();
  const { limits, planName, getLimit, hasFeature, numericLimit } = useCurrentPlan();
  const labellingPriority = getLimit('labelling_priority') || 'standard';
  const designerVal = getLimit('label_designer');
  const hasDesigner = designerVal === 'yes' || designerVal === 'brand_kit';
  const monthlyUnits = numericLimit('labelling_units_monthly');
  const unitsUnlimited = monthlyUnits === Infinity;
  const { used: unitsUsedThisMonth } = useMonthlyUsage('labelling_requests', { sumColumn: 'items_count' });

  // Data state
  const [orders, setOrders] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stepper
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 filters
  const [searchOrder, setSearchOrder] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selections
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [labelData, setLabelData] = useState({ asin: '', sku: '', fnsku: '' });
  const [labelType, setLabelType] = useState('fba');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // History
  const [historyTab, setHistoryTab] = useState('active');

  // Custom designer dialog
  const [designerOpen, setDesignerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const [ordersRes, templatesRes, requestsRes] = await Promise.all([
      supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('label_templates').select('*').order('created_at', { ascending: false }),
      supabase.from('labelling_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setOrders(ordersRes.data || []);
    setTemplates(templatesRes.data || []);
    setRequests(requestsRes.data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const parseProducts = (products: any): OrderProduct[] => {
    if (!products) return [];
    if (Array.isArray(products)) return products;
    try { return JSON.parse(products); } catch { return []; }
  };

  const filteredOrders = useMemo(() => {
    const q = searchOrder.trim().toLowerCase();
    return orders.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (!q) return true;
      if (o.id.toLowerCase().includes(q)) return true;
      const prods = parseProducts(o.products);
      return prods.some(p => (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q));
    });
  }, [orders, searchOrder, statusFilter]);

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order);
    setSelectedTemplate(null);
    const prods = parseProducts(order.products);
    setLabelData({ asin: '', sku: prods[0]?.sku || '', fnsku: '' });
    setNotes('');
    setStep(2);
  };

  const handleAutofillSku = () => {
    const prods = parseProducts(selectedOrder?.products);
    if (prods[0]?.sku) {
      setLabelData(d => ({ ...d, sku: prods[0].sku || '' }));
      toast.success('SKU filled from order');
    } else {
      toast.error('No SKU on first product');
    }
  };

  const handleSubmit = async () => {
    if (!user?.id || !selectedOrder) {
      toast.error('Please select an order');
      return;
    }
    const products = parseProducts(selectedOrder.products);
    const itemsThisRequest = products.reduce((s: number, p: OrderProduct) => s + (p.qty || 1), 0);
    if (!unitsUnlimited && monthlyUnits > 0 && unitsUsedThisMonth + itemsThisRequest > monthlyUnits) {
      toast.error(`Monthly labelling limit (${monthlyUnits.toLocaleString()} units) would be exceeded — you've used ${unitsUsedThisMonth} this month and this order needs ${itemsThisRequest} more. Upgrade your ${planName} plan.`);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('labelling_requests').insert({
      user_id: user.id,
      customer_name: user.name || '',
      type: labelType,
      items_count: itemsThisRequest,
      notes: notes || null,
      status: 'pending',
      order_id: selectedOrder.id,
      template_id: selectedTemplate?.id || null,
      label_data: { ...labelData, template_name: selectedTemplate?.name } as any,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Labelling request submitted!');
    setSelectedOrder(null);
    setSelectedTemplate(null);
    setLabelData({ asin: '', sku: '', fnsku: '' });
    setNotes('');
    setStep(1);
    fetchData();
  };

  const stepperItems = [
    { n: 1, label: 'Pick order', icon: ShoppingBag },
    { n: 2, label: 'Template & data', icon: FileText },
    { n: 3, label: 'Review', icon: ClipboardCheck },
  ];

  const canGoToStep = (target: number) => {
    if (target === 1) return true;
    if (target === 2) return !!selectedOrder;
    if (target === 3) return !!selectedOrder && !!selectedTemplate;
    return false;
  };

  // History buckets
  const activeRequests = requests.filter(r => r.status === 'pending' || r.status === 'in_progress');
  const completedRequests = requests.filter(r => r.status === 'completed');
  const visibleRequests = historyTab === 'active' ? activeRequests : historyTab === 'completed' ? completedRequests : requests;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Labelling service"
        highlight="service"
        subtitle="Pick an order, choose a template, review and submit — in three quick steps."
        guide={{
          chip: 'FBA / FBN labelling',
          intro: 'Print-ready barcodes for Amazon and Noon in seconds.',
          steps: [
            { title: 'Pick orders', description: 'Select fulfilled units that need labels applied.' },
            { title: 'Generate', description: 'Auto-create Amazon and Noon barcodes per item.' },
            { title: 'Print', description: 'Download a sheet-ready PDF for your label printer.' },
          ],
        }}
      />

      {/* Plan ribbon */}
      <div className="aux-card aux-card-pad flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
          <span>📦</span>
          <span>{planName} · {labellingPriority === 'top' ? '🏎 Top priority (24h)' : labellingPriority === 'priority' ? '⚡ Priority (2 days)' : '📦 Standard (5 days)'}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {unitsUnlimited ? 'Unlimited units/mo' : `${unitsUsedThisMonth.toLocaleString()} / ${monthlyUnits.toLocaleString()} units this month`}
        </Badge>
        {hasDesigner && (
          <Badge variant="outline" className="text-xs text-primary border-primary/40">
            <Palette className="h-3.5 w-3.5 mr-1" /> Custom designer included
          </Badge>
        )}
        {hasFeature('polybagging') && <Badge variant="outline" className="text-xs">Polybagging</Badge>}
        {hasFeature('expiry_batch_labels') && <Badge variant="outline" className="text-xs">Expiry / batch</Badge>}
        {hasFeature('free_relabel') && <Badge variant="outline" className="text-xs">Free re-labelling</Badge>}
      </div>

      {/* Stepper */}
      <div className="aux-card aux-card-pad">
        <div className="flex items-center justify-between gap-2">
          {stepperItems.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.n;
            const isDone = step > s.n;
            const reachable = canGoToStep(s.n);
            return (
              <div key={s.n} className="flex items-center flex-1">
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => reachable && setStep(s.n as 1 | 2 | 3)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive && 'bg-primary text-primary-foreground shadow-sm',
                    !isActive && isDone && 'bg-primary/10 text-primary',
                    !isActive && !isDone && 'bg-muted/50 text-muted-foreground',
                    !reachable && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <span className={cn(
                    'inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold',
                    isActive && 'bg-primary-foreground/20',
                    isDone && 'bg-primary text-primary-foreground',
                    !isActive && !isDone && 'bg-background border',
                  )}>
                    {isDone ? <Check className="h-3.5 w-3.5" /> : s.n}
                  </span>
                  <Icon className="h-4 w-4 hidden sm:inline" />
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {idx < stepperItems.length - 1 && (
                  <div className={cn('flex-1 h-0.5 mx-2', step > s.n ? 'bg-primary/40' : 'bg-border')} />
                )}
              </div>
            );
          })}
        </div>

        {/* Sticky selection chip */}
        {selectedOrder && step !== 1 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm border-t pt-3">
            <Badge variant="secondary" className="font-mono">#{selectedOrder.id.slice(0, 8)}</Badge>
            <span className="text-muted-foreground">
              {parseProducts(selectedOrder.products).reduce((s: number, p: OrderProduct) => s + (p.qty || 1), 0)} items
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs ml-auto"
              onClick={() => { setSelectedOrder(null); setSelectedTemplate(null); setStep(1); }}
            >
              Change order
            </Button>
          </div>
        )}
      </div>

      {/* Active step body */}
      {loading ? (
        <Skeleton className="h-[400px] w-full rounded-xl" />
      ) : step === 1 ? (
        <div className="aux-card aux-card-pad space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, product name or SKU…"
                value={searchOrder}
                onChange={e => setSearchOrder(e.target.value)}
                className="pl-9"
              />
            </div>
            <SegmentedToggle
              options={[
                { label: 'All', value: 'all' },
                { label: 'Delivered', value: 'delivered' },
                { label: 'Processing', value: 'processing' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>

          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={<Package className="h-8 w-8 text-muted-foreground" />}
              title={orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
              description={orders.length === 0 ? 'Place an order first, then come back to request labelling.' : 'Try clearing the search or status filter.'}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredOrders.map((order, i) => {
                const products = parseProducts(order.products);
                const totalItems = products.reduce((s, p) => s + (p.qty || 1), 0);
                const first = products[0];
                return (
                  <Card
                    key={order.id}
                    className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
                    onClick={() => handleSelectOrder(order)}
                  >
                    <CardContent className="p-4 flex gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-semibold">#{order.id.slice(0, 8)}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusColor[order.status] || ''}`}>
                            {order.status}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {first?.image && (
                            <img src={first.image} alt="" className="h-10 w-10 rounded object-cover border" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{first?.name || 'Untitled product'}</p>
                            <p className="text-xs text-muted-foreground">
                              {totalItems} item{totalItems !== 1 ? 's' : ''}
                              {products.length > 1 && ` · +${products.length - 1} more`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="self-center shrink-0" tabIndex={-1}>
                        Use <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : step === 2 ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-4">
          {/* Left: preview + template strip */}
          <div className="aux-card aux-card-pad space-y-3 lg:sticky lg:top-4 lg:self-start">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Label type</Label>
              <div className="mt-1.5">
                <SegmentedToggle options={labelTypeOptions} value={labelType} onChange={setLabelType} />
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Live preview</Label>
              <div className="mt-1.5">
                {selectedTemplate ? (
                  <LabelPreview
                    canvasJson={selectedTemplate.canvas_json}
                    asin={labelData.asin}
                    sku={labelData.sku}
                    fnsku={labelData.fnsku}
                    width={380}
                    height={260}
                  />
                ) : (
                  <div className="h-[260px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
                    <Tag className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">Pick a template to preview</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Templates</Label>
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">No templates available yet.</p>
              ) : (
                <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {templates.map((t) => {
                    const isSel = selectedTemplate?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTemplate(t)}
                        className={cn(
                          'rounded-lg border p-1.5 text-left transition-all hover:shadow-sm',
                          isSel ? 'ring-2 ring-primary border-primary' : 'border-border',
                        )}
                      >
                        <div className="overflow-hidden rounded bg-white flex items-center justify-center" style={{ height: 80 }}>
                          <LabelPreview
                            canvasJson={t.canvas_json}
                            asin={labelData.asin || 'ASIN'}
                            sku={labelData.sku || 'SKU'}
                            fnsku={labelData.fnsku || 'FNSKU'}
                            width={120}
                            height={80}
                          />
                        </div>
                        <p className="text-[11px] truncate font-medium mt-1">{t.name}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: inputs */}
          <div className="aux-card aux-card-pad space-y-4">
            <div>
              <h3 className="text-base font-semibold">Label data</h3>
              <p className="text-xs text-muted-foreground">Values used to generate the printed barcode and codes.</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="asin">ASIN</Label>
                <Input
                  id="asin"
                  placeholder="B08N5WRWNW"
                  value={labelData.asin}
                  onChange={e => setLabelData(d => ({ ...d, asin: e.target.value.toUpperCase() }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Amazon Standard Identification Number — found on the listing URL.</p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sku">SKU</Label>
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={handleAutofillSku}>
                    <Sparkles className="h-3 w-3 mr-1" /> Use SKU from order
                  </Button>
                </div>
                <Input
                  id="sku"
                  placeholder="SKU-001"
                  value={labelData.sku}
                  onChange={e => setLabelData(d => ({ ...d, sku: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Your internal product code.</p>
              </div>

              <div>
                <Label htmlFor="fnsku">FNSKU</Label>
                <Input
                  id="fnsku"
                  placeholder="X001ABC234"
                  value={labelData.fnsku}
                  onChange={e => setLabelData(d => ({ ...d, fnsku: e.target.value.toUpperCase() }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Amazon FNSKU — usually starts with X00…</p>
              </div>

              <div>
                <Label htmlFor="notes">Special instructions</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g. Apply on top-right corner, do not cover existing barcode…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!selectedTemplate}>
                Continue to review <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Step 3 — Review
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,360px)] gap-4">
          <div className="aux-card aux-card-pad space-y-4">
            <div>
              <h3 className="text-base font-semibold">Review your request</h3>
              <p className="text-xs text-muted-foreground">Double-check the details below, then submit.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <ReviewRow label="Order" value={`#${selectedOrder?.id.slice(0, 8)}`} />
                <ReviewRow label="Items" value={`${parseProducts(selectedOrder?.products).reduce((s: number, p: OrderProduct) => s + (p.qty || 1), 0)} unit(s)`} />
                <ReviewRow label="Label type" value={labelTypeOptions.find(o => o.value === labelType)?.label || labelType} />
                <ReviewRow label="Template" value={selectedTemplate?.name || '—'} />
              </div>
              <div className="space-y-3">
                <ReviewRow label="ASIN" value={labelData.asin || '—'} mono />
                <ReviewRow label="SKU" value={labelData.sku || '—'} mono />
                <ReviewRow label="FNSKU" value={labelData.fnsku || '—'} mono />
                <ReviewRow label="Notes" value={notes || 'None'} />
              </div>
            </div>

            {selectedTemplate && (
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Final preview</Label>
                <div className="mt-1.5">
                  <LabelPreview
                    canvasJson={selectedTemplate.canvas_json}
                    asin={labelData.asin}
                    sku={labelData.sku}
                    fnsku={labelData.fnsku}
                    width={380}
                    height={260}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <Edit3 className="h-4 w-4 mr-1" /> Edit details
              </Button>
              <Button className="sm:ml-auto" onClick={handleSubmit} disabled={submitting} size="lg">
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting…' : 'Submit labelling request'}
              </Button>
            </div>
          </div>

          {/* Designer side card */}
          <div className="aux-card aux-card-pad space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Need a custom design?</h3>
            </div>
            {hasDesigner ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Open the designer to build a one-off label from scratch with logos, fonts and brand colors.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-primary/30 text-primary hover:bg-primary/5"
                  onClick={() => setDesignerOpen(true)}
                >
                  <Palette className="h-4 w-4 mr-2" /> Open custom designer
                </Button>
              </>
            ) : (
              <UpgradePrompt
                currentPlan={planName}
                limitLabel="custom label designer"
                message="Custom label design is available on Growth+ plans."
              />
            )}
          </div>
        </div>
      )}

      {/* Requests history */}
      <div className="aux-card aux-card-pad space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          <h2 className="text-base font-semibold">Your labelling requests</h2>
        </div>

        <Tabs value={historyTab} onValueChange={setHistoryTab}>
          <TabsList>
            <TabsTrigger value="active">In progress ({activeRequests.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedRequests.length})</TabsTrigger>
            <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
          </TabsList>
          <TabsContent value={historyTab} className="mt-3">
            {visibleRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No requests in this view.</p>
            ) : (
              <div className="space-y-2">
                {visibleRequests.map((l: any, i: number) => {
                  const sla = computeSla(l.created_at, l.status);
                  return (
                    <div
                      key={l.id}
                      className="rounded-lg border p-3 flex flex-wrap items-center gap-x-4 gap-y-2 opacity-0 animate-fade-in-up hover:bg-muted/30 transition-colors"
                      style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }}
                    >
                      <span className="font-mono text-xs font-semibold">{l.id.slice(0, 8)}</span>
                      <Badge variant="outline" className="uppercase text-[10px]">{l.type}</Badge>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusColor[l.status] || ''}`}>
                        {l.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">{l.items_count} items</span>
                      {(l.label_data as any)?.template_name && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          · {(l.label_data as any).template_name}
                        </span>
                      )}
                      <span className={cn('text-[11px] px-2 py-0.5 rounded-full border', slaBadgeClass(sla.tone))}>
                        {sla.label}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(l.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Custom Designer Dialog */}
      {hasDesigner && (
        <Dialog open={designerOpen} onOpenChange={setDesignerOpen}>
          <DialogContent className="max-w-6xl h-[85vh]">
            <DialogHeader>
              <DialogTitle>Custom Label Designer</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm text-muted-foreground">
                Use the full label designer to create a custom label. Save your design and submit it with your labelling request.
              </p>
              <iframe
                src="/admin/label-designer"
                className="w-full h-[calc(85vh-100px)] border rounded mt-2"
                title="Label Designer"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const ReviewRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div>
    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={cn('text-sm font-medium mt-0.5 break-words', mono && 'font-mono')}>{value}</p>
  </div>
);

export default Labelling;
