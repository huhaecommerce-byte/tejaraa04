import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { sar } from '@/hooks/useAgency';
import { Users } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';

interface ClientRow {
  client_user_id: string;
  display_name: string;
  email_masked: string | null;
  joined_at: string;
  orders: number;
  earned: number;
}

export default function AgencyClients() {
  const { t } = useLocale();
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc('agency_list_clients' as never).then(({ data }) => {
      setRows((data as unknown as ClientRow[]) || []);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <PageHeader
        title={t('agency.clients.title')}
        highlight={t('agency.clients.highlight')}
        subtitle={t('agency.clients.subtitle')}
      />
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{t('agency.clients.loading')}</p>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t('agency.clients.empty')}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('agency.clients.colDropshipper')}</TableHead>
                  <TableHead>{t('agency.clients.colJoined')}</TableHead>
                  <TableHead className="text-right">{t('agency.clients.colOrders')}</TableHead>
                  <TableHead className="text-right">{t('agency.clients.colEarned')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.client_user_id}>
                    <TableCell>
                      <div className="font-medium">{r.display_name}</div>
                      <div className="text-xs text-muted-foreground">{r.email_masked || '—'}</div>
                    </TableCell>
                    <TableCell>{new Date(r.joined_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{r.orders}</TableCell>
                    <TableCell className="text-right font-semibold">{sar(r.earned)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
