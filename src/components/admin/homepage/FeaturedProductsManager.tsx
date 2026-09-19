import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Search, Star, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  images: string[];
  is_featured: boolean;
}

export function FeaturedProductsManager() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [search, setSearch] = useState('');
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('id,name,sku,images,is_featured')
      .order('is_featured', { ascending: false })
      .order('name')
      .limit(1000);
    if (data) setProducts(data as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleFeatured = async (p: ProductRow) => {
    const next = !p.is_featured;
    setProducts(curr => curr.map(x => x.id === p.id ? { ...x, is_featured: next } : x));
    const { error } = await supabase
      .from('products')
      .update({ is_featured: next })
      .eq('id', p.id);
    if (error) {
      toast.error('Failed to update');
      setProducts(curr => curr.map(x => x.id === p.id ? { ...x, is_featured: !next } : x));
    }
  };

  const featuredCount = products.filter(p => p.is_featured).length;
  const filtered = products
    .filter(p => !showOnlyFeatured || p.is_featured)
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          {featuredCount} product{featuredCount === 1 ? '' : 's'} featured
        </p>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
          <Checkbox
            checked={showOnlyFeatured}
            onCheckedChange={(v) => setShowOnlyFeatured(!!v)}
          />
          Show featured only
        </label>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products to feature…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="max-h-72 overflow-y-auto border rounded-md divide-y divide-border">
        {loading ? (
          <p className="p-3 text-xs text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-3 text-xs text-muted-foreground text-center">No products</p>
        ) : (
          filtered.map(p => (
            <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer">
              <Checkbox
                checked={p.is_featured}
                onCheckedChange={() => toggleFeatured(p)}
              />
              <div className="w-8 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate flex items-center gap-1.5">
                  {p.is_featured && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                  {p.name}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">{p.sku}</p>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
