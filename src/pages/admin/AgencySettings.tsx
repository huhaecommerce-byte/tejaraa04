import { useCallback, useEffect, useState } from 'react';
import { Link } from '@/lib/router-compat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Settings {
  commission_percent: number;
  min_payout_sar: number;
  approval_days: number;
  auto_approve: boolean;
}

export default function AgencySettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [rate, setRate] = useState('');
  const [minPayout, setMinPayout] = useState('');
  const [holdDays, setHoldDays] = useState('');
  const [autoApprove, setAutoApprove] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('agency_admin_get_settings' as never);
    if (error) { toast.error(error.message); return; }
    const s = data as unknown as Settings;
    setSettings(s);
    setRate(String(s.commission_percent));
    setMinPayout(String(s.min_payout_sar));
    setHoldDays(String(s.approval_days));
    setAutoApprove(Boolean(s.auto_approve));
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.rpc('agency_admin_save_settings' as never, {
      _commission_percent: Number(rate),
      _min_payout_sar: Number(minPayout),
      _approval_days: Number(holdDays),
      _auto_approve: autoApprove,
    } as never);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Programme settings saved');
    void load();
  };

  if (!settings) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <>
      <PageHeader
        title="Agency programme settings"
        subtitle="Defaults that apply to every Agencies & VAs partner unless a custom rate is set on their profile."
        actions={
          <Button variant="outline" asChild>
            <Link to="/agency-admin/partners"><ArrowLeft className="mr-2 h-4 w-4" /> All agencies</Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="grid gap-6 p-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rate">Default commission rate (% of Tejaraa profit)</Label>
            <Input id="rate" type="number" min={0} max={100} step="0.5" value={rate} onChange={(e) => setRate(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Applies to partners without a custom rate on their profile.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="min">Minimum payout (SAR)</Label>
            <Input id="min" type="number" min={0} step="1" value={minPayout} onChange={(e) => setMinPayout(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Partners can request a payout once their available balance reaches this amount.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="days">Payout hold period (days)</Label>
            <Input id="days" type="number" min={0} max={90} step="1" value={holdDays} onChange={(e) => setHoldDays(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Commission becomes available this many days after the order is delivered (return window).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="auto">Auto-approve new signups</Label>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Switch id="auto" checked={autoApprove} onCheckedChange={setAutoApprove} />
              <span className="text-sm text-muted-foreground">
                {autoApprove
                  ? 'New partners are activated immediately after signup.'
                  : 'New partners wait for manual approval in the Agencies list.'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <Button onClick={save} disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save settings
        </Button>
      </div>
    </>
  );
}
