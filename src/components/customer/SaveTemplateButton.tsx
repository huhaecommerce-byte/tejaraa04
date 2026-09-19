import { useState } from 'react';
import { BookMarked, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Props {
  type: string;
  destination: string;
  products: any[];
  notes?: string;
}

export function SaveTemplateButton({ type, destination, products, notes }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('order_templates' as any).insert({
      user_id: user.id,
      name: name.trim(),
      type,
      destination,
      products,
      notes: notes || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Template saved');
    setOpen(false);
    setName('');
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setOpen(true)} disabled={!products.length}>
        <BookMarked className="h-3.5 w-3.5 mr-1.5" /> Save as Template
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Order as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Template name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weekly Riyadh restock" autoFocus />
            </div>
            <p className="text-xs text-muted-foreground">Saves the current product, quantity, and destination so you can re-place this order in one click later.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!name.trim() || saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
