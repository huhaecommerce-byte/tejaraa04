import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { sar } from '@/hooks/useAgency';
import { useLocale } from '@/i18n/LocaleProvider';

interface Row {
  id: string;
  order_ref: string | null;
  order_total_sar: number;
  profit_base_sar: number;
  rate_percent: number;
  amount_sar: number;
  status: string;
  created_at: string;
  reversal_reason: string | null;
}

const tone: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  paid: 'bg-blue-100 text-blue-800',
  reversed: 'bg-rose-100 text-rose-800',
};

export default function AgencyEarnings() {
  const { t } = useLocale();
  const label: Record<string, string> = {
    pending: t('agency.earnings.statusPending'),
    approved: t('agency.earnings.statusApproved'),
    paid: t('agency.earnings.statusPaid'),
    reversed: t('agency.earnings.statusReversed'),
  };
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('agency_commissions')
      .select('id, order_ref, order_total_sar, profit_base_sar, rate_percent, amount_sar, status, created_at, reversal_reason')
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setRows((data as Row[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <PageHeader
        title={t('agency.earnings.title')}
        highlight={t('agency.earnings.highlight')}
        subtitle={t('agency.earnings.subtitle')}
      />
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{t('agency.earnings.loading')}</p>
          ) : rows.length === 0 ? (
            <p className="p-12 text-center text-sm text-muted-foreground">{t('agency.earnings.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('agency.earnings.colDate')}</TableHead>
                    <TableHead>{t('agency.earnings.colOrder')}</TableHead>
                    <TableHead className="text-right">{t('agency.earnings.colOrderValue')}</TableHead>
                    <TableHead className="text-right">{t('agency.earnings.colProfit')}</TableHead>
                    <TableHead className="text-right">{t('agency.earnings.colRate')}</TableHead>
                    <TableHead className="text-right">{t('agency.earnings.colEarned')}</TableHead>
                    <TableHead>{t('agency.earnings.colStatus')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{r.order_ref || '—'}</TableCell>
                      <TableCell className="text-right">{sar(r.order_total_sar)}</TableCell>
                      <TableCell className="text-right">{sar(r.profit_base_sar)}</TableCell>
                      <TableCell className="text-right">{Number(r.rate_percent)}%</TableCell>
                      <TableCell className="text-right font-semibold">{sar(r.amount_sar)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={tone[r.status] || ''}>
                          {label[r.status] || r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
