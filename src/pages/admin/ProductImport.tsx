import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from "@/lib/router-compat";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload, FileSpreadsheet, ArrowLeft, ArrowRight, X, CheckCircle2, AlertCircle,
  Play, Pause, Loader2, FileX, ChevronDown, ChevronUp,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { fetchPricingSettings, computeSellingPriceSar, computeSellingPriceUsd } from '@/lib/priceConversion';

// ---------- Fixed supplier header set ----------
// Headers are matched case-insensitively after normalization (see normHeader).
// No manual mapping: files always carry this exact vocabulary.
const H = {
  sku: 'sku',
  name: 'product title',
  topCategory: 'top category',
  subCategory: 'sub category',
  detailCategory: 'detail category',
  description: 'description',
  specifications: 'specifications',
  stock: 'quantity on hand',
  price: 'price (usd)',
  weight: 'weight',
} as const;

const IMAGE_HEADERS = [
  'image url（主图）',
  ...Array.from({ length: 8 }, (_, i) => `image url ${i + 1}（辅图）`),
];

const REQUIRED_HEADERS = [H.sku, H.name];

const KNOWN_HEADERS = [
  H.sku, H.name, H.topCategory, H.subCategory, H.detailCategory,
  H.description, H.specifications, H.stock, H.price, H.weight,
  ...IMAGE_HEADERS,
];

const KNOWN_HEADER_LABELS: Record<string, string> = {
  [H.sku]: 'SKU',
  [H.name]: 'Product name',
  [H.topCategory]: 'Top category',
  [H.subCategory]: 'Sub category',
  [H.detailCategory]: 'Detailed category',
  [H.description]: 'Description',
  [H.specifications]: 'Specifications (appended to description)',
  [H.stock]: 'Stock qty',
  [H.price]: 'Price (USD)',
  [H.weight]: 'Weight (kg)',
  ...Object.fromEntries(IMAGE_HEADERS.map((h, i) => [h, `Image ${i + 1}`])),
};

// ---------- Types ----------
type FileStatus = 'parsing' | 'parsed' | 'error' | 'queued' | 'processing' | 'done' | 'failed' | 'cancelled';
interface FileEntry {
  id: string;
  file: File;
  headers: string[];          // normalized headers present in the file
  rawHeaders: string[];       // original headers (before normalization)
  rows: Record<string, any>[]; // rows keyed by NORMALIZED headers
  status: FileStatus;
  parseError?: string;
  errorDetails?: { missing: string[]; unknown: string[]; incomingHeaders: string[] };
  showDetails?: boolean;
  progress: { processed: number; imported: number; skipped: number; errors: number };
}
interface ErrorLogEntry { fileName: string; row: number | null; reason: string; ts: number; }
type Step = 1 | 2;

const BATCH = 50;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Aggressive header normalization: strip BOM, NBSP→space, zero-width chars,
// collapse whitespace, drop trailing colons (incl. fullwidth), trim, lowercase.
const normHeader = (s: any): string =>
  String(s ?? '')
    .replace(/\uFEFF/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u200B-\u200D]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[:：]\s*$/, '')
    .trim()
    .toLowerCase();

const isSyntheticKey = (k: string) =>
  /^(__empty|empty|column\d+|unknown)/i.test(String(k ?? '').trim()) ||
  normHeader(k) === '';

// ---------- Component ----------
export default function ProductImport() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [sourceType, setSourceType] = useState<'local' | 'global' | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [existingSkuCount, setExistingSkuCount] = useState<number | null>(null);
  const [estDuplicates, setEstDuplicates] = useState<number>(0);
  const [checkingDupes, setCheckingDupes] = useState(false);
  const [errorLog, setErrorLog] = useState<ErrorLogEntry[]>([]);
  const [errorLogOpen, setErrorLogOpen] = useState(true);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const pauseRef = useRef(false);
  const cancelRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const dropRef = useRef<HTMLInputElement>(null);

  // tick for elapsed
  useEffect(() => {
    if (step !== 2 || finishedAt) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [step, finishedAt]);

  // browser tab title progress
  useEffect(() => {
    if (step !== 2) return;
    const total = files.reduce((s, f) => s + f.rows.length, 0);
    const processed = files.reduce((s, f) => s + f.progress.processed, 0);
    const pct = total ? Math.round((processed / total) * 100) : 0;
    const prev = document.title;
    document.title = `(${pct}%) Importing Products`;
    return () => { document.title = prev; };
  }, [step, files]);

  // ---------- Parsing ----------
  const parseFile = useCallback((file: File): Promise<{ headers: string[]; rawHeaders: string[]; rows: Record<string, any>[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const wb = XLSX.read(evt.target?.result, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          // Read as array-of-arrays so we can autodetect the header row
          const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });
          if (!aoa.length) return reject(new Error('No data rows found'));

          // Score first 10 rows to find the real header row.
          const scanLimit = Math.min(10, aoa.length);
          let bestIdx = 0, bestScore = -Infinity;
          for (let r = 0; r < scanLimit; r++) {
            const row = aoa[r] || [];
            const cells = row.map(c => (c === null || c === undefined) ? '' : String(c).trim()).filter(Boolean);
            if (cells.length < 2) continue;
            const alphaCells = cells.filter(c => /[a-zA-Z\u0600-\u06FF]/.test(c)).length;
            const numericCells = cells.filter(c => /^-?\d+(\.\d+)?$/.test(c)).length;
            if (alphaCells < 3) continue;
            if (numericCells / cells.length >= 0.5) continue;
            const uniq = new Set(cells.map(c => c.toLowerCase())).size;
            const score = cells.length + alphaCells * 0.5 + uniq * 0.3 - r * 0.1;
            if (score > bestScore) { bestScore = score; bestIdx = r; }
          }

          const rawHeaderRow = (aoa[bestIdx] || []).map(c => (c === null || c === undefined) ? '' : String(c));
          const dataRows = aoa.slice(bestIdx + 1);
          if (!dataRows.length) return reject(new Error('No data rows below detected header'));

          // Trim trailing footer-ish rows (only 1-2 non-empty cells)
          let endIdx = dataRows.length;
          while (endIdx > 0) {
            const row = dataRows[endIdx - 1] || [];
            const nonEmpty = row.filter(c => c !== '' && c !== null && c !== undefined).length;
            if (nonEmpty <= 2) endIdx--;
            else break;
          }
          const trimmedRows = dataRows.slice(0, endIdx);

          // Build column index list, dropping synthetic/empty headers
          const colCount = Math.max(rawHeaderRow.length, ...trimmedRows.map(r => r.length));
          const cols: { idx: number; raw: string; norm: string }[] = [];
          const seenNorm = new Set<string>();
          for (let i = 0; i < colCount; i++) {
            const raw = rawHeaderRow[i] ?? '';
            const norm = normHeader(raw);
            if (!norm) continue;
            if (isSyntheticKey(raw)) continue;
            if (seenNorm.has(norm)) continue;
            seenNorm.add(norm);
            cols.push({ idx: i, raw: String(raw), norm });
          }

          // Keep every recognized column; drop unknown columns that are almost always blank
          const totalRowsCount = trimmedRows.length || 1;
          const keptCols = cols.filter(c => {
            if (KNOWN_HEADERS.includes(c.norm)) return true;
            const filled = trimmedRows.reduce((acc, r) => {
              const v = r[c.idx];
              return acc + (v !== '' && v !== null && v !== undefined ? 1 : 0);
            }, 0);
            return (filled / totalRowsCount) >= 0.05;
          });

          if (!keptCols.length) return reject(new Error('No valid header columns detected'));

          const headers = keptCols.map(c => c.norm);
          const rawHeaders = keptCols.map(c => c.raw);
          const rows = trimmedRows.map(r => {
            const out: Record<string, any> = {};
            keptCols.forEach(c => { out[c.norm] = r[c.idx] ?? ''; });
            return out;
          }).filter(r => Object.values(r).some(v => v !== '' && v !== null && v !== undefined));

          if (!rows.length) return reject(new Error('No data rows after cleanup'));
          resolve({ headers, rawHeaders, rows });
        } catch (e: any) { reject(new Error(e?.message || 'Failed to parse file')); }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const addFiles = useCallback(async (incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    for (const file of list) {
      const id = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
      const entry: FileEntry = {
        id, file, headers: [], rawHeaders: [], rows: [], status: 'parsing',
        progress: { processed: 0, imported: 0, skipped: 0, errors: 0 },
      };
      setFiles(prev => [...prev, entry]);
      try {
        const { headers, rawHeaders, rows } = await parseFile(file);
        const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h));
        const unknown = headers.filter(h => !KNOWN_HEADERS.includes(h));

        if (missing.length) {
          const reason = `Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`;
          setFiles(prev => prev.map(f => f.id === id ? {
            ...f, status: 'error', parseError: reason,
            headers, rawHeaders, rows: [],
            errorDetails: { missing, unknown, incomingHeaders: headers },
          } : f));
          toast.error(`${file.name}: ${reason}`);
        } else {
          setFiles(prev => prev.map(f => f.id === id ? {
            ...f, headers, rawHeaders, rows, status: 'parsed',
            errorDetails: { missing: [], unknown, incomingHeaders: headers },
          } : f));
        }
      } catch (e: any) {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', parseError: e.message } : f));
        toast.error(`${file.name}: ${e.message}`);
      }
    }
  }, [parseFile]);

  const toggleErrorDetails = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, showDetails: !f.showDetails } : f));
  };

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));
  const clearAll = () => { setFiles([]); setEstDuplicates(0); setExistingSkuCount(null); };

  // ---------- Derived ----------
  const parsedFiles = useMemo(
    () => files.filter(f => f.status !== 'parsing' && f.status !== 'error'),
    [files],
  );
  const totalRows = useMemo(() => parsedFiles.reduce((s, f) => s + f.rows.length, 0), [parsedFiles]);
  const totalProcessed = useMemo(() => parsedFiles.reduce((s, f) => s + f.progress.processed, 0), [parsedFiles]);
  const totalImported = useMemo(() => parsedFiles.reduce((s, f) => s + f.progress.imported, 0), [parsedFiles]);
  const totalSkipped = useMemo(() => parsedFiles.reduce((s, f) => s + f.progress.skipped, 0), [parsedFiles]);
  const totalErrors = useMemo(() => parsedFiles.reduce((s, f) => s + f.progress.errors, 0), [parsedFiles]);
  const overallPct = totalRows ? Math.round((totalProcessed / totalRows) * 100) : 0;

  // Duplicate estimate — checks the file's SKUs against the DB in chunks
  // (scanning every catalog SKU times out once the catalog is large).
  useEffect(() => {
    let cancelled = false;
    const ready = files.filter(f => f.status === 'parsed');
    if (ready.length === 0) { setEstDuplicates(0); setExistingSkuCount(null); return; }
    (async () => {
      setCheckingDupes(true);
      const fileSkus: string[] = [];
      const seen = new Set<string>();
      let dup = 0;
      for (const f of ready) {
        for (const row of f.rows) {
          const sku = String(row[H.sku] || '').trim();
          if (!sku) continue;
          const key = sku.toLowerCase();
          if (seen.has(key)) { dup++; continue; }
          seen.add(key);
          fileSkus.push(sku);
        }
      }
      const CHUNK = 500;
      let existing = 0;
      for (let i = 0; i < fileSkus.length; i += CHUNK) {
        if (cancelled) return;
        const { data, error } = await supabase
          .from('products')
          .select('sku')
          .in('sku', fileSkus.slice(i, i + CHUNK));
        if (error) break;
        existing += (data || []).length;
      }
      if (cancelled) return;
      setExistingSkuCount(existing);
      setEstDuplicates(dup + existing);
      setCheckingDupes(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.map(f => `${f.id}:${f.status}`).join('|')]);


  // ---------- Importing ----------
  const startImport = async () => {
    setStep(2);
    setStartedAt(Date.now());
    setFinishedAt(null);
    setErrorLog([]);
    pauseRef.current = false;
    cancelRef.current = false;
    setPaused(false);

    setFiles(prev => prev.map(f => f.status === 'parsed' ? { ...f, status: 'queued' } : f));

    const pricing = await fetchPricingSettings(supabase as any);
    // Duplicates are detected per batch (a full catalog SKU scan times out at
    // scale). This set only tracks SKUs already handled in this run.
    const seenSkus = new Set<string>();


    const queue = files.filter(f => f.status === 'parsed' || f.status === 'queued');

    for (const fileEntry of queue) {
      if (cancelRef.current) {
        setFiles(prev => prev.map(f => f.id === fileEntry.id ? { ...f, status: 'cancelled' } : f));
        continue;
      }
      setFiles(prev => prev.map(f => f.id === fileEntry.id ? { ...f, status: 'processing' } : f));
      const rows = fileEntry.rows;
      let fileImported = 0, fileSkipped = 0, fileErrors = 0, fileProcessed = 0;
      let hadFatal = false;

      for (let i = 0; i < rows.length; i += BATCH) {
        if (cancelRef.current) break;
        while (pauseRef.current) await sleep(200);

        const batch = rows.slice(i, i + BATCH);
        const toInsert: { row: number; payload: any }[] = [];
        const batchRowOffset = i;

        // Indexed lookup of just this batch's SKUs — fast at any catalog size.
        const batchSkus = Array.from(new Set(
          batch.map(r => String(r[H.sku] ?? '').trim()).filter(Boolean)
        ));
        if (batchSkus.length) {
          const { data: existing } = await supabase
            .from('products')
            .select('sku')
            .in('sku', batchSkus);
          (existing || []).forEach((p: any) => seenSkus.add(String(p.sku).trim().toLowerCase()));
        }


        batch.forEach((row, bIdx) => {
          const rowNum = batchRowOffset + bIdx + 2; // +2 for header + 1-index
          const get = (header: string) => row[header];
          const str = (header: string) => String(get(header) ?? '').trim();

          const sku = str(H.sku);
          const name = str(H.name);
          if (!sku || !name) {
            fileErrors++;
            setErrorLog(prev => [{ fileName: fileEntry.file.name, row: rowNum, reason: !sku ? 'Missing SKU' : 'Missing Name', ts: Date.now() }, ...prev].slice(0, 500));
            return;
          }
          if (seenSkus.has(sku.toLowerCase())) { fileSkipped++; return; }
          seenSkus.add(sku.toLowerCase());

          const images: string[] = [];
          for (const h of IMAGE_HEADERS) {
            const url = str(h);
            if (url) images.push(url);
          }

          const price = parseFloat(str(H.price)) || 0;
          const weight = parseFloat(str(H.weight)) || 0;
          const specs = str(H.specifications);
          const desc = str(H.description);
          const description = specs ? `${desc}${desc ? '\n\n' : ''}${specs}` : desc;

          toInsert.push({
            row: rowNum,
            payload: {
              sku, name,
              top_category: str(H.topCategory) || 'General',
              sub_category: str(H.subCategory),
              detailed_category: str(H.detailCategory),
              source: sourceType ?? 'local',
              cost_usd: price,
              price_sar: parseFloat(computeSellingPriceSar(price, weight, pricing, sourceType ?? 'local').toFixed(2)),
              price_usd: parseFloat(computeSellingPriceUsd(price, weight, pricing, sourceType ?? 'local').toFixed(2)),
              moq: 1,
              description,
              stock_qty: parseInt(str(H.stock)) || 0,
              labelling_available: false,
              weight_kg: weight,
              images,
              created_by_source: 'import',
            },
          });
        });

        if (toInsert.length) {
          const { error } = await supabase.from('products').insert(toInsert.map(t => t.payload));
          if (error) {
            if (/plan limit|quota|cap reached/i.test(error.message)) {
              hadFatal = true;
              fileErrors += toInsert.length;
              toInsert.forEach(t => seenSkus.delete(t.payload.sku.toLowerCase()));
              setErrorLog(prev => [{ fileName: fileEntry.file.name, row: i + 2, reason: error.message, ts: Date.now() }, ...prev].slice(0, 500));
            } else {
              // One bad row fails the whole batch — retry row by row so good rows land
              // and every failing row gets its own log entry.
              for (const t of toInsert) {
                if (cancelRef.current) break;
                const { error: rowErr } = await supabase.from('products').insert(t.payload);
                if (!rowErr) { fileImported++; continue; }
                seenSkus.delete(t.payload.sku.toLowerCase());
                if (/duplicate key|products_sku_key/i.test(rowErr.message)) {
                  fileSkipped++;
                  seenSkus.add(t.payload.sku.toLowerCase());
                } else {
                  fileErrors++;
                  setErrorLog(prev => [{ fileName: fileEntry.file.name, row: t.row, reason: `SKU ${t.payload.sku}: ${rowErr.message}`, ts: Date.now() }, ...prev].slice(0, 500));
                }
              }
            }
          } else {
            fileImported += toInsert.length;
          }
        }
        fileProcessed += batch.length;

        setFiles(prev => prev.map(f => f.id === fileEntry.id
          ? { ...f, progress: { processed: fileProcessed, imported: fileImported, skipped: fileSkipped, errors: fileErrors } }
          : f));

        if (hadFatal) break;
      }

      setFiles(prev => prev.map(f => {
        if (f.id !== fileEntry.id) return f;
        const finalStatus: FileStatus = cancelRef.current ? 'cancelled' : (hadFatal ? 'failed' : 'done');
        return { ...f, status: finalStatus };
      }));
    }

    setFinishedAt(Date.now());
  };

  const togglePause = () => { pauseRef.current = !pauseRef.current; setPaused(pauseRef.current); };
  const cancelImport = () => { cancelRef.current = true; pauseRef.current = false; setPaused(false); };

  const elapsedMs = startedAt ? (finishedAt || now) - startedAt : 0;
  const elapsedStr = `${Math.floor(elapsedMs / 60000)}m ${Math.floor((elapsedMs % 60000) / 1000)}s`;

  const importComplete = step === 2 && !!finishedAt;
  const readyFiles = files.filter(f => f.status === 'parsed');

  // ---------- Render ----------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/catalog-hub?tab=products')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-primary" /> Bulk Product Import
            </h1>
            <p className="text-sm text-muted-foreground">Drop the supplier Excel files — columns are recognised automatically and saved straight to products.</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: 'Upload' },
          { n: 2, label: 'Import' },
        ].map((s, idx) => (
          <React.Fragment key={s.n}>
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
              step === s.n ? 'bg-primary text-primary-foreground font-medium' :
              step > s.n ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              <span className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center text-xs',
                step === s.n ? 'bg-primary-foreground text-primary' :
                step > s.n ? 'bg-primary text-primary-foreground' : 'bg-background'
              )}>
                {step > s.n ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.n}
              </span>
              {s.label}
            </div>
            {idx < 1 && <div className="flex-1 h-px bg-border max-w-[40px]" />}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1 — Upload */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Where are these products sourced from?</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  { key: 'local' as const, title: 'Local', desc: 'Stocked in Saudi Arabia — faster delivery.' },
                  { key: 'global' as const, title: 'Global', desc: 'Sourced from overseas suppliers.' },
                ]).map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSourceType(opt.key)}
                    className={cn(
                      'text-left rounded-lg border p-4 transition-colors',
                      sourceType === opt.key
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-2 font-medium text-sm">
                      {sourceType === opt.key && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      {opt.title}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
              {!sourceType && (
                <p className="text-xs text-muted-foreground mt-3">Choose Local or Global before uploading — it is saved on every imported product.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div
                className={cn(
                  'border-2 border-dashed border-muted-foreground/30 rounded-lg p-10 text-center transition-colors',
                  sourceType ? 'cursor-pointer hover:border-primary/50 hover:bg-muted/30' : 'opacity-50 pointer-events-none'
                )}
                onClick={() => { if (sourceType) dropRef.current?.click(); }}
                onDragOver={e => { e.preventDefault(); }}
                onDrop={e => {
                  e.preventDefault();
                  if (!sourceType) return;
                  if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
                }}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">Drop Excel files here, or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">.xlsx / .xls — multiple files supported. No mapping needed: the standard supplier columns are detected automatically.</p>
                <input
                  ref={dropRef}
                  type="file"
                  accept=".xlsx,.xls"
                  multiple
                  className="hidden"
                  onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
                />
              </div>
            </CardContent>
          </Card>


          {readyFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Ready files" value={readyFiles.length} />
              <StatCard label="Total rows" value={totalRows.toLocaleString()} />
              <StatCard label="Est. duplicates" value={checkingDupes ? '…' : estDuplicates.toLocaleString()} tone={estDuplicates > 0 ? 'amber' : undefined} />
              <StatCard label="Est. importable" value={checkingDupes ? '…' : (totalRows - estDuplicates).toLocaleString()} tone="emerald" />
            </div>
          )}

          {files.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-base">Uploaded files ({files.length})</CardTitle>
                <Button variant="ghost" size="sm" onClick={clearAll}>Clear all</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th className="text-left p-3">File</th>
                        <th className="text-left p-3">Size</th>
                        <th className="text-left p-3">Rows</th>
                        <th className="text-left p-3">Recognised columns</th>
                        <th className="text-left p-3">Status</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map(f => {
                        const recognised = f.headers.filter(h => KNOWN_HEADERS.includes(h));
                        return (
                          <tr key={f.id} className="border-t">
                            <td className="p-3 font-medium truncate max-w-[260px]">{f.file.name}</td>
                            <td className="p-3 text-muted-foreground">{(f.file.size / 1024).toFixed(1)} KB</td>
                            <td className="p-3">{f.status === 'parsed' ? f.rows.length : '—'}</td>
                            <td className="p-3 text-muted-foreground">{f.status === 'parsed' ? `${recognised.length} / ${KNOWN_HEADERS.length}` : '—'}</td>
                            <td className="p-3">
                              {f.status === 'parsing' && <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Parsing</Badge>}
                              {f.status === 'parsed' && (
                                <div className="flex flex-col gap-1">
                                  <Badge variant="outline" className="w-fit text-emerald-600 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" /> Ready</Badge>
                                  <Button variant="link" size="sm" className="h-auto p-0 text-xs w-fit" onClick={() => toggleErrorDetails(f.id)}>
                                    {f.showDetails ? 'Hide' : 'Show'} detected columns
                                  </Button>
                                  {f.showDetails && (
                                    <div className="mt-1 rounded border bg-muted/30 p-2 space-y-2 text-xs max-w-[520px]">
                                      <div>
                                        <div className="font-semibold text-foreground mb-1">Mapped ({recognised.length}):</div>
                                        <div className="flex flex-wrap gap-1">
                                          {recognised.map(h => (
                                            <Badge key={h} variant="secondary" className="text-[10px]">{KNOWN_HEADER_LABELS[h] || h}</Badge>
                                          ))}
                                        </div>
                                      </div>
                                      {(f.errorDetails?.unknown.length ?? 0) > 0 && (
                                        <div>
                                          <div className="font-semibold text-muted-foreground mb-1">Ignored ({f.errorDetails!.unknown.length}):</div>
                                          <div className="flex flex-wrap gap-1">
                                            {f.errorDetails!.unknown.map(h => <Badge key={h} variant="outline" className="text-[10px]">{h}</Badge>)}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              {f.status === 'error' && (
                                <div className="flex flex-col gap-1 max-w-[420px]">
                                  <Badge variant="destructive" className="w-fit"><AlertCircle className="h-3 w-3 mr-1" /> Error</Badge>
                                  <span className="text-xs text-destructive break-words">{f.parseError}</span>
                                  {f.errorDetails && (
                                    <Button variant="link" size="sm" className="h-auto p-0 text-xs w-fit" onClick={() => toggleErrorDetails(f.id)}>
                                      {f.showDetails ? 'Hide' : 'Show'} columns found
                                    </Button>
                                  )}
                                  {f.showDetails && f.errorDetails && (
                                    <div className="mt-1 rounded border bg-muted/30 p-2 text-xs">
                                      <div className="flex flex-wrap gap-1">
                                        {f.errorDetails.incomingHeaders.map(h => <Badge key={h} variant="secondary" className="text-[10px]">{h}</Badge>)}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <Button variant="ghost" size="icon" onClick={() => removeFile(f.id)}><X className="h-4 w-4" /></Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2">
                Expected columns ({KNOWN_HEADERS.length}) — <span className="text-foreground font-medium">SKU</span> and <span className="text-foreground font-medium">Product Title</span> are required, everything else is optional:
              </p>
              <div className="flex flex-wrap gap-1">
                {KNOWN_HEADERS.map(h => <Badge key={h} variant="secondary" className="text-xs">{h}</Badge>)}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button disabled={readyFiles.length === 0} onClick={startImport}>
              Import {totalRows.toLocaleString()} rows <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2 — Import dashboard */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Top metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total files" value={parsedFiles.length} />
            <StatCard label="Total rows" value={totalRows.toLocaleString()} />
            <StatCard label="Processed" value={totalProcessed.toLocaleString()} tone="emerald" />
            <StatCard label="Pending" value={(totalRows - totalProcessed).toLocaleString()} tone="amber" />
            <StatCard label="Imported" value={totalImported.toLocaleString()} tone="emerald" />
            <StatCard label="Skipped (dup)" value={totalSkipped.toLocaleString()} />
            <StatCard label="Errors" value={totalErrors.toLocaleString()} tone={totalErrors > 0 ? 'red' : undefined} />
            <StatCard label="Elapsed" value={elapsedStr} />
          </div>

          {/* Overall progress */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall progress</span>
                <span className="text-muted-foreground">{totalProcessed.toLocaleString()} / {totalRows.toLocaleString()} rows · {overallPct}%</span>
              </div>
              <Progress value={overallPct} className="h-3" />
              {existingSkuCount !== null && (
                <p className="text-xs text-muted-foreground">{existingSkuCount.toLocaleString()} SKUs already in the catalog will be skipped.</p>
              )}
            </CardContent>
          </Card>

          {/* Controls */}
          {!finishedAt && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={togglePause}>
                {paused ? <><Play className="h-4 w-4 mr-1" /> Resume</> : <><Pause className="h-4 w-4 mr-1" /> Pause</>}
              </Button>
              <Button variant="destructive" onClick={cancelImport}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
            </div>
          )}

          {/* Per-file table */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-base">Per-file progress</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">File</th>
                      <th className="text-left p-3">Total</th>
                      <th className="text-left p-3">Processed</th>
                      <th className="text-left p-3">Imported</th>
                      <th className="text-left p-3">Skipped</th>
                      <th className="text-left p-3">Errors</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3 min-w-[180px]">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedFiles.map(f => {
                      const pct = f.rows.length ? Math.round((f.progress.processed / f.rows.length) * 100) : 0;
                      return (
                        <tr key={f.id} className="border-t">
                          <td className="p-3 font-medium truncate max-w-[240px]">{f.file.name}</td>
                          <td className="p-3">{f.rows.length}</td>
                          <td className="p-3">{f.progress.processed}</td>
                          <td className="p-3 text-emerald-600">{f.progress.imported}</td>
                          <td className="p-3 text-muted-foreground">{f.progress.skipped}</td>
                          <td className="p-3 text-destructive">{f.progress.errors}</td>
                          <td className="p-3"><FileStatusBadge status={f.status} /></td>
                          <td className="p-3"><Progress value={pct} className="h-2" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Error log */}
          <Card>
            <CardHeader className="py-3 cursor-pointer" onClick={() => setErrorLogOpen(o => !o)}>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Error log ({errorLog.length})
                </span>
                {errorLogOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
            {errorLogOpen && (
              <CardContent className="p-0 max-h-[280px] overflow-y-auto">
                {errorLog.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">No errors yet.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-2">File</th>
                        <th className="text-left p-2">Row</th>
                        <th className="text-left p-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {errorLog.slice(0, 200).map((e, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 truncate max-w-[200px]">{e.fileName}</td>
                          <td className="p-2">{e.row ?? '—'}</td>
                          <td className="p-2 text-destructive">{e.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            )}
          </Card>

          {/* Completion */}
          {importComplete && (
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardContent className="p-6 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-600" />
                <h3 className="text-lg font-semibold">Import complete</h3>
                <div className="flex justify-center gap-2 flex-wrap">
                  <Badge className="text-sm">{totalImported} imported</Badge>
                  {totalSkipped > 0 && <Badge variant="secondary" className="text-sm">{totalSkipped} duplicates</Badge>}
                  {totalErrors > 0 && <Badge variant="destructive" className="text-sm">{totalErrors} errors</Badge>}
                  <Badge variant="outline" className="text-sm">in {elapsedStr}</Badge>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <Button variant="outline" onClick={() => {
                    setStep(1); setFiles([]);
                    setErrorLog([]); setStartedAt(null); setFinishedAt(null);
                  }}>Import another batch</Button>
                  <Button onClick={() => navigate('/admin/catalog-hub?tab=products')}>Back to products</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Subcomponents ----------
function StatCard({ label, value, tone }: { label: string; value: string | number; tone?: 'emerald' | 'amber' | 'red' }) {
  const toneClass = tone === 'emerald' ? 'text-emerald-600'
    : tone === 'amber' ? 'text-amber-600'
    : tone === 'red' ? 'text-destructive'
    : '';
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-2xl font-bold mt-1', toneClass)}>{value}</p>
      </CardContent>
    </Card>
  );
}

function FileStatusBadge({ status }: { status: FileStatus }) {
  switch (status) {
    case 'queued': return <Badge variant="outline">Queued</Badge>;
    case 'processing': return <Badge className="bg-primary/15 text-primary hover:bg-primary/15"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Processing</Badge>;
    case 'done': return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15"><CheckCircle2 className="h-3 w-3 mr-1" /> Done</Badge>;
    case 'failed': return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
    case 'cancelled': return <Badge variant="secondary"><FileX className="h-3 w-3 mr-1" /> Cancelled</Badge>;
    case 'parsed': return <Badge variant="outline">Ready</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}
