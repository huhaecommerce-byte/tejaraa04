import { useEffect, useState } from 'react';
import { CatalogActionDialog, type ExportFormat } from './CatalogActionDialog';
import { saveRecentExport } from './RecentExports';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AggregatedCount } from '@/components/customer/CategorySidebar';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  aggregatedCounts?: AggregatedCount[];
  initialSearch?: string;
  initialSource?: 'all' | 'local' | 'global';
}

function startOfMonthIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export function CatalogExportDialog({ open, onOpenChange, aggregatedCounts, initialSearch, initialSource }: Props) {
  const { user } = useAuth();
  const { getLimit, numericLimit, isLoading: planLoading } = useCurrentPlan();
  const access = (getLimit('catalog_export') || 'no').toLowerCase();
  const accessState: 'blocked' | 'limited' | 'unlimited' =
    access === 'unlimited' ? 'unlimited' : (access === 'no' || access === '' || access === '0') ? 'blocked' : 'limited';
  // A configured monthly row quota always applies, even when access is "yes"/"unlimited".
  const quota = accessState === 'blocked' ? 0 : numericLimit('catalog_export_qty_monthly');

  const [used, setUsed] = useState(0);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user?.id || accessState === 'blocked' || !isFinite(quota)) {
      setLoadingUsage(false);
      return;
    }
    setLoadingUsage(true);
    supabase
      .from('catalog_usage_log')
      .select('count')
      .eq('user_id', user.id)
      .eq('action', 'csv_export')
      .gte('created_at', startOfMonthIso())
      .then(({ data }) => {
        setUsed((data ?? []).reduce((s: number, r: any) => s + (Number(r.count) || 0), 0));
        setLoadingUsage(false);
      });
  }, [open, user?.id, accessState, quota]);

  const handleSubmit = async (params: { limit: number; format: ExportFormat; source: 'all' | 'local' | 'global'; search: string; categories: string[]; allImages: boolean }) => {
    if (!user?.id) {
      toast.error('Please sign in.');
      return;
    }
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const url = `/api/fn/catalog-export`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          format: params.format,
          limit: params.limit,
          source: params.source,
          search: params.search,
          categories: params.categories,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error || 'Export failed');
        return;
      }

      const headerCount = Number(res.headers.get('X-Exported-Count') || 0);
      const newUsed = Number(res.headers.get('X-Quota-Used') || 0);
      const blob = await res.blob();
      const ext = params.format === 'xlsx' ? 'xlsx' : 'csv';
      const filename = `tejaraa-catalog-${new Date().toISOString().slice(0, 10)}.${ext}`;

      // Fallback: if header missing/0 (e.g. CORS not exposing it), count CSV rows from the blob
      let exported = headerCount;
      if (!exported && params.format === 'csv') {
        try {
          const text = await blob.text();
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          exported = Math.max(0, lines.length - 1); // minus header row
        } catch {}
      }

      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);

      // Save to recent exports for re-download
      await saveRecentExport({
        filename,
        format: params.format,
        rows: exported,
        size: blob.size,
        blob,
      });

      if (newUsed) setUsed(newUsed);
      toast.success(`Exported ${exported.toLocaleString()} products.`);
    } catch (e: any) {
      toast.error(e?.message || 'Export failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CatalogActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Export catalog"
      description="Download products as CSV or Excel — includes name, SKU, prices, categories, and image URLs. Filter by category, source, and quantity."
      accessState={accessState}
      used={used}
      quota={quota}
      loading={submitting}
      loadingUsage={loadingUsage || planLoading}
      aggregatedCounts={aggregatedCounts}
      initialSearch={initialSearch}
      initialSource={initialSource}
      showFormat
      submitLabel="Export"
      unitName="rows"
      onSubmit={handleSubmit}
    />
  );
}
