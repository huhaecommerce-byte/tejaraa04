import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, ArrowDown, Search, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  images: string[];
}

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function ManualProductPicker({ selectedIds, onChange }: Props) {
  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);
  const [search, setSearch] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  useEffect(() => {
    supabase
      .from('products')
      .select('id,name,sku,images')
      .order('name')
      .limit(1000)
      .then(({ data }) => { if (data) setAllProducts(data as any); });
  }, []);

  const lookupById = new Map(allProducts.map(p => [p.id, p]));
  const selectedProducts = selectedIds.map(id => lookupById.get(id)).filter(Boolean) as ProductOption[];

  const filtered = allProducts
    .filter(p => !selectedIds.includes(p.id))
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 60);

  const add = (id: string) => {
    if (selectedIds.includes(id)) return;
    onChange([...selectedIds, id]);
  };

  const remove = (id: string) => onChange(selectedIds.filter(x => x !== id));

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...selectedIds];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  const handleBulkAdd = async () => {
    const skus = bulkText
      .split(/[\s,;\n]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (!skus.length) return;
    const { data } = await supabase
      .from('products')
      .select('id, sku')
      .in('sku', skus);
    if (!data || !data.length) {
      toast.error('No matching SKUs found');
      return;
    }
    const newIds = data.map((p: any) => p.id).filter((id: string) => !selectedIds.includes(id));
    if (!newIds.length) {
      toast.info('All matched products already selected');
      return;
    }
    onChange([...selectedIds, ...newIds]);
    toast.success(`Added ${newIds.length} product${newIds.length === 1 ? '' : 's'}`);
    setBulkText('');
    setBulkOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Selected list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium">
            Selected ({selectedProducts.length}) — drag-order with arrows
          </p>
          <Button size="sm" variant="ghost" onClick={() => setBulkOpen(!bulkOpen)} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Bulk add by SKU
          </Button>
        </div>

        {bulkOpen && (
          <div className="space-y-2 mb-2 p-2 border rounded">
            <Textarea
              placeholder="Paste SKUs separated by spaces, commas, or new lines…"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={3}
              className="text-xs"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleBulkAdd}>Add matched</Button>
              <Button size="sm" variant="ghost" onClick={() => setBulkOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {selectedProducts.length === 0 ? (
          <p className="text-xs text-muted-foreground italic p-3 border rounded bg-muted/20">
            None selected yet. Use the search below to add products.
          </p>
        ) : (
          <div className="space-y-1 max-h-56 overflow-y-auto border rounded-md p-1">
            {selectedProducts.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded">
                <div className="flex flex-col">
                  <button
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => move(idx, 1)}
                    disabled={idx === selectedProducts.length - 1}
                    className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-[10px] font-mono w-6 text-center text-muted-foreground">
                  #{idx + 1}
                </span>
                <div className="w-8 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                  {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{p.sku}</p>
                </div>
                <button
                  onClick={() => remove(p.id)}
                  className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search & add */}
      <div>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products to add…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="max-h-56 overflow-y-auto border rounded-md divide-y divide-border">
          {filtered.map(p => (
            <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer">
              <Checkbox checked={false} onCheckedChange={() => add(p.id)} />
              <div className="w-8 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{p.sku}</p>
              </div>
            </label>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground p-3 text-center">No products found</p>
          )}
        </div>
      </div>
    </div>
  );
}
