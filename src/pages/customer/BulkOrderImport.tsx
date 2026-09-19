import { sellPriceSar } from '@/lib/priceConversion';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from "@/lib/router-compat";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Download, Wallet as WalletIcon, Plus, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { useMonthlyUsage } from '@/hooks/useMonthlyUsage';
import { useMonthlyUnits } from '@/hooks/useMonthlyUnits';
import UpgradePrompt from '@/components/UpgradePrompt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Row = {
  sku: string;
  quantity: number;
  destination?: string;
  notes?: string;
  // resolved
  product?: any;
  error?: string;
};

function parseCSV(text: string): Row[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const skuIdx = header.indexOf('sku');
  const qtyIdx = header.findIndex(h => h === 'quantity' || h === 'qty');
  const destIdx = header.indexOf('destination');
  const notesIdx = header.indexOf('notes');
  if (skuIdx < 0 || qtyIdx < 0) throw new Error('CSV must have "sku" and "quantity" columns');
  return lines.slice(1).map(l => {
    const cols = l.split(',').map(c => c.trim());
    return {
      sku: cols[skuIdx] || '',
      quantity: parseInt(cols[qtyIdx] || '0', 10) || 0,
      destination: destIdx >= 0 ? cols[destIdx] : '',
      notes: notesIdx >= 0 ? cols[notesIdx] : '',
    };
  }).filter(r => r.sku);
}

export default function BulkOrderImport() {
  const { user } = useAuth();
  const { hasFeature, planName, isLoading: planLoading, numericLimit, isUnlimited } = useCurrentPlan();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [destination, setDestination] = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const importEnabled = hasFeature('bulk_import');
  const { used: bulkUsedThisMonth } = useMonthlyUsage('orders', { typeFilter: 'bulk' });
  const bulkMonthlyLimit = numericLimit('bulk_orders_monthly');
  const bulkUnlimited = isUnlimited('bulk_orders_monthly');
  const bulkExceeded = !bulkUnlimited && bulkMonthlyLimit > 0 && bulkUsedThisMonth >= bulkMonthlyLimit;
  const { used: unitsUsedThisMonth } = useMonthlyUnits();
  const unitsMonthlyLimit = numericLimit('total_units_monthly');
  const unitsUnlimited = isUnlimited('total_units_monthly');

  useEffect(() => {
    if (!user?.id) return;
    const fetchBal = async () => {
      const { data } = await supabase.rpc('wallet_get_balance');
      setWalletBalance(Number(data ?? 0));
    };
    fetchBal();
    const channel = supabase
      .channel(`wallet-bulk-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}` }, fetchBal)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (!parsed.length) { toast.error('No rows found in CSV'); setParsing(false); return; }
      // Resolve products by SKU
      const skus = Array.from(new Set(parsed.map(r => r.sku)));
      const { data: products } = await supabase.from('products').select('*').in('sku', skus);
      const bySku: Record<string, any> = {};
      (products || []).forEach(p => { bySku[p.sku] = p; });
      const resolved = parsed.map(r => {
        const p = bySku[r.sku];
        if (!p) return { ...r, error: 'SKU not found' };
        if (r.quantity < 1) return { ...r, error: 'Quantity must be ≥ 1', product: p };
        if (p.track_inventory && p.stock_qty < r.quantity) return { ...r, error: `Only ${p.stock_qty} in stock`, product: p };
        return { ...r, product: p };
      });
      setRows(resolved);
      const ok = resolved.filter(r => !r.error).length;
      toast.success(`Parsed ${resolved.length} rows · ${ok} valid`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to parse CSV');
    } finally {
      setParsing(false);
    }
  };

  const validRows = rows.filter(r => !r.error && r.product);
  const total = validRows.reduce((s, r) => s + sellPriceSar(r.product) * r.quantity, 0);
  const totalUnits = validRows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);

  const submit = async () => {
    if (!user || !validRows.length) return;
    if (!destination.trim()) { toast.error('Set a destination first'); return; }
    if (bulkExceeded) {
      toast.error(`Monthly bulk-order limit reached (${bulkMonthlyLimit}). Upgrade your ${planName} plan.`);
      return;
    }
    if (!unitsUnlimited && unitsMonthlyLimit > 0 && unitsUsedThisMonth + totalUnits > unitsMonthlyLimit) {
      const remaining = Math.max(0, unitsMonthlyLimit - unitsUsedThisMonth);
      toast.error(`Monthly units cap: ${unitsMonthlyLimit}/mo. ${unitsUsedThisMonth} used, ${remaining} remaining (this import needs ${totalUnits}). Upgrade your ${planName} plan.`);
      return;
    }
    if (walletBalance !== null && walletBalance < total) {
      toast.error(`Insufficient wallet balance — need SAR ${(total - walletBalance).toFixed(2)} more.`);
      return;
    }
    setSubmitting(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('user_id', user.id).maybeSingle();
      const productsJson = validRows.map(r => ({
        product_id: r.product.id,
        name: r.product.name,
        sku: r.sku,
        quantity: r.quantity,
        unit_price: sellPriceSar(r.product),
        notes: r.notes || null,
      }));
      const { data: order, error } = await supabase.from('orders').insert({
        user_id: user.id,
        type: 'bulk',
        destination,
        customer_name: profile?.display_name || user.email || '',
        products: productsJson,
        total,
        status: 'pending',
      }).select('id').single();
      if (error) throw error;

      // Atomic wallet debit
      const { data: debitData, error: debitError } = await supabase.rpc('wallet_debit_for_order', {
        _order_id: order.id,
        _amount: total,
      });
      const debitResult = debitData as any;
      if (debitError || !debitResult?.ok) {
        await supabase.from('orders').delete().eq('id', order.id);
        const reason = debitResult?.error === 'insufficient_funds'
          ? `Insufficient wallet balance (SAR ${Number(debitResult.balance ?? 0).toFixed(2)} available, SAR ${total.toFixed(2)} needed)`
          : (debitError?.message || debitResult?.error || 'Wallet payment failed');
        toast.error(reason);
        setSubmitting(false);
        return;
      }

      toast.success(`Bulk order placed — SAR ${total.toFixed(2)} debited from wallet.`);
      navigate(`/dropshipping/orders/${order.id}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadSample = () => {
    const csv = 'sku,quantity,notes\nSKU-001,10,Restock\nSKU-002,5,';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'bulk-order-sample.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk import"
        highlight="import"
        subtitle="Upload a CSV of SKUs and quantities to place a single bulk order."
        guide={{
          chip: 'Bulk in 3 steps',
          intro: 'Place dozens of orders without rebuilding carts.',
          steps: [
            { title: 'Download template', description: 'Use our CSV format to avoid validation errors.' },
            { title: 'Fill SKU + qty', description: 'Add rows for every product and quantity needed.' },
            { title: 'Upload', description: 'Submit the file and your bulk order is created instantly.' },
          ],
        }}
      />

      {!planLoading && !importEnabled && (
        <UpgradePrompt
          currentPlan={planName}
          limitLabel="bulk CSV import"
          message={`Bulk CSV import is a Growth feature. Upgrade to import dozens of orders at once.`}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {bulkUnlimited ? 'Unlimited bulk orders/mo' : `${bulkUsedThisMonth} / ${bulkMonthlyLimit || 0} bulk orders this month`}
        </Badge>
        {bulkExceeded && (
          <UpgradePrompt
            variant="chip"
            currentPlan={planName}
            limitLabel="bulk orders"
            message="Monthly limit reached"
          />
        )}
      </div>

      <div className="aux-card p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Label htmlFor="csv" className="cursor-pointer">
            <div className="inline-flex items-center gap-2 px-4 h-10 rounded-md border border-dashed border-primary/40 hover:border-primary bg-primary/5 text-sm font-medium">
              <Upload className="h-4 w-4" /> Choose CSV file
            </div>
            <input id="csv" type="file" accept=".csv,text/csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </Label>
          <Button variant="outline" size="sm" onClick={downloadSample}><Download className="h-4 w-4 mr-1" /> Sample CSV</Button>
          {parsing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <p className="text-xs text-muted-foreground">Required columns: <code className="px-1.5 py-0.5 rounded bg-muted">sku</code>, <code className="px-1.5 py-0.5 rounded bg-muted">quantity</code>. Optional: <code className="px-1.5 py-0.5 rounded bg-muted">notes</code>.</p>
      </div>

      {rows.length > 0 && (
        <>
          <div className="aux-card p-4 space-y-3">
            <Label>Destination *</Label>
            <Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Full delivery address (street, city)" />
          </div>

          <div className="aux-card overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="font-semibold">{rows.length} rows</span>
                <Badge variant="secondary">{validRows.length} valid</Badge>
                {rows.length - validRows.length > 0 && <Badge variant="destructive">{rows.length - validRows.length} errors</Badge>}
              </div>
              <div className="text-sm font-semibold">Total: SAR {total.toFixed(2)}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs">
                  <tr><th className="text-left px-3 py-2">SKU</th><th className="text-left px-3 py-2">Product</th><th className="text-right px-3 py-2">Qty</th><th className="text-right px-3 py-2">Unit (SAR)</th><th className="text-right px-3 py-2">Subtotal</th><th className="text-left px-3 py-2">Status</th></tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 font-mono text-xs">{r.sku}</td>
                      <td className="px-3 py-2 truncate max-w-[200px]">{r.product?.name || '—'}</td>
                      <td className="px-3 py-2 text-right">{r.quantity}</td>
                      <td className="px-3 py-2 text-right">{r.product ? sellPriceSar(r.product).toFixed(2) : '—'}</td>
                      <td className="px-3 py-2 text-right font-medium">{r.product && !r.error ? (sellPriceSar(r.product) * r.quantity).toFixed(2) : '—'}</td>
                      <td className="px-3 py-2">
                        {r.error ? (
                          <span className="inline-flex items-center gap-1 text-xs text-destructive"><AlertCircle className="h-3 w-3" />{r.error}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3 w-3" />OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${walletBalance !== null && walletBalance < total ? 'bg-destructive/10 ring-1 ring-destructive/30' : 'bg-muted/50'}`}>
              <WalletIcon className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Wallet:</span>
              <span className="font-semibold tabular-nums">SAR {walletBalance !== null ? walletBalance.toFixed(2) : '—'}</span>
              {walletBalance !== null && walletBalance < total && (
                <Button asChild size="sm" variant="outline" className="ml-2 h-7 rounded-full">
                  <Link to="/dropshipping/wallet"><Plus className="h-3 w-3" /> Top up SAR {(total - walletBalance).toFixed(2)}</Link>
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRows([])}>Clear</Button>
              <Button
                onClick={submit}
                disabled={submitting || !validRows.length || bulkExceeded || (walletBalance !== null && walletBalance < total)}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Create Order ({validRows.length} items)
              </Button>
            </div>
          </div>
          {walletBalance !== null && walletBalance < total && (
            <div className="flex items-start gap-2 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Wallet balance is too low. Top up to place this order.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
