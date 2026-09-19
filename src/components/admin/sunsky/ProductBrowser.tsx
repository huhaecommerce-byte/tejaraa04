import { useCallback, useEffect, useState } from 'react';
import { Loader2, Search, RefreshCw, Plus, CheckCircle2, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSunsky } from '@/hooks/useSunsky';
import { SunskyCategoryPicker, type SunskyCategorySelection } from '@/components/admin/sunsky/CategoryPicker';
import { statusLabel } from '@/data/sunskyDocs';
import { toast } from 'sonner';

interface ListItem {
  itemNo: string;
  name: string;
  price: number | null;
  stock: number;
  status: number;
  leadTimeLevel: number | null;
  categoryId: number | null;
  image: string | null;
  imported: boolean;
  raw: Record<string, unknown>;
}

const PAGE_SIZES = [20, 40, 60, 100];

export function SunskyProductBrowser() {
  const { call } = useSunsky();
  const [category, setCategory] = useState<SunskyCategorySelection>({ categoryId: null, path: '' });
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('-1');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(40);
  const [items, setItems] = useState<ListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [importing, setImporting] = useState(false);
  const [detail, setDetail] = useState<ListItem | null>(null);
  const [searched, setSearched] = useState(false);

  const load = useCallback(async (nextPage = page) => {
    setLoading(true);
    setSearched(true);
    const r = await call('product/list', {
      categoryId: category.categoryId ?? undefined,
      keyword: keyword || undefined,
      status: Number(statusFilter),
      page: nextPage,
      pageSize,
    });
    setLoading(false);
    if (r.result === 'success') {
      const d = (r.data ?? {}) as { items?: ListItem[]; total?: number; pageCount?: number };
      setItems(d.items ?? []);
      setTotal(d.total ?? 0);
      setPageCount(Math.max(1, d.pageCount ?? 1));
      setPage(nextPage);
    }
  }, [call, category.categoryId, keyword, statusFilter, pageSize, page]);

  // Reload whenever the category, status or page size changes
  useEffect(() => {
    if (category.categoryId != null) void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.categoryId, statusFilter, pageSize]);

  const selectedItems = items.filter((i) => selected[i.itemNo]);
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  function toggleAll() {
    if (allSelected) { setSelected({}); return; }
    const next: Record<string, boolean> = {};
    for (const i of items) next[i.itemNo] = true;
    setSelected(next);
  }

  async function importSelected(list: ListItem[]) {
    if (!list.length) { toast.error('Select at least one product'); return; }
    setImporting(true);
    const r = await call('import/item', {
      items: list.map((i) => ({
        itemNo: i.itemNo, price: i.price, stock: i.stock, status: i.status,
        categoryId: i.categoryId, raw: i.raw,
      })),
      categoryPath: category.path || null,
    });
    setImporting(false);
    if (r.result === 'success') {
      const d = (r.data ?? {}) as { imported?: number; updated?: number; failed?: number };
      toast.success(`Added ${d.imported ?? 0} · updated ${d.updated ?? 0}${d.failed ? ` · failed ${d.failed}` : ''}`);
      const done = new Set(list.map((i) => i.itemNo));
      setItems((prev) => prev.map((i) => (done.has(i.itemNo) ? { ...i, imported: true } : i)));
      setSelected({});
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" /> Browse SunSky products</CardTitle>
          <CardDescription>
            Search the live SunSky catalog by keyword or category, then add the products you want to your catalog.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_200px_160px_auto] items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Keyword</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. iPhone 15 case, wireless charger, SKU…"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void load(1); }}
                />
                <Button onClick={() => void load(1)} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="ml-2 hidden sm:inline">Search</span>
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">All statuses</SelectItem>
                  <SelectItem value="1">Active only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Per page</Label>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => void load(page)} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="rounded-xl border bg-muted/30 p-3">
            <Label className="text-xs mb-2 block">Filter by category (optional)</Label>
            <SunskyCategoryPicker value={category} onChange={setCategory} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => void importSelected(selectedItems)}
              disabled={importing || selectedItems.length === 0}
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add {selectedItems.length > 0 ? `${selectedItems.length} ` : ''}selected
            </Button>
            <Button variant="outline" size="sm" onClick={toggleAll} disabled={items.length === 0}>
              {allSelected ? 'Clear selection' : 'Select all on page'}
            </Button>
            {total > 0 && (
              <span className="text-xs text-muted-foreground">
                {total.toLocaleString()} products found · page {page} of {pageCount}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              {searched ? 'No products matched. Try another keyword or category.'
                : 'Enter a keyword or pick a category, then hit Search to list products.'}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {items.map((it) => (
                  <div key={it.itemNo} className="rounded-xl border bg-card overflow-hidden flex flex-col">
                    <div className="relative">
                      {it.image ? (
                        <img
                          src={it.image}
                          alt={it.name}
                          loading="lazy"
                          className="w-full h-32 object-cover bg-muted cursor-pointer"
                          onClick={() => setDetail(it)}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                        />
                      ) : <div className="w-full h-32 bg-muted" />}
                      <div className="absolute top-1.5 left-1.5">
                        <Checkbox
                          checked={Boolean(selected[it.itemNo])}
                          onCheckedChange={(v) => setSelected((s) => ({ ...s, [it.itemNo]: Boolean(v) }))}
                          className="bg-background border-2"
                        />
                      </div>
                      {it.imported && (
                        <Badge className="absolute top-1.5 right-1.5 text-[9px] gap-1" variant="secondary">
                          <CheckCircle2 className="h-3 w-3" /> Added
                        </Badge>
                      )}
                    </div>
                    <div className="p-2 flex-1 flex flex-col gap-1">
                      <button
                        type="button"
                        className="text-xs font-medium line-clamp-2 text-left hover:underline"
                        onClick={() => setDetail(it)}
                      >
                        {it.name}
                      </button>
                      <div className="text-[10px] font-mono text-muted-foreground">{it.itemNo}</div>
                      <div className="mt-auto flex items-center justify-between pt-1">
                        <span className="text-sm font-bold text-emerald-700">
                          {it.price != null ? `$${it.price.toFixed(2)}` : '—'}
                        </span>
                        <Badge variant={it.stock > 0 ? 'outline' : 'secondary'} className="text-[9px] px-1 py-0">
                          {it.stock > 0 ? `stk ${it.stock}` : 'OOS'}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant={it.imported ? 'outline' : 'default'}
                        className="h-7 text-[11px] mt-1"
                        disabled={importing}
                        onClick={() => void importSelected([it])}
                      >
                        {it.imported ? 'Re-sync' : 'Add to catalog'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => void load(page - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <span className="text-xs text-muted-foreground">Page {page} / {pageCount}</span>
                <Button variant="outline" size="sm" disabled={page >= pageCount || loading} onClick={() => void load(page + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ProductDetailDialog item={detail} onClose={() => setDetail(null)} onImport={(it) => void importSelected([it])} />
    </div>
  );
}

function ProductDetailDialog({ item, onClose, onImport }: {
  item: ListItem | null;
  onClose: () => void;
  onImport: (it: ListItem) => void;
}) {
  const { call } = useSunsky();
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item) { setDetail(null); return; }
    let alive = true;
    (async () => {
      setLoading(true);
      const r = await call('product/details', { itemNo: item.itemNo, lang: 'en' }, { silent: true });
      if (!alive) return;
      const d = r.result === 'success'
        ? (Array.isArray(r.data) ? r.data[0] : ((r.data as any)?.result ?? r.data))
        : null;
      setDetail(d ?? null);
      setLoading(false);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.itemNo]);

  if (!item) return null;
  const merged: Record<string, any> = { ...(item.raw ?? {}), ...(detail ?? {}) };
  const images: string[] = Array.isArray(merged.images) ? merged.images : (item.image ? [item.image] : []);

  return (
    <Dialog open={Boolean(item)} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{item.name}</DialogTitle>
          <DialogDescription className="font-mono text-xs">{item.itemNo}</DialogDescription>
        </DialogHeader>
        {loading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
          <div className="space-y-4">
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 8).map((src, i) => (
                  <img key={i} src={src} alt="" className="h-24 w-full object-cover rounded-lg bg-muted"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <Field label="Price" value={item.price != null ? `$${item.price.toFixed(2)}` : '—'} />
              <Field label="Stock" value={String(item.stock)} />
              <Field label="Status" value={statusLabel(item.status)} />
              <Field label="Weight" value={merged.weight ? `${merged.weight} g` : '—'} />
            </div>
            {merged.description && (
              <div className="text-xs text-muted-foreground whitespace-pre-line max-h-48 overflow-y-auto rounded-lg border p-3">
                {String(merged.description).replace(/<[^>]+>/g, ' ').slice(0, 2000)}
              </div>
            )}
            <Button onClick={() => onImport(item)} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> {item.imported ? 'Re-sync this product' : 'Add to catalog'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
