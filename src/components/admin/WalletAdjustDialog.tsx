import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customerId: string;
  customerName?: string;
  currentBalance: number;
  onSaved?: () => void;
}

export function WalletAdjustDialog({ open, onOpenChange, customerId, customerName, currentBalance, onSaved }: Props) {
  const { user } = useAuth();
  const [type, setType] = useState<'credit' | 'debit' | 'refund'>('credit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => { setType('credit'); setAmount(''); setDescription(''); };

  const handleSubmit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (!description.trim()) { toast.error('Add a reason for the adjustment'); return; }
    if (!user?.id) return;

    setSaving(true);
    const { data, error } = await supabase.rpc('wallet_admin_adjust', {
      _user_id: customerId,
      _amount: amt,
      _type: type,
      _description: `[Admin] ${description.trim()}`,
    });
    setSaving(false);
    const result = data as any;
    if (error || !result?.ok) {
      const msg = result?.error === 'would_go_negative'
        ? `Would result in a negative balance (current: SAR ${Number(result.balance ?? 0).toFixed(2)})`
        : (error?.message || result?.error || 'Adjustment failed');
      toast.error(msg);
      return;
    }
    toast.success(`${type === 'credit' ? 'Credited' : type === 'debit' ? 'Debited' : 'Refunded'} SAR ${amt.toFixed(2)}`);
    reset();
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust wallet</DialogTitle>
          <p className="text-xs text-muted-foreground">{customerName} · current balance <span className="font-semibold text-foreground">SAR {currentBalance.toFixed(2)}</span></p>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Adjustment type</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as any)} className="grid grid-cols-3 gap-2 mt-1.5">
              {(['credit', 'debit', 'refund'] as const).map((t) => (
                <label key={t} className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer text-sm capitalize transition-colors ${type === t ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <RadioGroupItem value={t} id={t} />
                  {t}
                </label>
              ))}
            </RadioGroup>
          </div>
          <div>
            <Label htmlFor="amt">Amount (SAR)</Label>
            <Input id="amt" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="desc">Reason / note</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Refund for damaged order #12345" rows={3} className="mt-1" />
          </div>
          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            New balance will be <span className="font-bold text-foreground">SAR {(currentBalance + (type === 'debit' ? -1 : 1) * (Number(amount) || 0)).toFixed(2)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Apply adjustment'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
