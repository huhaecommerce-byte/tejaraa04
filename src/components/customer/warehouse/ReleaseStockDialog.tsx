import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type Inv = {
  id: string;
  product_id: string;
  sku: string;
  product_name: string;
  qty_available: number;
};

export function ReleaseStockDialog({
  open, onOpenChange, inventory, onReleased,
}: { open: boolean; onOpenChange: (o: boolean) => void; inventory: Inv | null; onReleased?: () => void }) {
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const [fulfillmentType, setFulfillmentType] = useState<'fba' | 'fbn' | 'direct' | 'self-pickup'>('direct');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (open && inventory) { setQty(Math.min(1, inventory.qty_available)); setDestination(''); setNotes(''); } }, [open, inventory]);

  if (!inventory) return null;

  const submit = async () => {
    if (!user) return;
    if (qty < 1 || qty > inventory.qty_available) {
      toast({ title: 'Invalid quantity', description: `Available: ${inventory.qty_available}`, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('release_requests').insert({
      user_id: user.id,
      fulfillment_type: fulfillmentType,
      destination: destination || fulfillmentType.toUpperCase(),
      notes: notes || null,
      items: [{ inventory_id: inventory.id, product_id: inventory.product_id, sku: inventory.sku, qty }],
    });
    setSubmitting(false);
    if (error) { toast({ title: 'Failed to create release', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Release request submitted 🚀', description: 'We\'ll prepare your shipment shortly.' });
    onOpenChange(false);
    onReleased?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Release stock</DialogTitle>
          <DialogDescription>{inventory.product_name} · SKU {inventory.sku}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Quantity (max {inventory.qty_available})</Label>
            <Input type="number" min={1} max={inventory.qty_available} value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 1)} />
          </div>
          <div>
            <Label>Fulfillment type</Label>
            <Select value={fulfillmentType} onValueChange={(v: any) => setFulfillmentType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fba">Send to Amazon FBA</SelectItem>
                <SelectItem value="fbn">Send to Noon FBN</SelectItem>
                <SelectItem value="direct">Ship to end customer</SelectItem>
                <SelectItem value="self-pickup">Self pickup</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Destination / address</Label>
            <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Amazon FC RUH3, Riyadh" />
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit release'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
