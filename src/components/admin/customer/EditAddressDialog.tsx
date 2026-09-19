import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AdminAddress = {
  id?: string;
  user_id?: string;
  label?: string;
  type?: string;
  recipient_name?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
  notes?: string | null;
  is_default?: boolean;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customerId: string;
  address: AdminAddress | null;
  onSaved?: () => void;
}

const empty: AdminAddress = {
  label: '', type: 'own', recipient_name: '', phone: '',
  address_line1: '', address_line2: '', city: '', region: '',
  postal_code: '', country: 'Saudi Arabia', notes: '', is_default: false,
};

export function EditAddressDialog({ open, onOpenChange, customerId, address, onSaved }: Props) {
  const [form, setForm] = useState<AdminAddress>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(address ? { ...empty, ...address } : empty);
  }, [open, address]);

  const set = (k: keyof AdminAddress, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.recipient_name?.trim() || !form.address_line1?.trim() || !form.city?.trim() || !form.phone?.trim()) {
      toast.error('Recipient, phone, line 1 and city are required');
      return;
    }
    setSaving(true);
    const payload = {
      user_id: customerId,
      label: form.label || '',
      type: form.type || 'own',
      recipient_name: form.recipient_name,
      phone: form.phone,
      address_line1: form.address_line1,
      address_line2: form.address_line2 || '',
      city: form.city,
      region: form.region || '',
      postal_code: form.postal_code || '',
      country: form.country || 'Saudi Arabia',
      notes: form.notes || null,
      is_default: !!form.is_default,
    };
    const res = address?.id
      ? await supabase.from('shipping_addresses').update(payload).eq('id', address.id)
      : await supabase.from('shipping_addresses').insert(payload);
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(address?.id ? 'Address updated' : 'Address added');
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{address?.id ? 'Edit address' : 'Add address'}</DialogTitle>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Label</Label>
            <Input value={form.label || ''} onChange={(e) => set('label', e.target.value)} placeholder="e.g. Riyadh HQ" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.type || 'own'} onValueChange={(v) => set('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="own">Own warehouse</SelectItem>
                <SelectItem value="fba">FBA warehouse</SelectItem>
                <SelectItem value="fbn">FBN / Noon</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Recipient name</Label>
            <Input value={form.recipient_name || ''} onChange={(e) => set('recipient_name', e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Address line 1</Label>
            <Input value={form.address_line1 || ''} onChange={(e) => set('address_line1', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Address line 2</Label>
            <Input value={form.address_line2 || ''} onChange={(e) => set('address_line2', e.target.value)} />
          </div>
          <div>
            <Label>City</Label>
            <Input value={form.city || ''} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div>
            <Label>Region</Label>
            <Input value={form.region || ''} onChange={(e) => set('region', e.target.value)} />
          </div>
          <div>
            <Label>Postal code</Label>
            <Input value={form.postal_code || ''} onChange={(e) => set('postal_code', e.target.value)} />
          </div>
          <div>
            <Label>Country</Label>
            <Input value={form.country || ''} onChange={(e) => set('country', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={2} />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3 rounded-lg border p-3">
            <Switch checked={!!form.is_default} onCheckedChange={(v) => set('is_default', v)} />
            <div>
              <p className="text-sm font-medium">Default address</p>
              <p className="text-xs text-muted-foreground">Used by default for new shipments.</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save address'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
