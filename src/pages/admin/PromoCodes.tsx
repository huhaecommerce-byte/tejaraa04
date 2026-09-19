import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Tag, Percent, DollarSign, Loader2 } from 'lucide-react';

type PromoCode = {
  id: string;
  code: string;
  description: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_sar: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
};

const empty = (): Partial<PromoCode> => ({
  code: '',
  description: '',
  discount_type: 'percent',
  discount_value: 10,
  min_order_sar: 0,
  max_uses: null,
  valid_until: null,
  is_active: true,
});

export default function PromoCodesAdmin() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<PromoCode>>(empty());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
    setCodes((data || []) as PromoCode[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(empty()); setOpen(true); };
  const openEdit = (c: PromoCode) => { setEditing({ ...c }); setOpen(true); };

  const save = async () => {
    if (!editing.code?.trim()) {
      toast({ title: 'Code is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload: any = {
      code: editing.code!.trim().toUpperCase(),
      description: editing.description || '',
      discount_type: editing.discount_type || 'percent',
      discount_value: Number(editing.discount_value) || 0,
      min_order_sar: Number(editing.min_order_sar) || 0,
      max_uses: editing.max_uses ? Number(editing.max_uses) : null,
      valid_until: editing.valid_until || null,
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from('promo_codes').update(payload).eq('id', editing.id)
      : await supabase.from('promo_codes').insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editing.id ? 'Code updated' : 'Code created' });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this promo code?')) return;
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return;
    }
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Tag className="h-6 w-6 text-primary" /> Promo Codes</h1>
          <p className="text-sm text-muted-foreground">Create discount codes for buyers to apply at checkout.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New Code</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Codes</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-40 w-full" /> : codes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No promo codes yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map(c => (
                  <TableRow key={c.id}>
                    <TableCell><span className="font-mono font-semibold">{c.code}</span><div className="text-xs text-muted-foreground">{c.description}</div></TableCell>
                    <TableCell>
                      {c.discount_type === 'percent' ? (
                        <span className="flex items-center gap-1"><Percent className="h-3 w-3" /> {c.discount_value}%</span>
                      ) : (
                        <span className="flex items-center gap-1">SAR {c.discount_value.toFixed(2)}</span>
                      )}
                    </TableCell>
                    <TableCell>SAR {c.min_order_sar}</TableCell>
                    <TableCell>{c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</TableCell>
                    <TableCell className="text-xs">{c.valid_until ? new Date(c.valid_until).toLocaleDateString() : '∞'}</TableCell>
                    <TableCell><Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Active' : 'Disabled'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Edit Promo Code' : 'New Promo Code'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Code *</Label>
                <Input value={editing.code || ''} onChange={e => setEditing({ ...editing, code: e.target.value })} placeholder="WELCOME10" className="mt-1 font-mono uppercase" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={editing.discount_type} onValueChange={(v: any) => setEditing({ ...editing, discount_type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percent (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (SAR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="e.g. New customer welcome discount" className="mt-1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Discount Value</Label>
                <Input type="number" step="0.01" value={editing.discount_value ?? 0} onChange={e => setEditing({ ...editing, discount_value: parseFloat(e.target.value) || 0 })} className="mt-1" />
              </div>
              <div>
                <Label>Min Order (SAR)</Label>
                <Input type="number" step="0.01" value={editing.min_order_sar ?? 0} onChange={e => setEditing({ ...editing, min_order_sar: parseFloat(e.target.value) || 0 })} className="mt-1" />
              </div>
              <div>
                <Label>Max Uses</Label>
                <Input type="number" value={editing.max_uses ?? ''} onChange={e => setEditing({ ...editing, max_uses: e.target.value ? parseInt(e.target.value) : null })} placeholder="∞" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Valid Until (optional)</Label>
              <Input type="date" value={editing.valid_until ? editing.valid_until.split('T')[0] : ''} onChange={e => setEditing({ ...editing, valid_until: e.target.value || null })} className="mt-1" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Disabled codes cannot be applied at checkout.</p>
              </div>
              <Switch checked={editing.is_active ?? true} onCheckedChange={v => setEditing({ ...editing, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing.id ? 'Save Changes' : 'Create Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
