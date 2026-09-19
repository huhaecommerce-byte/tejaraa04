import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Upload, X, Loader2 } from 'lucide-react';

const REASONS = [
  'Damaged in transit',
  'Wrong item received',
  'Defective product',
  'Not as described',
  'Missing items',
  'Other',
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string;
  orderTotal: number;
  onSubmitted?: () => void;
}

export function RequestReturnDialog({ open, onOpenChange, orderId, orderTotal, onSubmitted }: Props) {
  const { user } = useAuth();
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [refundAmount, setRefundAmount] = useState(orderTotal);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files?.length || !user?.id) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files).slice(0, 5 - photos.length)) {
      const path = `${user.id}/${orderId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('return-photos').upload(path, file);
      if (error) { toast.error(error.message); continue; }
      // Private bucket: store the object path, viewers resolve a signed URL.
      uploaded.push(path);
    }
    setPhotos(prev => [...prev, ...uploaded]);
    setUploading(false);
  };

  const submit = async () => {
    if (!user?.id) return;
    if (!description.trim()) { toast.error('Please describe the issue'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('return_requests').insert({
      user_id: user.id,
      order_id: orderId,
      reason,
      description: description.trim(),
      photos,
      refund_amount: refundAmount,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Return request submitted');
    onOpenChange(false);
    setDescription(''); setPhotos([]); setReason(REASONS[0]);
    onSubmitted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Request a return</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Describe the issue</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell us what happened..." rows={4} />
          </div>
          <div className="space-y-2">
            <Label>Requested refund (SAR)</Label>
            <Input type="number" min={0} max={orderTotal} value={refundAmount} onChange={e => setRefundAmount(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">Order total: SAR {orderTotal.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            <Label>Photos (up to 5)</Label>
            <div className="flex flex-wrap gap-2">
              {photos.map(p => (
                <div key={p} className="relative">
                  <img src={p} alt="" className="h-16 w-16 rounded object-cover border" />
                  <button type="button" onClick={() => setPhotos(prev => prev.filter(x => x !== p))} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="h-16 w-16 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-muted/40">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => upload(e.target.files)} />
                </label>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Submit return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
