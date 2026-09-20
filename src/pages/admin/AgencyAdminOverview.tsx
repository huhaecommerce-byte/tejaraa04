import { useEffect, useState } from 'react';
import { Link } from '@/lib/router-compat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { sar } from '@/hooks/useAgency';
import { Handshake, Wallet, Coins, Users } from 'lucide-react';

interface Stats {
  total: number;
  approved: number;
  pending: number;
  clients: number;
  pendingPayouts: number;
  pendingPayoutAmount: number;
  lifetime: number;
}

const empty: Stats = {
  total: 0, approved: 0, pending: 0, clients: 0,
  pendingPayouts: 0, pendingPayoutAmount: 0, lifetime: 0,
};

export default function AgencyAdminOverview() {
  const [stats, setStats] = useState<Stats>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [profiles, clients, payouts, commissions] = await Promise.all([
        supabase.from('agency_profiles').select('id, status'),
        supabase.from('agency_clients').select('id', { count: 'exact', head: true }),
        supabase.from('agency_payout_requests').select('amount_sar').eq('status', 'pending'),
        supabase.from('agency_commissions').select('amount_sar'),
      ]);
      if (cancelled) return;
      const rows = (profiles.data as { status: string }[] | null) || [];
      const payoutRows = (payouts.data as { amount_sar: number }[] | null) || [];
      const commissionRows = (commissions.data as { amount_sar: number }[] | null) || [];
      setStats({
        total: rows.length,
        approved: rows.filter((r) => r.status === 'approved').length,
        pending: rows.filter((r) => r.status === 'pending').length,
        clients: clients.count ?? 0,
        pendingPayouts: payoutRows.length,
        pendingPayoutAmount: payoutRows.reduce((s, r) => s + Number(r.amount_sar || 0), 0),
        lifetime: commissionRows.reduce((s, r) => s + Number(r.amount_sar || 0), 0),
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const cards = [
    { label: 'Active partners', value: String(stats.approved), hint: `${stats.total} total · ${stats.pending} awaiting review`, icon: Handshake },
    { label: 'Linked dropshippers', value: String(stats.clients), hint: 'Sellers signed up with a partner code', icon: Users },
    { label: 'Commission earned', value: sar(stats.lifetime), hint: 'Lifetime across all partners', icon: Coins },
    { label: 'Payouts to review', value: String(stats.pendingPayouts), hint: `${sar(stats.pendingPayoutAmount)} requested`, icon: Wallet },
  ];

  return (
    <>
      <PageHeader
        title="Agency programme"
        highlight="programme"
        subtitle="Everything about agencies and virtual assistants in one place — partners, commissions, payouts and rules."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <c.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{loading ? '—' : c.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-3 p-5">
          <Button asChild><Link to="/agency-admin/partners">Review agencies</Link></Button>
          <Button asChild variant="outline"><Link to="/agency-admin/payouts">Payout requests</Link></Button>
          <Button asChild variant="outline"><Link to="/agency-admin/settings">Programme settings</Link></Button>
        </CardContent>
      </Card>
    </>
  );
}
