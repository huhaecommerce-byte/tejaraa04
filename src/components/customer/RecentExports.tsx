import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2, Trash2 } from 'lucide-react';
import { safeSetItem, safeRemoveItem } from '@/lib/safeStorage';

export interface RecentExport {
  id: string;
  filename: string;
  format: 'csv' | 'xlsx';
  rows: number;
  size: number;
  createdAt: number;
}

const STORAGE_KEY = 'tejaraa.recentExports.v1';
const MAX_ITEMS = 5;

/**
 * Export file blobs live ONLY in memory (per page session). We intentionally do
 * NOT persist file contents in localStorage: base64 data URLs of catalog exports
 * filled the ~10MB per-origin quota, breaking logins and triggering Firefox's
 * "running out of disk space" warning. localStorage now holds metadata only
 * (a few hundred bytes); "Download again" works while the tab session is alive.
 */
const blobCache = new Map<string, Blob>();

function persist(list: RecentExport[]) {
  safeSetItem(STORAGE_KEY, JSON.stringify(list));
}

export function loadRecentExports(): RecentExport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Migrate/purge legacy entries that stored full base64 file data — this is
    // what filled the browser quota. Keep only metadata.
    let hadLegacy = false;
    const clean: RecentExport[] = [];
    for (const e of parsed) {
      if (e && typeof e === 'object' && typeof e.filename === 'string') {
        if ('dataUrl' in e) hadLegacy = true;
        clean.push({
          id: String(e.id ?? crypto.randomUUID()),
          filename: e.filename,
          format: e.format === 'xlsx' ? 'xlsx' : 'csv',
          rows: Number(e.rows) || 0,
          size: Number(e.size) || 0,
          createdAt: Number(e.createdAt) || Date.now(),
        });
      }
    }
    if (hadLegacy || clean.length !== parsed.length) persist(clean.slice(0, MAX_ITEMS));
    return clean;
  } catch {
    return [];
  }
}

export async function saveRecentExport(item: Omit<RecentExport, 'id' | 'createdAt'> & { blob: Blob }) {
  try {
    const entry: RecentExport = {
      id: crypto.randomUUID(),
      filename: item.filename,
      format: item.format,
      rows: item.rows,
      size: item.size,
      createdAt: Date.now(),
    };
    blobCache.set(entry.id, item.blob);
    const list = [entry, ...loadRecentExports()].slice(0, MAX_ITEMS);
    persist(list);
    window.dispatchEvent(new CustomEvent('recent-exports-updated'));
  } catch {
    // Never let export bookkeeping break the export itself.
  }
}

export function getRecentExportBlob(id: string): Blob | undefined {
  return blobCache.get(id);
}

export function removeRecentExport(id: string) {
  blobCache.delete(id);
  const next = loadRecentExports().filter((i) => i.id !== id);
  if (next.length === 0) safeRemoveItem(STORAGE_KEY);
  else persist(next);
  window.dispatchEvent(new CustomEvent('recent-exports-updated'));
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

interface Props {
  inProgress?: boolean;
}

export function RecentExports({ inProgress }: Props) {
  const [items, setItems] = useState<RecentExport[]>([]);

  useEffect(() => {
    setItems(loadRecentExports());
    const handler = () => setItems(loadRecentExports());
    window.addEventListener('recent-exports-updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('recent-exports-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const downloadAgain = (item: RecentExport) => {
    const blob = blobCache.get(item.id);
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = item.filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const remove = (id: string) => {
    blobCache.delete(id);
    const next = loadRecentExports().filter((i) => i.id !== id);
    if (next.length === 0) safeRemoveItem(STORAGE_KEY);
    else persist(next);
    setItems(next);
  };

  return (
    <div className="rounded-md border bg-muted/20 p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium text-foreground">Recent exports</div>
        <div className="text-[10px] text-muted-foreground">Last {MAX_ITEMS}</div>
      </div>

      {inProgress && (
        <div className="flex items-center gap-2 rounded border border-primary/30 bg-primary/5 px-2 py-1.5 text-[11px]">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span className="text-foreground">Preparing your export…</span>
        </div>
      )}

      {items.length === 0 && !inProgress && (
        <div className="text-[10px] text-muted-foreground py-2 text-center">
          No exports yet. Your last 5 downloads will appear here.
        </div>
      )}

      <div className="space-y-1">
        {items.map((item) => {
          const canDownload = blobCache.has(item.id);
          return (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded border bg-background px-2 py-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium truncate">{item.filename}</div>
                <div className="text-[9px] text-muted-foreground">
                  {item.rows.toLocaleString()} rows · {formatSize(item.size)} · {timeAgo(item.createdAt)}
                </div>
              </div>
              {canDownload && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => downloadAgain(item)}
                  title="Download again"
                >
                  <Download className="h-3 w-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => remove(item.id)}
                title="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
