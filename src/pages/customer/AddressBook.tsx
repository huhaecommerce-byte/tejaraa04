import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/LoadingSkeleton';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { MapPin, Plus, Pencil, Trash2, Star, Building2, Warehouse, Home, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import UpgradePrompt from '@/components/UpgradePrompt';

export type ShippingAddress = {
  id: string;
  user_id: string;
  label: string;
  type: 'fba' | 'fbn' | 'own' | 'other' | string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  notes: string | null;
  is_default: boolean;
};

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  fba: { label: 'FBA Warehouse', icon: Warehouse, color: 'text-amber-600 bg-amber-100' },
  fbn: { label: 'FBN / Noon', icon: Building2, color: 'text-blue-600 bg-blue-100' },
  own: { label: 'Own Warehouse', icon: Home, color: 'text-emerald-600 bg-emerald-100' },
  other: { label: 'Other', icon: Truck, color: 'text-slate-600 bg-slate-100' },
};

const emptyForm: Partial<ShippingAddress> = {
  label: '', type: 'own', recipient_name: '', phone: '',
  address_line1: '', address_line2: '', city: '', region: '',
  postal_code: '', country: 'Saudi Arabia', notes: '', is_default: false,
};

interface AddressBookProps {
  mode?: 'shopper' | 'dropshipper';
}

const AddressBook = ({ mode = 'dropshipper' }: AddressBookProps) => {
  const { user } = useAuth();
  const shopper = mode === 'shopper';
  const { numericLimit, planName } = useCurrentPlan();
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingAddress | null>(null);
  const [form, setForm] = useState<Partial<ShippingAddress>>(emptyForm);
  const [saving, setSaving] = useState(false);

  const addrLimit = numericLimit('addresses_max');
  const limitReached = addrLimit > 0 && addrLimit !== Infinity && addresses.length >= addrLimit;

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    setAddresses((data || []) as ShippingAddress[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const openNew = () => {
    if (limitReached) {
      toast.error(`You've reached your ${planName} plan limit of ${addrLimit} addresses. Upgrade for more.`);
      return;
    }
    setEditing(null); setForm(emptyForm); setOpen(true);
  };
  const openEdit = (a: ShippingAddress) => { setEditing(a); setForm(a); setOpen(true); };

  const handleSave = async () => {
    if (!user?.id) return;
    if (!form.label?.trim() || !form.address_line1?.trim() || !form.city?.trim()) {
      toast.error('Label, address line 1 and city are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from('shipping_addresses').update({
          label: form.label, type: form.type, recipient_name: form.recipient_name || '',
          phone: form.phone || '', address_line1: form.address_line1,
          address_line2: form.address_line2 || '', city: form.city, region: form.region || '',
          postal_code: form.postal_code || '', country: form.country || 'Saudi Arabia',
          notes: form.notes || null, is_default: !!form.is_default,
        }).eq('id', editing.id);
        if (error) throw error;
        toast.success('Address updated');
      } else {
        const { error } = await supabase.from('shipping_addresses').insert({
          user_id: user.id,
          label: form.label!, type: form.type || 'own',
          recipient_name: form.recipient_name || '',
          phone: form.phone || '',
          address_line1: form.address_line1!,
          address_line2: form.address_line2 || '',
          city: form.city!, region: form.region || '',
          postal_code: form.postal_code || '',
          country: form.country || 'Saudi Arabia',
          notes: form.notes || null,
          is_default: !!form.is_default,
        });
        if (error) throw error;
        toast.success('Address added');
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: ShippingAddress) => {
    if (!confirm(`Delete "${a.label}"?`)) return;
    const { error } = await supabase.from('shipping_addresses').delete().eq('id', a.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Address deleted');
    await load();
  };

  const setDefault = async (a: ShippingAddress) => {
    const { error } = await supabase.from('shipping_addresses').update({ is_default: true }).eq('id', a.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Default address updated');
    await load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved addresses"
        highlight="addresses"
        subtitle={shopper ? 'Manage your delivery addresses for faster checkout.' : 'Save warehouses and delivery destinations for one-tap ordering.'}
        guide={
          shopper
            ? undefined
            : {
                chip: 'Saving destinations',
                intro: 'Pre-save destinations to speed up checkout.',
                steps: [
                  { title: 'Add', description: 'Save warehouse, FBA centre, or your home address.' },
                  { title: 'Default', description: 'Mark one address as the primary destination.' },
                  { title: 'Reuse', description: 'Pick saved destinations with one tap at checkout.' },
                ],
              }
        }
        actions={<Button onClick={openNew} className="rounded-full" disabled={limitReached}><Plus className="h-4 w-4 mr-1" /> Add address</Button>}
      />

      {!shopper && addrLimit > 0 && addrLimit !== Infinity && (
        <div className="flex justify-end">
          <UpgradePrompt
            variant="chip"
            usage={addresses.length}
            limit={addrLimit}
            limitLabel="addresses"
            message={limitReached ? `Limit reached on ${planName}` : undefined}
          />
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-8 w-8 text-muted-foreground" />}
          title="No saved addresses"
          description={
            shopper
              ? 'Add your home or work address to speed up checkout.'
              : 'Add your FBA warehouses, FBN locations, or your own warehouse to speed up checkout.'
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {addresses.map((a) => {
            const meta = TYPE_META[a.type] || TYPE_META.other;
            const Icon = meta.icon;
            return (
              <Card key={a.id} className={`relative overflow-hidden bg-card/80 backdrop-blur-sm border-border/60 ${a.is_default ? 'ring-2 ring-primary/30' : ''}`}>
                {a.is_default && <div className="h-1 bg-gradient-to-r from-primary to-emerald-600" />}
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.color}`}><Icon className="h-4 w-4" /></span>
                      <div className="min-w-0">
                        <p className="font-semibold truncate flex items-center gap-1.5">{a.label}{a.is_default && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}</p>
                        <Badge variant="outline" className="text-[10px] mt-0.5">{meta.label}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(a)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    {a.recipient_name && <p className="text-foreground font-medium">{a.recipient_name}</p>}
                    <p>{a.address_line1}</p>
                    {a.address_line2 && <p>{a.address_line2}</p>}
                    <p>{[a.city, a.region, a.postal_code].filter(Boolean).join(', ')}</p>
                    <p>{a.country}</p>
                    {a.phone && <p className="text-xs">📞 {a.phone}</p>}
                  </div>
                  {!a.is_default && (
                    <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setDefault(a)}>
                      <Star className="h-3.5 w-3.5 mr-1" /> Set as default
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit address' : 'New address'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Label *</Label>
                <Input value={form.label || ''} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. FBA Riyadh" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type as string} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {!shopper && <SelectItem value="fba">FBA Warehouse</SelectItem>}
                    {!shopper && <SelectItem value="fbn">FBN / Noon</SelectItem>}
                    <SelectItem value="own">Own Warehouse</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Recipient name</Label>
                <Input value={form.recipient_name || ''} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+966..." />
              </div>
            </div>
            <div>
              <Label>Address line 1 *</Label>
              <Input value={form.address_line1 || ''} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} placeholder="Street address" />
            </div>
            <div>
              <Label>Address line 2</Label>
              <Input value={form.address_line2 || ''} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} placeholder="Apt, suite, building..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>City *</Label>
                <Input value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label>Region</Label>
                <Input value={form.region || ''} onChange={(e) => setForm({ ...form, region: e.target.value })} />
              </div>
              <div>
                <Label>Postal code</Label>
                <Input value={form.postal_code || ''} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Country</Label>
              <Input value={form.country || ''} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Gate code, delivery instructions..." />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
              Set as default address
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save address'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddressBook;
