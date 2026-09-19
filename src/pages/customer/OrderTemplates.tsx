import { useEffect, useState } from 'react';
import { useNavigate } from "@/lib/router-compat";
import { BookMarked, Trash2, Repeat, Package, Loader2, CalendarClock, PauseCircle, PlayCircle } from 'lucide-react';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import UpgradePrompt from '@/components/UpgradePrompt';
import { PlanFeatureChip } from '@/components/customer/PlanFeatureChip';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

const FREQ_LABEL: Record<string, string> = {
  none: 'No schedule',
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  monthly: 'Every month',
};

export default function OrderTemplates() {
  const { user } = useAuth();
  const { numericLimit, hasFeature, planName } = useCurrentPlan();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const tplLimit = numericLimit('templates_max');
  const recurringEnabled = hasFeature('recurring_orders');

  const load = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('order_templates' as any).select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const remove = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    const { error } = await supabase.from('order_templates' as any).delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Template deleted');
    load();
  };

  const reorder = async (tpl: any) => {
    if (!user) return;
    setReorderingId(tpl.id);
    try {
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('user_id', user.id).maybeSingle();
      const products = Array.isArray(tpl.products) ? tpl.products : [];
      const total = products.reduce((s: number, p: any) => s + (Number(p.unit_price) || 0) * (Number(p.quantity) || 0), 0);
      const { data: order, error } = await supabase.from('orders').insert({
        user_id: user.id,
        type: tpl.type || 'bulk',
        destination: tpl.destination || '',
        customer_name: profile?.display_name || user.email || '',
        products,
        total,
        status: 'pending',
      }).select('id').single();
      if (error) throw error;
      toast.success('Order created from template');
      navigate(`/dropshipping/orders/${order.id}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to reorder');
    } finally {
      setReorderingId(null);
    }
  };

  const updateSchedule = async (id: string, patch: { schedule_frequency?: string; schedule_active?: boolean }) => {
    const update: any = { ...patch };
    if (patch.schedule_frequency && patch.schedule_frequency === 'none') {
      update.schedule_active = false;
      update.next_run_at = null;
    }
    if (patch.schedule_frequency && patch.schedule_frequency !== 'none') {
      // reset next_run_at so trigger recomputes when activated
      update.next_run_at = null;
    }
    const { error } = await supabase.from('order_templates' as any).update(update).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Schedule updated');
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order templates"
        highlight="templates"
        subtitle="Saved orders you can re-place with one click — or schedule them to auto-create on a recurring basis."
        guide={{
          chip: 'Reuse & schedule',
          intro: 'Automate recurring restocks instead of rebuilding carts.',
          steps: [
            { title: 'Save', description: 'Turn any cart into a reusable template in one tap.' },
            { title: 'Reuse', description: 'Re-order saved baskets without searching again.' },
            { title: 'Schedule', description: 'Auto-create the order weekly or monthly on autopilot.' },
          ],
        }}
      />

      {tplLimit > 0 && tplLimit !== Infinity && (
        <div className="flex items-center justify-end gap-2">
          {!recurringEnabled && <PlanFeatureChip unlocksOn="Growth" label="Recurring orders" />}
          <UpgradePrompt
            variant="chip"
            usage={items.length}
            limit={tplLimit}
            limitLabel="templates"
            message={items.length >= tplLimit ? `Limit reached on ${planName}` : undefined}
          />
        </div>
      )}


      {loading ? (
        <div className="grid gap-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="aux-card p-12 text-center">
          <BookMarked className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-semibold">No templates yet</p>
          <p className="text-sm text-muted-foreground mt-1">Use "Save as template" on the Place Order page to create one.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map(t => {
            const products = Array.isArray(t.products) ? t.products : [];
            const total = products.reduce((s: number, p: any) => s + (Number(p.unit_price) || 0) * (Number(p.quantity) || 0), 0);
            const freq = t.schedule_frequency || 'none';
            const active = !!t.schedule_active;
            return (
              <div key={t.id} className="aux-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold truncate">{t.name}</h3>
                      <Badge variant="secondary">{t.type}</Badge>
                      {active && (
                        <Badge className="bg-primary/15 text-primary border-primary/30">
                          <CalendarClock className="h-3 w-3 mr-1" /> Scheduled
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Package className="h-3 w-3" /> {products.length} item{products.length !== 1 ? 's' : ''} · SAR {total.toFixed(2)} · {t.destination || 'No destination set'}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => reorder(t)} disabled={reorderingId === t.id}>
                      {reorderingId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Repeat className="h-3.5 w-3.5 mr-1" />}
                      Re-order
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-border/50">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Recurring schedule:</span>
                  <Select value={freq} onValueChange={(v) => updateSchedule(t.id, { schedule_frequency: v })}>
                    <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FREQ_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {freq !== 'none' && (
                    <Button
                      size="sm"
                      variant={active ? 'outline' : 'default'}
                      onClick={() => updateSchedule(t.id, { schedule_active: !active })}
                    >
                      {active ? <><PauseCircle className="h-3.5 w-3.5 mr-1" /> Pause</> : <><PlayCircle className="h-3.5 w-3.5 mr-1" /> Activate</>}
                    </Button>
                  )}
                  {active && t.next_run_at && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      Next run: {format(new Date(t.next_run_at), 'PPp')}
                    </span>
                  )}
                  {t.last_run_at && (
                    <span className="text-xs text-muted-foreground">
                      Last run: {format(new Date(t.last_run_at), 'PPp')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
