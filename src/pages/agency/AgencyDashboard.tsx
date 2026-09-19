import { Link } from '@/lib/router-compat';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAgency, sar, num, inviteLink } from '@/hooks/useAgency';
import { Coins, Users, Wallet, Clock, Copy, ArrowRight, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface Row {
  id: string;
  order_ref: string | null;
  amount_sar: number;
  status: string;
  created_at: string;
}

const statusTone: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  paid: 'bg-blue-100 text-blue-800',
  reversed: 'bg-rose-100 text-rose-800',
};

export default function AgencyDashboard() {
  const { agency } = useAgency();
  const [recent, setRecent] = useState<Row[]>([]);

  useEffect(() => {
    supabase
      .from('agency_commissions')
      .select('id, order_ref, amount_sar, status, created_at')
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => setRecent((data as Row[]) || []));
  }, []);

  const b = agency?.balance;
  const code = agency?.code || '';

  const stats = [
    { label: 'Available to withdraw', value: sar(b?.available), icon: Wallet, tone: 'text-emerald-600' },
    { label: 'Pending (awaiting delivery)', value: sar(b?.pending), icon: Clock, tone: 'text-amber-600' },
    { label: 'Earned this month', value: sar(b?.this_month), icon: Coins, tone: 'text-primary' },
    { label: 'Lifetime earnings', value: sar(b?.lifetime), icon: Coins, tone: 'text-foreground' },
    { label: 'Dropshippers onboarded', value: String(num(b?.clients)), icon: Users, tone: 'text-foreground' },
    { label: 'Orders earning', value: String(num(b?.orders)), icon: ShoppingCart, tone: 'text-foreground' },
  ];

  return (
    <>
      <PageHeader
        title="Partner dashboard"
        highlight="dashboard"
        subtitle={`${agency?.company || 'Your agency'} · ${num(agency?.rate)}% of Tejaraa profit on every order`}
        actions={<Button asChild><Link to="/agency/portal/payouts">Request payout <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <s.icon className="h-4 w-4" /> {s.label}
              </div>
              <div className={`mt-2 text-2xl font-black ${s.tone}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your invite link</div>
            <div className="mt-1 break-all font-mono text-sm">{code ? inviteLink(code) : '—'}</div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(inviteLink(code));
                toast.success('Invite link copied');
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
            <Button asChild variant="secondary"><Link to="/agency/portal/link">Share kit</Link></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Recent earnings</h2>
            <Link to="/agency/portal/earnings" className="text-sm text-primary underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No commission yet. Share your invite link to onboard your first dropshipper.
            </p>
          ) : (
            <div className="divide-y">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <div className="text-sm font-medium">{r.order_ref || 'Order'}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusTone[r.status] || ''} variant="secondary">{r.status}</Badge>
                    <span className="font-bold">{sar(r.amount_sar)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
