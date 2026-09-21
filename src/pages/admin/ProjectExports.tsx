import { useCallback, useEffect, useState } from 'react';
import { Download, FileArchive, History, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { PROJECT_EXPORTS, formatBytes, type ProjectExportEntry } from '@/data/projectExports';
import { toast } from 'sonner';

interface DownloadRow {
  id: string;
  export_key: string;
  file_name: string;
  size_bytes: number | null;
  downloaded_by_email: string | null;
  downloaded_at: string;
}

const PAGE_SIZE = 15;

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

const ProjectExportsAdmin = () => {
  const [history, setHistory] = useState<DownloadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const { data, count, error } = await supabase
      .from('project_export_downloads')
      .select('id, export_key, file_name, size_bytes, downloaded_by_email, downloaded_at', { count: 'exact' })
      .order('downloaded_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      toast.error('Could not load the download history');
    } else {
      setHistory((data ?? []) as DownloadRow[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleDownload = async (entry: ProjectExportEntry) => {
    setBusyKey(entry.key);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (user) {
        await supabase.from('project_export_downloads').insert({
          export_key: entry.key,
          file_name: entry.fileName,
          size_bytes: entry.sizeBytes,
          downloaded_by: user.id,
          downloaded_by_email: user.email ?? null,
        });
      }
      const link = document.createElement('a');
      link.href = entry.url;
      link.download = entry.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Downloading ${entry.fileName}`);
      void loadHistory();
    } finally {
      setBusyKey(null);
    }
  };

  const downloadsByKey = history.reduce<Record<string, number>>((acc, row) => {
    acc[row.export_key] = (acc[row.export_key] ?? 0) + 1;
    return acc;
  }, {});

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project exports"
        highlight="exports"
        subtitle="Download the full project archive and review who downloaded it and when"
      />

      <div className="grid gap-4">
        {PROJECT_EXPORTS.map((entry) => (
          <Card key={entry.key}>
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-4">
                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
                  <FileArchive className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{entry.fileName}</p>
                    {entry.latest && <Badge>Latest</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{entry.notes}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.label} · {formatBytes(entry.sizeBytes)} · created {formatDate(entry.createdAt)}
                    {downloadsByKey[entry.key] ? ` · ${downloadsByKey[entry.key]} recent downloads` : ''}
                  </p>
                </div>
              </div>
              <Button
                className="gap-2 shrink-0"
                disabled={busyKey === entry.key}
                onClick={() => handleDownload(entry)}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Download history
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => void loadHistory()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-sm text-muted-foreground">Loading…</p>
          ) : history.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No downloads recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">File</th>
                    <th className="py-2 pr-4 font-medium">Size</th>
                    <th className="py-2 pr-4 font-medium">Downloaded by</th>
                    <th className="py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{row.file_name}</td>
                      <td className="py-2 pr-4">{formatBytes(row.size_bytes ?? 0)}</td>
                      <td className="py-2 pr-4">{row.downloaded_by_email ?? '—'}</td>
                      <td className="py-2">{formatDate(row.downloaded_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Page {page + 1} of {totalPages} · {total} downloads
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectExportsAdmin;
