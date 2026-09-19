import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Sparkles, Sliders, Filter, Image as ImageIcon, Monitor, Smartphone, MonitorSmartphone } from 'lucide-react';
import { toast } from 'sonner';
import {
  HERO_ORDER_LABELS,
  HERO_SOURCE_LABELS,
  HERO_WINDOW_LABELS,
  type HeroSettings,
  type HeroOrder,
  type HeroSource,
  type HeroWindow,
} from '@/lib/heroQuery';
import { CategoryCascadePicker } from './CategoryCascadePicker';
import { ManualProductPicker } from './ManualProductPicker';
import { FeaturedProductsManager } from './FeaturedProductsManager';
import { HeroLivePreview } from './HeroLivePreview';

const SOURCES_WITH_WINDOW: HeroSource[] = ['most_viewed', 'most_favourited', 'top_sellers'];
const SOURCES_WITH_CATEGORY: HeroSource[] = ['latest', 'most_viewed', 'most_favourited', 'top_sellers', 'featured', 'category'];

function defaults(): HeroSettings {
  return {
    id: '',
    product_source: 'latest',
    category_filter: [],
    category_filters: { top: [], sub: [], detailed: [] },
    product_count: 12,
    rotation_interval_ms: 4000,
    manual_product_ids: [],
    time_window: 'all',
    order_by: 'newest',
    show_out_of_stock: false,
    min_stock: 0,
    pause_on_hover: true,
    show_arrows: true,
    show_dots: true,
    enabled_desktop: true,
    enabled_mobile: true,
  };
}

export function HeroSettingsPanel() {
  const [settings, setSettings] = useState<HeroSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase.from('homepage_hero_settings').select('*').limit(1).single()
      .then(({ data }) => {
        if (data) {
          const merged = { ...defaults(), ...(data as any) };
          // Normalize jsonb category_filters
          if (typeof merged.category_filters === 'string') {
            try { merged.category_filters = JSON.parse(merged.category_filters); }
            catch { merged.category_filters = { top: [], sub: [], detailed: [] }; }
          }
          if (!merged.category_filters?.top) {
            merged.category_filters = { top: [], sub: [], detailed: [] };
          }
          setSettings(merged as HeroSettings);
        }
        setLoading(false);
      });
  }, []);

  const update = <K extends keyof HeroSettings>(key: K, value: HeroSettings[K]) => {
    setSettings(s => s ? { ...s, [key]: value } : s);
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from('homepage_hero_settings')
      .update({
        product_source: settings.product_source,
        category_filter: settings.category_filters?.top || [],
        category_filters: settings.category_filters as any,
        product_count: settings.product_count,
        rotation_interval_ms: settings.rotation_interval_ms,
        manual_product_ids: settings.manual_product_ids,
        time_window: settings.time_window,
        order_by: settings.order_by,
        show_out_of_stock: settings.show_out_of_stock,
        min_stock: settings.min_stock,
        pause_on_hover: settings.pause_on_hover,
        show_arrows: settings.show_arrows,
        show_dots: settings.show_dots,
        enabled_desktop: settings.enabled_desktop,
        enabled_mobile: settings.enabled_mobile,
      } as any)
      .eq('id', settings.id);
    setSaving(false);
    if (error) toast.error('Failed to save');
    else toast.success('Hero carousel saved');
  };

  if (loading || !settings) {
    return (
      <Card className="p-6 space-y-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </Card>
    );
  }

  const showWindow = SOURCES_WITH_WINDOW.includes(settings.product_source);
  const showCategoryFilter = SOURCES_WITH_CATEGORY.includes(settings.product_source);
  const showManual = settings.product_source === 'manual';
  const showFeatured = settings.product_source === 'featured';

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            Hero Carousel — Advanced Settings
          </h3>
          <p className="text-sm text-muted-foreground">
            Choose what plays in the homepage hero — most viewed, top sellers, featured, by category, or a manual list.
          </p>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2 shrink-0">
          <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      {/* Visibility per device */}
      <section className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-1.5">
          <MonitorSmartphone className="h-3.5 w-3.5" /> Show carousel on
        </Label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="flex items-center justify-between gap-3 p-3 border rounded-lg">
            <span className="flex items-center gap-2 text-sm">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              Desktop
              <span className={`text-[11px] font-medium ${settings.enabled_desktop ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {settings.enabled_desktop ? 'Enabled' : 'Disabled'}
              </span>
            </span>
            <Switch
              checked={settings.enabled_desktop}
              onCheckedChange={(v) => update('enabled_desktop', v)}
            />
          </label>
          <label className="flex items-center justify-between gap-3 p-3 border rounded-lg">
            <span className="flex items-center gap-2 text-sm">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              Mobile
              <span className={`text-[11px] font-medium ${settings.enabled_mobile ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {settings.enabled_mobile ? 'Enabled' : 'Disabled'}
              </span>
            </span>
            <Switch
              checked={settings.enabled_mobile}
              onCheckedChange={(v) => update('enabled_mobile', v)}
            />
          </label>
        </div>
        {!settings.enabled_desktop && !settings.enabled_mobile && (
          <p className="text-xs text-amber-600">
            The hero carousel is hidden everywhere — the hero text and buttons still show.
          </p>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT — Source + filters */}
        <div className="space-y-5">
          <section className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Product source
            </Label>
            <Select
              value={settings.product_source}
              onValueChange={(v) => update('product_source', v as HeroSource)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(HERO_SOURCE_LABELS) as HeroSource[]).map(s => (
                  <SelectItem key={s} value={s}>{HERO_SOURCE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          {showWindow && (
            <section className="space-y-2">
              <Label className="text-sm font-medium">Time window</Label>
              <Select
                value={settings.time_window}
                onValueChange={(v) => update('time_window', v as HeroWindow)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(HERO_WINDOW_LABELS) as HeroWindow[]).map(w => (
                    <SelectItem key={w} value={w}>{HERO_WINDOW_LABELS[w]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Rank products based on activity in this period.
              </p>
            </section>
          )}

          {showCategoryFilter && (
            <section className="space-y-2">
              <Label className="text-sm font-medium">
                Restrict to categories {settings.product_source !== 'category' && (
                  <span className="text-muted-foreground font-normal">(optional)</span>
                )}
              </Label>
              <CategoryCascadePicker
                value={settings.category_filters}
                onChange={(v) => update('category_filters', v)}
              />
            </section>
          )}

          {showManual && (
            <section className="space-y-2">
              <Label className="text-sm font-medium">Manually picked products</Label>
              <ManualProductPicker
                selectedIds={settings.manual_product_ids}
                onChange={(ids) => update('manual_product_ids', ids)}
              />
            </section>
          )}

          {showFeatured && (
            <section className="space-y-2">
              <Label className="text-sm font-medium">Featured products</Label>
              <FeaturedProductsManager />
              <p className="text-xs text-muted-foreground">
                Toggle the star to flag products as featured. They'll appear in this carousel and any other "Featured" surface.
              </p>
            </section>
          )}
        </div>

        {/* RIGHT — Behavior + preview */}
        <div className="space-y-5">
          <section className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5" /> Sort & filter
            </Label>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Order by</Label>
                <Select
                  value={settings.order_by}
                  onValueChange={(v) => update('order_by', v as HeroOrder)}
                  disabled={settings.product_source === 'manual'}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(HERO_ORDER_LABELS) as HeroOrder[])
                      .filter(o => o !== 'manual' || settings.product_source === 'manual')
                      .map(o => (
                        <SelectItem key={o} value={o}>{HERO_ORDER_LABELS[o]}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Number of products</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.product_count}
                  onChange={(e) =>
                    update('product_count', Math.max(1, Math.min(30, Number(e.target.value) || 1)))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Min stock</Label>
                <Input
                  type="number"
                  min={0}
                  value={settings.min_stock}
                  onChange={(e) => update('min_stock', Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
              <label className="flex items-center justify-between p-2 border rounded gap-2 mt-5">
                <span className="text-xs">Show out-of-stock</span>
                <Switch
                  checked={settings.show_out_of_stock}
                  onCheckedChange={(v) => update('show_out_of_stock', v)}
                />
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" /> Carousel behavior
            </Label>

            <div className="space-y-2">
              <Label className="text-xs">
                Rotation speed: {(settings.rotation_interval_ms / 1000).toFixed(1)}s
              </Label>
              <Slider
                min={1000}
                max={10000}
                step={500}
                value={[settings.rotation_interval_ms]}
                onValueChange={([v]) => update('rotation_interval_ms', v)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-center justify-between p-2 border rounded text-xs gap-1">
                <span>Pause hover</span>
                <Switch
                  checked={settings.pause_on_hover}
                  onCheckedChange={(v) => update('pause_on_hover', v)}
                />
              </label>
              <label className="flex items-center justify-between p-2 border rounded text-xs gap-1">
                <span>Arrows</span>
                <Switch
                  checked={settings.show_arrows}
                  onCheckedChange={(v) => update('show_arrows', v)}
                />
              </label>
              <label className="flex items-center justify-between p-2 border rounded text-xs gap-1">
                <span>Dots</span>
                <Switch
                  checked={settings.show_dots}
                  onCheckedChange={(v) => update('show_dots', v)}
                />
              </label>
            </div>
          </section>

          <HeroLivePreview settings={settings} />
        </div>
      </div>
    </Card>
  );
}
