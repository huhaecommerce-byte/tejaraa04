import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

const PAGE_SIZE = 15;

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
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setLoading(true);
    supabase
      .from('agency_commissions')
      .select('id, order_ref, order_total_sar, profit_base_sar, rate_percent, amount_sar, status, created_at, reversal_reason', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
      .then(({ data, count }) => {
        setRows((data as Row[]) || []);
        setTotal(count ?? 0);
        setLoading(false);
      });
  }, [page]);

  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);

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
            <>
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
              <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  {t('agency.earnings.showing', { from, to, total })}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                    {t('agency.earnings.prev')}
                  </Button>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('agency.earnings.pageOf', { page: page + 1, pages: totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    {t('agency.earnings.next')}
                    <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
