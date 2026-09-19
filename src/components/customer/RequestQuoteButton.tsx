import { useState } from 'react';
import { useNavigate } from "@/lib/router-compat";
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { useMonthlyUsage } from '@/hooks/useMonthlyUsage';

export function RequestQuoteButton({ productId, productName, defaultPrice, compact = false, className }: { productId: string; productName: string; defaultPrice?: number; compact?: boolean; className?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { numericLimit, isUnlimited, planName } = useCurrentPlan();
  const { used } = useMonthlyUsage('quote_requests');
  const limit = numericLimit('quote_requests_monthly');
  const unlimited = isUnlimited('quote_requests_monthly');
  const exceeded = !unlimited && limit > 0 && used >= limit;
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ quantity: '100', target_price_sar: defaultPrice ? String(defaultPrice) : '', destination: '', notes: '' });

  const submit = async () => {
    if (!user?.id) {
      navigate('/login');
      return;
    }
    if (exceeded) {
      toast.error(`Monthly quote limit reached (${limit}). Upgrade your ${planName} plan for more quotes.`);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('quote_requests').insert({
      user_id: user.id,
      product_id: productId,
      quantity: Number(form.quantity) || 1,
      target_price_sar: Number(form.target_price_sar) || 0,
      destination: form.destination.trim(),
      notes: form.notes.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Quote request sent! Our team will respond shortly.');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button variant="outline" size="sm" className={`h-11 px-3 rounded-full text-xs font-semibold border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 touch-manipulation flex-shrink-0 ${className || ''}`}>
            <FileText className="h-4 w-4 mr-1" /> Quote
          </Button>
        ) : (
          <Button variant="outline" className="border-emerald-600/40 text-emerald-700 hover:bg-emerald-50">
            <FileText className="h-4 w-4 mr-2" /> Request Bulk Quote
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk quote for {productName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantity *</Label>
              <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <Label>Target price/unit (SAR)</Label>
              <Input type="number" step="0.01" value={form.target_price_sar} onChange={e => setForm({ ...form, target_price_sar: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Destination</Label>
            <Input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="FBA Riyadh / Own warehouse" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Packaging, delivery timeline, special requirements..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>Send Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
