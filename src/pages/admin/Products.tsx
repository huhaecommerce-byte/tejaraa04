import { useState, useEffect } from 'react';
import { useNavigate } from "@/lib/router-compat";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Upload, Pencil, Trash2, ChevronLeft, ChevronRight, RefreshCw, Eye, Filter, X, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { costUsd, sellPriceSar, sellPriceUsd, fetchPricingSettings, DEFAULT_PRICING, type PricingSettings } from '@/lib/priceConversion';
import { PageHeader } from '@/components/customer/aux/PageHeader';

interface Product {
  id: string;
  sku: string;
  name: string;
  name_ar?: string | null;
  top_category: string;
  sub_category: string;
  detailed_category: string;
  source: string;
  cost_usd: number;
  price_sar: number;
  price_usd: number;
  moq: number;
  weight_kg: number;
  description?: string | null;
  estimated_delivery?: string | null;
  labelling_available?: boolean | null;
  platforms: string[];
  images: string[];
  stock_qty?: number;
  track_inventory?: boolean;
  low_stock_threshold?: number;
  created_by?: string | null;
  created_by_email?: string | null;
  created_by_source?: string | null;
}

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Added manually',
  import: 'Excel import',
  sunsky: 'SunSky sync',
  sourcing: 'Sourcing request',
};

function AddedBy({ p, names }: { p: Product; names: Record<string, string> }) {
  const who = (p.created_by && names[p.created_by]) || p.created_by_email || null;
  const src = SOURCE_LABEL[p.created_by_source || 'manual'] || p.created_by_source;
  if (!who) {
    return (
      <div className="space-y-0.5">
        <span className="text-xs text-muted-foreground">System</span>
        <div className="text-[10px] text-muted-foreground">{src}</div>
      </div>
    );
  }
  const initials = who.replace(/@.*/, '').slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <span className="h-6 w-6 shrink-0 rounded-full bg-accent/15 text-accent text-[10px] font-semibold flex items-center justify-center">
        {initials}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium truncate max-w-[140px]" title={who}>{who}</div>
        <div className="text-[10px] text-muted-foreground">{src}</div>
      </div>
    </div>
  );
}

// Compute days-of-supply badge for a product based on 30-day sales velocity
const supplyBadge = (p: Product, velocityMap: Record<string, number>) => {
  if (!p.track_inventory) return null;
  const stock = p.stock_qty ?? 0;
  if (stock === 0) {
    return <Badge variant="destructive" className="text-[10px]">Out of stock</Badge>;
  }
  const velocity = velocityMap[p.id] || 0; // units sold per day
  if (velocity === 0) {
    return <Badge variant="outline" className="text-[10px] text-muted-foreground">{stock} on hand</Badge>;
  }
  const days = Math.floor(stock / velocity);
  if (days <= 7) {
    return <Badge className="text-[10px] bg-destructive text-destructive-foreground hover:bg-destructive">⚠️ Stockout in {days}d</Badge>;
  }
  if (days <= 21) {
    return <Badge className="text-[10px] bg-amber-500 text-white hover:bg-amber-500">{days}d supply</Badge>;
  }
  return <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">{days}d supply</Badge>;
};

const PAGE_SIZE = 50;

const ProductsAdmin = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [velocityMap, setVelocityMap] = useState<Record<string, number>>({});
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [arabicFilter, setArabicFilter] = useState<'all' | 'has_arabic' | 'no_arabic'>('all');
  const [imageFilter, setImageFilter] = useState<'all' | 'has_images' | 'no_images'>('all');
  const [search, setSearch] = useState('');
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});
  const [refreshingCounts, setRefreshingCounts] = useState(false);

  const activeFilterCount = [stockFilter, arabicFilter, imageFilter].filter(f => f !== 'all').length;

  // Only columns the table renders — `*` pulls huge description blobs for every row.
  const LIST_COLUMNS =
    'id,sku,name,name_ar,slug,top_category,sub_category,detailed_category,source,images,price_sar,price_usd,cost_usd,moq,weight_kg,stock_qty,track_inventory,low_stock_threshold,labelling_available,is_featured,created_at,created_by,created_by_email,created_by_source';

  const fetchProducts = async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const build = () => {
      // `estimated` uses planner statistics — an exact count over ~100k+ rows times out.
      let query = supabase
        .from('products')
        .select(LIST_COLUMNS, { count: 'estimated' })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });
      if (search.trim()) {
        const term = search.trim();
        query = query.or(
          `sku.ilike.%${term}%,name.ilike.%${term}%,name_ar.ilike.%${term}%,top_category.ilike.%${term}%,sub_category.ilike.%${term}%,detailed_category.ilike.%${term}%`
        );
      }
      if (stockFilter === 'in_stock') query = query.gt('stock_qty', 0);
      else if (stockFilter === 'out_of_stock') query = query.lte('stock_qty', 0);
      if (arabicFilter === 'has_arabic') query = query.not('name_ar', 'is', null).neq('name_ar', '');
      else if (arabicFilter === 'no_arabic') query = query.or('name_ar.is.null,name_ar.eq.');
      if (imageFilter === 'has_images') query = (query as any).not('images', 'eq', '{}');
      else if (imageFilter === 'no_images') query = (query as any).eq('images', '{}');
      return query.range(from, to);
    };

    let { data, count, error } = await build();
    // Auto-retry on statement timeout (57014)
    for (let i = 0; error && (error as any).code === '57014' && i < 2; i++) {
      await new Promise(r => setTimeout(r, 600 * (i + 1)));
      ({ data, count, error } = await build());
    }
    if (error) {
      console.error('[AdminProducts] fetch error', error);
      toast.error(
        (error as any).code === '57014'
          ? 'Catalog is busy — try narrowing the search or filters.'
          : error.message
      );
      setLoading(false);
      return;
    }
    const rows = (data as unknown as Product[]) || [];
    setProducts(rows);
    setTotal(count || 0);
    setLoading(false);


    const ids = Array.from(new Set(rows.map(r => r.created_by).filter(Boolean))) as string[];
    if (ids.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', ids);
      const map: Record<string, string> = {};
      (profs || []).forEach((pr: any) => { map[pr.user_id] = pr.display_name || pr.email || ''; });
      setCreatorNames(prev => ({ ...prev, ...map }));
    }
  };

  // Compute 30-day sales velocity per product from orders
  const fetchVelocity = async () => {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { data } = await supabase
      .from('orders')
      .select('products')
      .gte('created_at', since.toISOString())
      .in('status', ['confirmed', 'processing', 'shipped', 'delivered']);
    const sold: Record<string, number> = {};
    (data || []).forEach((o: any) => {
      const items = Array.isArray(o.products) ? o.products : [];
      items.forEach((it: any) => {
        const pid = it.product_id;
        const qty = Number(it.quantity || 0);
        if (pid && qty > 0) sold[pid] = (sold[pid] || 0) + qty;
      });
    });
    const velocity: Record<string, number> = {};
    Object.entries(sold).forEach(([pid, qty]) => { velocity[pid] = qty / 30; });
    setVelocityMap(velocity);
  };

  useEffect(() => {
    fetchProducts();
    fetchVelocity();
  }, [page, stockFilter, arabicFilter, imageFilter, search]);

  const applyFilter = (setter: (v: any) => void) => (v: any) => { setPage(0); setter(v); };

  useEffect(() => {
    fetchPricingSettings(supabase).then(setPricing).catch(() => {});
  }, []);

  const handleAdd = () => navigate('/admin/products/new');
  const handleEdit = (p: Product) => navigate(`/admin/products/${p.id}`);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('products').delete().eq('id', deleteId);
    if (error) { toast.error(error.message); } else { toast.success('Product deleted'); fetchProducts(); }
    setDeleteId(null);
  };

  const handleDeleteAll = async () => {
    const { error } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) { toast.error(error.message); } else { toast.success('All products deleted'); fetchProducts(); }
    setDeleteAllConfirmOpen(false);
    setConfirmText('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Management"
        subtitle="Catalog inventory, imports, and pricing"
        actions={
          <>
            <Button
              variant="outline"
              disabled={refreshingCounts}
              onClick={async () => {
                setRefreshingCounts(true);
                const t = toast.loading('Refreshing category counts… this can take up to a minute on a large catalog');
                const { data, error } = await supabase.rpc('refresh_category_counts_cache' as any);
                toast.dismiss(t);
                if (error) toast.error(error.message);
                else toast.success(`Counts refreshed (${data} category rows)`);
                setRefreshingCounts(false);
              }}
              className="hover:scale-105 transition-transform duration-200"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshingCounts ? 'animate-spin' : ''}`} /> Refresh counts
            </Button>

            <Button variant="destructive" onClick={() => setDeleteAllOpen(true)} disabled={products.length === 0} className="hover:scale-105 transition-transform duration-200">
              <Trash2 className="h-4 w-4 mr-1" /> Delete All
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/products/import')} className="hover:scale-105 transition-transform duration-200">
              <Upload className="h-4 w-4 mr-1" /> Import Excel
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={activeFilterCount > 0 ? 'default' : 'outline'} className="hover:scale-105 transition-transform duration-200">
                  <Filter className="h-4 w-4 mr-1" /> Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">{activeFilterCount}</Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">Filter products</p>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-2 py-1 text-xs"
                      onClick={() => { setPage(0); setStockFilter('all'); setArabicFilter('all'); setImageFilter('all'); }}
                    >
                      <X className="h-3 w-3 mr-1" /> Clear
                    </Button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Stock</Label>
                  <Select value={stockFilter} onValueChange={applyFilter(setStockFilter)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All products</SelectItem>
                      <SelectItem value="in_stock">In stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Arabic content</Label>
                  <Select value={arabicFilter} onValueChange={applyFilter(setArabicFilter)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All products</SelectItem>
                      <SelectItem value="has_arabic">Has Arabic name</SelectItem>
                      <SelectItem value="no_arabic">Missing Arabic name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Images</Label>
                  <Select value={imageFilter} onValueChange={applyFilter(setImageFilter)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All products</SelectItem>
                      <SelectItem value="has_images">Has images</SelectItem>
                      <SelectItem value="no_images">No images</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
            <Button onClick={handleAdd} className="bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-105 transition-transform duration-200">
              <Plus className="h-4 w-4 mr-1" /> Add Product
            </Button>
          </>
        }
      />

      {/* Search row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search SKU, name, category…"
            value={search}
            onChange={(e) => { setPage(0); setSearch(e.target.value); }}
            className="pl-9 pr-8 w-full"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setPage(0); setSearch(''); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {search && (
          <p className="text-sm text-muted-foreground">
            {total} result{total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">Loading...</CardContent></Card>
        ) : products.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No products yet. Import from Excel to get started.</CardContent></Card>
        ) : (
          products.map((p, i) => (
            <Card
              key={p.id}
              className="opacity-0 animate-fade-in-up min-h-[72px]"
              style={{ animationDelay: `${100 + i * 40}ms`, animationFillMode: 'forwards' }}
            >
              <CardContent className="p-3">
                <div className="flex gap-3">
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]} alt={p.name} className="w-16 h-16 rounded-lg object-cover bg-muted shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs shrink-0">N/A</div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-medium text-sm leading-tight line-clamp-2">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">{p.sku}</p>
                    <AddedBy p={p} names={creatorNames} />
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={p.source === 'local' ? 'default' : 'secondary'} className="text-[10px]">{p.source}</Badge>
                      <span className="text-xs font-semibold">SAR {sellPriceSar(p).toFixed(2)}</span>
                      <span className="text-[10px] text-muted-foreground">MOQ {p.moq}</span>
                      {supplyBadge(p, velocityMap)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button variant="outline" size="sm" className="flex-1 h-9" onClick={() => handleEdit(p)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 text-destructive" onClick={() => setDeleteId(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                 <tr className="border-b bg-muted/50 text-muted-foreground">
                   <th className="text-left p-3">Image</th>
                   <th className="text-left p-3">SKU</th>
                  <th className="text-left p-3">Product</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Source</th>
                    <th className="text-left p-3">Cost</th>
                    <th className="text-left p-3">Weight</th>
                    <th className="text-left p-3">Selling</th>


                    <th className="text-left p-3">Margin</th>
                    <th className="text-left p-3">Added by</th>
                    <th className="text-right p-3">Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {loading ? (
                    <tr><td colSpan={11} className="p-6 text-center text-muted-foreground">Loading...</td></tr>
                  ) : products.length === 0 ? (
                    <tr><td colSpan={11} className="p-6 text-center text-muted-foreground">No products yet. Import from Excel to get started.</td></tr>
                 ) : (
                   products.map((p, i) => (
                     <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 opacity-0 animate-fade-in transition-all duration-300 group" style={{ animationDelay: `${250 + i * 60}ms`, animationFillMode: 'forwards' }}>
                       <td className="p-3">
                         {p.images && p.images.length > 0 ? (
                           <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded object-cover bg-muted" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                         ) : (
                           <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">N/A</div>
                         )}
                       </td>
                       <td className="p-3 font-mono text-xs">{p.sku}</td>
                       <td className="p-3 font-medium">{p.name}</td>
                       <td className="p-3 text-muted-foreground">{p.top_category}</td>
                       <td className="p-3"><Badge variant={p.source === 'local' ? 'default' : 'secondary'}>{p.source}</Badge></td>
                       <td className="p-3 text-muted-foreground whitespace-nowrap">
                         <div>${costUsd(p).toFixed(2)}</div>
                          <div className="text-xs">SAR {(costUsd(p) * (sellPriceUsd(p) > 0 ? sellPriceSar(p) / sellPriceUsd(p) : 3.75)).toFixed(2)}</div>
                        </td>
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          <div>{Number(p.weight_kg || 0).toFixed(2)} kg</div>
                          <div className="text-xs text-amber-600">+SAR {(Number(p.weight_kg || 0) * (pricing.sell_weight_rate || 0)).toFixed(2)}</div>
                        </td>
                        <td className="p-3 font-medium whitespace-nowrap">
                         <div>SAR {sellPriceSar(p).toFixed(2)}</div>
                         <div className="text-xs font-normal text-muted-foreground">${sellPriceUsd(p).toFixed(2)}</div>
                       </td>

                         <td className="p-3 text-emerald-600">{costUsd(p) > 0 ? `${(((sellPriceUsd(p) - costUsd(p)) / costUsd(p)) * 100).toFixed(0)}%` : '—'}</td>
                       <td className="p-3"><AddedBy p={p} names={creatorNames} /></td>
                       <td className="p-3">
                         <div className="flex items-center justify-end gap-1">
                           <Button
                             variant="ghost"
                             size="icon"
                             title="Preview product page"
                             onClick={() => window.open(`/product/${p.id}`, '_blank')}
                             className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted hover:scale-110 transition-all duration-200"
                           >
                             <Eye className="h-4 w-4" />
                           </Button>
                           <Button
                             variant="ghost"
                             size="icon"
                             title="Edit product"
                             onClick={() => handleEdit(p)}
                             className="h-8 w-8 rounded-full text-muted-foreground hover:text-accent hover:bg-accent/10 hover:scale-110 transition-all duration-200"
                           >
                             <Pencil className="h-4 w-4" />
                           </Button>
                           <Button
                             variant="ghost"
                             size="icon"
                             title="Delete product"
                             onClick={() => setDeleteId(p.id)}
                             className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:scale-110 transition-all duration-200"
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col gap-2 mt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="shrink-0">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
          <div className="flex max-w-full items-center gap-1 overflow-x-auto no-scrollbar [&>*]:shrink-0">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(0)}>
              First
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {(() => {
              const totalPages = Math.ceil(total / PAGE_SIZE);
              const pages: (number | string)[] = [];
              const maxVisible = 7;
              if (totalPages <= maxVisible) {
                for (let i = 0; i < totalPages; i++) pages.push(i);
              } else {
                let start = Math.max(0, page - 2);
                let end = Math.min(totalPages - 1, page + 2);
                if (page < 3) { start = 0; end = 4; }
                if (page > totalPages - 4) { start = totalPages - 5; end = totalPages - 1; }
                if (start > 0) { pages.push(0); if (start > 1) pages.push('...'); }
                for (let i = start; i <= end; i++) pages.push(i);
                if (end < totalPages - 1) { if (end < totalPages - 2) pages.push('...'); pages.push(totalPages - 1); }
              }
              return pages.map((p, idx) =>
                typeof p === 'number' ? (
                  <Button
                    key={idx}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                    className="min-w-[2rem]"
                  >
                    {p + 1}
                  </Button>
                ) : (
                  <span key={idx} className="px-1">{p}</span>
                )
              );
            })()}
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(Math.ceil(total / PAGE_SIZE) - 1)}>
              Last
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Are you sure you want to delete this product?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Products?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete all {total} products. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); setDeleteAllOpen(false); setDeleteAllConfirmOpen(true); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAllConfirmOpen} onOpenChange={(o) => { setDeleteAllConfirmOpen(o); if (!o) setConfirmText(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Final confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              To confirm, type <span className="font-mono font-semibold text-destructive">DELETE ALL</span> below. This will erase {total} products permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            autoFocus
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE ALL"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={confirmText !== 'DELETE ALL'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete All Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductsAdmin;
