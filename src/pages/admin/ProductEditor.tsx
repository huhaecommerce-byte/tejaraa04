import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from '@/lib/router-compat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ExternalLink, Save, Languages, Loader2 } from 'lucide-react';
import { translateText } from '@/lib/translate.functions';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { computeSellingPriceSar, computeSellingPriceUsd, fetchPricingSettings, costUsd, DEFAULT_PRICING, type PricingSettings } from '@/lib/priceConversion';
import { slugify, slugifyAr, SITE_URL } from '@/lib/seo/slug';
import { CategoryLevelSelect } from '@/components/admin/CategoryLevelSelect';

type CatRow = { top: string; sub: string; detail: string };


const emptyForm = {
  sku: '', name: '', name_ar: '', top_category: 'General', sub_category: '', detailed_category: '',
  source: 'local', cost_usd: 0, moq: 1, weight_kg: 0,
  description: '', description_ar: '', estimated_delivery: '', labelling_available: false,
  platforms: [] as string[],
  stock_qty: 0, low_stock_threshold: 10, supplier_id: '' as string, track_inventory: false,
  images: [] as string[],
  slug: '', slug_ar: '',
};

type Form = typeof emptyForm;

const ProductEditor = () => {
  const navigate = useNavigate();
  const params = useParams() as { id?: string };
  const productId = params?.id;
  const isEdit = !!productId;

  const [form, setForm] = useState<Form>(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [addedBy, setAddedBy] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [slugManual, setSlugManual] = useState(false);
  const [slugArManual, setSlugArManual] = useState(false);
  const dirty = useRef(false);

  const [translating, setTranslating] = useState<null | 'name' | 'description' | 'all'>(null);

  const set = (field: keyof Form, value: any) => {
    dirty.current = true;
    setForm(f => ({ ...f, [field]: value }));
  };

  const translateField = async (field: 'name' | 'description') => {
    const source = (field === 'name' ? form.name : form.description).trim();
    if (!source) { toast.error(`Add the English ${field} first`); return; }
    setTranslating(field);
    try {
      const { translated } = await translateText({ data: { text: source, from: 'en', to: 'ar' } });
      if (field === 'name') {
        set('name_ar', translated);
        set('slug_ar', slugifyAr(translated));
      } else {
        set('description_ar', translated);
      }
      toast.success(`Arabic ${field} translated`);
    } catch (e: any) {
      toast.error(e?.message || 'Translation failed');
    } finally {
      setTranslating(null);
    }
  };

  const translateAll = async () => {
    if (!form.name.trim() && !form.description.trim()) { toast.error('Nothing to translate'); return; }
    setTranslating('all');
    try {
      const jobs: Promise<void>[] = [];
      if (form.name.trim()) {
        jobs.push(translateText({ data: { text: form.name.trim(), from: 'en', to: 'ar' } })
          .then(r => { set('name_ar', r.translated); set('slug_ar', slugifyAr(r.translated)); }));
      }
      if (form.description.trim()) {
        jobs.push(translateText({ data: { text: form.description.trim(), from: 'en', to: 'ar' } })
          .then(r => set('description_ar', r.translated)));
      }
      await Promise.all(jobs);
      toast.success('Arabic content translated');
    } catch (e: any) {
      toast.error(e?.message || 'Translation failed');
    } finally {
      setTranslating(null);
    }
  };


  const [catRows, setCatRows] = useState<CatRow[]>([]);

  useEffect(() => {
    supabase.from('suppliers').select('id, name').eq('is_active', true).order('name').then(({ data }) => {
      setSuppliers((data as any) || []);
    });
    fetchPricingSettings(supabase as any).then(setPricing).catch(() => {});
    (async () => {
      const rows: CatRow[] = [];
      for (let page = 0; page < 30; page++) {
        const { data, error } = await supabase
          .from('product_category_counts_cache')
          .select('top_category, sub_category, detailed_category')
          .order('top_category')
          .range(page * 1000, page * 1000 + 999);
        if (error) break;
        const chunk = (data as any[]) || [];
        for (const r of chunk) {
          rows.push({
            top: r.top_category ?? '',
            sub: r.sub_category ?? '',
            detail: r.detailed_category ?? '',
          });
        }
        if (chunk.length < 1000) break;
      }
      setCatRows(rows);
    })();
  }, []);

  const topOptions = useMemo(
    () => Array.from(new Set(catRows.map(r => r.top).filter(Boolean))).sort(),
    [catRows],
  );
  const subOptions = useMemo(
    () => Array.from(new Set(catRows.filter(r => r.top === form.top_category).map(r => r.sub).filter(Boolean))).sort(),
    [catRows, form.top_category],
  );
  const detailOptions = useMemo(
    () => Array.from(new Set(
      catRows.filter(r => r.top === form.top_category && r.sub === form.sub_category).map(r => r.detail).filter(Boolean),
    )).sort(),
    [catRows, form.top_category, form.sub_category],
  );


  useEffect(() => {
    if (!productId) { setForm(emptyForm); setLoading(false); return; }
    let active = true;
    setLoading(true);
    supabase.from('products').select('*').eq('id', productId).maybeSingle().then(({ data, error }) => {
      if (!active) return;
      if (error || !data) { toast.error(error?.message || 'Product not found'); setLoading(false); return; }
      const p = data as any;
      setForm({
        sku: p.sku || '', name: p.name || '', name_ar: p.name_ar || '',
        top_category: p.top_category || 'General', sub_category: p.sub_category || '',
        detailed_category: p.detailed_category || '', source: p.source || 'local',
        cost_usd: costUsd(p), moq: p.moq ?? 1, weight_kg: p.weight_kg ?? 0,
        description: p.description || '', description_ar: p.description_ar || '',
        estimated_delivery: p.estimated_delivery || '',
        labelling_available: p.labelling_available || false, platforms: p.platforms || [],
        stock_qty: p.stock_qty ?? 0, low_stock_threshold: p.low_stock_threshold ?? 10,
        supplier_id: p.supplier_id || '', track_inventory: p.track_inventory ?? false,
        images: Array.isArray(p.images) ? [...p.images] : [],
        slug: p.slug || '', slug_ar: p.slug_ar || '',
      });
      setSlugManual(!!p.slug);
      setSlugArManual(!!p.slug_ar);
      dirty.current = false;
      setLoading(false);
      const srcLabel = ({ manual: 'added manually', import: 'Excel import', sunsky: 'SunSky sync', sourcing: 'sourcing request' } as Record<string, string>)[p.created_by_source || 'manual'] || p.created_by_source;
      if (p.created_by) {
        supabase.from('profiles').select('display_name, email').eq('user_id', p.created_by).maybeSingle()
          .then(({ data: prof }: any) => {
            if (!active) return;
            setAddedBy(`${prof?.display_name || prof?.email || p.created_by_email || 'Unknown user'} · ${srcLabel}`);
          });
      } else {
        setAddedBy(`System · ${srcLabel}`);
      }
    });
    return () => { active = false; };
  }, [productId]);

  // Auto slugs when not manually overridden
  const autoSlug = useMemo(() => slugify(form.name), [form.name]);
  const autoSlugAr = useMemo(() => slugifyAr(form.name_ar) || autoSlug, [form.name_ar, autoSlug]);
  const effectiveSlug = slugManual && form.slug ? form.slug : autoSlug;
  const effectiveSlugAr = slugArManual && form.slug_ar ? form.slug_ar : autoSlugAr;

  const sellSar = computeSellingPriceSar(form.cost_usd, form.weight_kg, pricing, form.source);
  const sellUsd = computeSellingPriceUsd(form.cost_usd, form.weight_kg, pricing, form.source);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (dirty.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const goBack = () => {
    if (dirty.current && !window.confirm('You have unsaved changes. Leave this page?')) return;
    navigate('/admin/catalog-hub');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) { toast.error('SKU and Name are required'); return; }
    setSaving(true);

    const payload: Record<string, any> = {
      sku: form.sku.trim(), name: form.name.trim(), name_ar: form.name_ar.trim() || null,
      top_category: form.top_category, sub_category: form.sub_category, detailed_category: form.detailed_category,
      source: form.source, cost_usd: form.cost_usd,
      price_sar: parseFloat(sellSar.toFixed(2)),
      price_usd: parseFloat(sellUsd.toFixed(2)),
      moq: form.moq, weight_kg: form.weight_kg,
      description: form.description || null,
      description_ar: form.description_ar || null,
      estimated_delivery: form.estimated_delivery || null,
      labelling_available: form.labelling_available,
      platforms: form.platforms,
      stock_qty: form.stock_qty, low_stock_threshold: form.low_stock_threshold,
      supplier_id: form.supplier_id || null, track_inventory: form.track_inventory,
      images: form.images,
      slug: effectiveSlug || null,
      slug_ar: effectiveSlugAr || null,
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from('products').update(payload as any).eq('id', productId!));
    } else {
      ({ error } = await supabase.from('products').insert({ ...payload, created_by_source: 'manual' } as any));
    }

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    dirty.current = false;
    toast.success(isEdit ? 'Product updated' : 'Product created');
    navigate('/admin/catalog-hub');
  };

  const moveImage = (from: number, to: number) => {
    dirty.current = true;
    setForm(f => {
      if (to < 0 || to >= f.images.length) return f;
      const imgs = [...f.images];
      const [m] = imgs.splice(from, 1);
      imgs.splice(to, 0, m);
      return { ...f, images: imgs };
    });
  };
  const removeImage = (i: number) => { dirty.current = true; setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) })); };
  const addImages = () => {
    const raw = newImageUrl.trim();
    if (!raw) return;
    const urls = raw.split(/[\n,\s]+/).map(u => u.trim()).filter(Boolean);
    dirty.current = true;
    setForm(f => ({ ...f, images: [...f.images, ...urls.filter(u => !f.images.includes(u))] }));
    setNewImageUrl('');
  };

  if (loading) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Loading product…</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="ghost" size="icon" onClick={goBack} aria-label="Back to products">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold">{isEdit ? (form.name || 'Edit product') : 'New product'}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {form.sku || 'No SKU yet'}
              {isEdit && addedBy && <span className="ml-2 border-l pl-2">Added by {addedBy}</span>}
            </p>
          </div>
          {isEdit && effectiveSlug && (
            <Button asChild type="button" variant="outline" size="sm">
              <a href={`/product/${effectiveSlug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View
              </a>
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={goBack}>Cancel</Button>
          <Button type="submit" size="sm" disabled={saving}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Basics */}
          <Card>
            <CardHeader><CardTitle className="text-base">Basics</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><Label>SKU *</Label><Input value={form.sku} onChange={e => set('sku', e.target.value)} required /></div>
              <div><Label>Name *</Label><Input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
              <div>
                <Label>Source</Label>
                <Select value={form.source} onValueChange={v => set('source', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>MOQ (min 1)</Label><Input type="number" min={1} value={form.moq} onChange={e => set('moq', Math.max(1, Number(e.target.value)))} /></div>
              <div><Label>Weight (kg)</Label><Input type="number" min={0} step={0.01} value={form.weight_kg} onChange={e => set('weight_kg', Number(e.target.value))} /></div>
              <div><Label>Est. Delivery</Label><Input value={form.estimated_delivery} onChange={e => set('estimated_delivery', e.target.value)} placeholder="e.g. 3-5 days" /></div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Switch checked={form.labelling_available} onCheckedChange={v => set('labelling_available', v)} />
                <Label>Labelling available</Label>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader><CardTitle className="text-base">Categories</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <CategoryLevelSelect
                label="Top Category"
                value={form.top_category}
                options={topOptions}
                onChange={v => { set('top_category', v); set('sub_category', ''); set('detailed_category', ''); }}
              />
              <CategoryLevelSelect
                label="Sub Category"
                value={form.sub_category}
                options={subOptions}
                disabled={!form.top_category}
                placeholder={form.top_category ? undefined : 'Select top category first'}
                onChange={v => { set('sub_category', v); set('detailed_category', ''); }}
              />
              <CategoryLevelSelect
                label="Detailed Category"
                value={form.detailed_category}
                options={detailOptions}
                disabled={!form.sub_category}
                placeholder={form.sub_category ? undefined : 'Select sub category first'}
                onChange={v => set('detailed_category', v)}
              />
            </CardContent>

          </Card>

          {/* English content */}
          <Card>
            <CardHeader><CardTitle className="text-base">English content</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Description</Label>
                <Textarea rows={12} value={form.description} onChange={e => set('description', e.target.value)} className="font-mono text-xs" />
              </div>
              <p className="text-xs text-muted-foreground break-all">{SITE_URL}/product/{effectiveSlug || '…'}</p>
            </CardContent>
          </Card>

          {/* Arabic content */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">Arabic content (العربية)</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={translating !== null}
                onClick={() => translateAll()}
              >
                {translating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
                Auto-translate
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Label>Arabic name</Label>
                  <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs"
                    disabled={translating !== null || !form.name.trim()}
                    onClick={() => translateField('name')}>
                    {translating === 'name' ? 'Translating…' : 'Translate name'}
                  </Button>
                </div>
                <Input value={form.name_ar} onChange={e => set('name_ar', e.target.value)} dir="rtl" />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Label>Arabic description</Label>
                  <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs"
                    disabled={translating !== null || !form.description.trim()}
                    onClick={() => translateField('description')}>
                    {translating === 'description' ? 'Translating…' : 'Translate description'}
                  </Button>
                </div>
                <Textarea rows={10} dir="rtl" value={form.description_ar} onChange={e => set('description_ar', e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">Used on the Arabic product page and its meta description. Falls back to English when empty.</p>
              </div>
              <p className="text-xs text-muted-foreground break-all">{SITE_URL}/ar/product/{effectiveSlugAr || '…'}</p>
            </CardContent>
          </Card>


          {/* SEO & URLs */}
          <Card>
            <CardHeader><CardTitle className="text-base">SEO &amp; URLs</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>English slug</Label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch checked={slugManual} onCheckedChange={v => { setSlugManual(v); if (v && !form.slug) set('slug', autoSlug); }} />
                    Edit manually
                  </label>
                </div>
                <Input value={slugManual ? form.slug : autoSlug} disabled={!slugManual} onChange={e => set('slug', slugify(e.target.value))} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Arabic slug</Label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch checked={slugArManual} onCheckedChange={v => { setSlugArManual(v); if (v && !form.slug_ar) set('slug_ar', autoSlugAr); }} />
                    Edit manually
                  </label>
                </div>
                <Input value={slugArManual ? form.slug_ar : autoSlugAr} disabled={!slugArManual} onChange={e => set('slug_ar', slugifyAr(e.target.value))} />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Images ({form.images.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Drag or use arrows to reorder · first image is the main one</p>
              {form.images.length === 0 ? (
                <p className="text-sm text-muted-foreground">No images yet. Add image URLs below.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
                  {form.images.map((url, i) => (
                    <div
                      key={`${url}-${i}`}
                      draggable
                      onDragStart={() => setDragIndex(i)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); if (dragIndex !== null && dragIndex !== i) moveImage(dragIndex, i); setDragIndex(null); }}
                      onDragEnd={() => setDragIndex(null)}
                      className={`group relative aspect-square overflow-hidden rounded-md border bg-background ${dragIndex === i ? 'opacity-50' : ''}`}
                    >
                      <img src={url} alt={`${form.name || 'Product'} image ${i + 1}`} loading="lazy" className="h-full w-full object-contain" />
                      {i === 0 && (
                        <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">Main</span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-background/85 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex gap-1">
                          <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={i === 0} onClick={() => moveImage(i, i - 1)} aria-label="Move left">←</Button>
                          <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={i === form.images.length - 1} onClick={() => moveImage(i, i + 1)} aria-label="Move right">→</Button>
                        </div>
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeImage(i)} aria-label="Delete image">✕</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImages(); } }}
                  placeholder="Paste image URL(s), comma or newline separated"
                />
                <Button type="button" variant="secondary" onClick={addImages}>Add</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Cost price (USD)</Label>
                <Input type="number" min={0} step={0.01} value={form.cost_usd} onChange={e => set('cost_usd', Number(e.target.value))} />
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Selling price (SAR)</span><span className="font-semibold">{sellSar.toFixed(2)}</span></div>
                <div className="mt-1 flex items-center justify-between"><span className="text-muted-foreground">Selling price (USD)</span><span className="font-semibold">{sellUsd.toFixed(2)}</span></div>
                <p className="mt-2 text-xs text-muted-foreground">Calculated automatically from the global pricing formula in Settings → Pricing.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Inventory</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={form.track_inventory} onCheckedChange={v => set('track_inventory', v)} />
                <Label>Track stock</Label>
              </div>
              <div><Label>Stock qty</Label><Input type="number" min={0} value={form.stock_qty} onChange={e => set('stock_qty', Number(e.target.value))} disabled={!form.track_inventory} /></div>
              <div><Label>Low stock alert</Label><Input type="number" min={0} value={form.low_stock_threshold} onChange={e => set('low_stock_threshold', Number(e.target.value))} disabled={!form.track_inventory} /></div>
              <div>
                <Label>Supplier</Label>
                <Select value={form.supplier_id || 'none'} onValueChange={v => set('supplier_id', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
};

export default ProductEditor;
