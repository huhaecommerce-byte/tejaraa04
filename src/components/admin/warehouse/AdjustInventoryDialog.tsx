import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type Inv = { id: string; product_name: string; sku: string; qty_on_hand: number };

export function AdjustInventoryDialog({
  open, onOpenChange, inventory, onAdjusted,
}: { open: boolean; onOpenChange: (o: boolean) => void; inventory: Inv | null; onAdjusted?: () => void }) {
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState<'damaged' | 'lost' | 'found' | 'reconciliation'>('reconciliation');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (open) { setDelta(0); setReason('reconciliation'); setNote(''); } }, [open]);

  if (!inventory) return null;

  const submit = async () => {
    if (delta === 0) { toast({ title: 'Enter a non-zero adjustment', variant: 'destructive' }); return; }
    setSubmitting(true);
    const { error } = await supabase.rpc('admin_adjust_inventory', {
      _inventory_id: inventory.id,
      _qty_change: delta,
      _reason: `${reason}${note ? ' — ' + note : ''}`,
    });
    setSubmitting(false);
    if (error) { toast({ title: 'Adjustment failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Inventory adjusted' });
    onOpenChange(false);
    onAdjusted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust inventory</DialogTitle>
          <DialogDescription>{inventory.product_name} · current on-hand: {inventory.qty_on_hand}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Quantity change (use negative to subtract)</Label>
            <Input type="number" value={delta} onChange={(e) => setDelta(parseInt(e.target.value) || 0)} />
            <p className="text-xs text-muted-foreground mt-1">New on-hand will be: {Math.max(inventory.qty_on_hand + delta, 0)}</p>
          </div>
          <div>
            <Label>Reason</Label>
            <Select value={reason} onValueChange={(v: any) => setReason(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="found">Found</SelectItem>
                <SelectItem value="reconciliation">Reconciliation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? 'Saving…' : 'Apply adjustment'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
