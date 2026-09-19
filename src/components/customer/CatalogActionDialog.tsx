import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CategorySidebar, emptySelection, type CategorySelection, type AggregatedCount } from '@/components/customer/CategorySidebar';
import { Loader2, Download, Lock, Sparkles } from 'lucide-react';
import { Link } from "@/lib/router-compat";
import { cn } from '@/lib/utils';
import { RecentExports } from './RecentExports';

export type ExportFormat = 'csv' | 'xlsx';

interface BaseProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  /** "no" / "limited" / "unlimited" / "yes" / numeric string */
  accessState: 'blocked' | 'limited' | 'unlimited';
  used: number;
  /** Effective monthly cap (Infinity if unlimited). */
  quota: number;
  loading: boolean;
  loadingUsage: boolean;
  /** Aggregated counts to render the category tree. */
  aggregatedCounts?: AggregatedCount[];
  /** Initial filter values pre-filled from current Catalog state. */
  initialSearch?: string;
  initialSource?: 'all' | 'local' | 'global';
  /** Show format picker (CSV/XLSX). */
  showFormat?: boolean;
  /** Show "all images" toggle. */
  showAllImagesToggle?: boolean;
  /** Submit handler. */
  onSubmit: (params: {
    limit: number;
    format: ExportFormat;
    source: 'all' | 'local' | 'global';
    search: string;
    categories: string[];
    allImages: boolean;
  }) => Promise<void>;
  /** CTA label when allowed. */
  submitLabel: string;
  /** Verb shown in disabled-quota message. */
  unitName: string; // e.g. "rows", "products"
}

export function CatalogActionDialog(props: BaseProps) {
  const {
    open, onOpenChange, title, description,
    accessState, used, quota, loading, loadingUsage,
    aggregatedCounts, initialSearch = '', initialSource = 'all',
    showFormat, showAllImagesToggle, onSubmit, submitLabel, unitName,
  } = props;

  const [selection, setSelection] = useState<CategorySelection>(emptySelection());
  const [limit, setLimit] = useState<number>(50);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [source, setSource] = useState<'all' | 'local' | 'global'>(initialSource);
  const [search, setSearch] = useState(initialSearch);
  const [allImages, setAllImages] = useState(false);

  const remaining = useMemo(() => {
    if (!isFinite(quota)) return Infinity;
    return Math.max(0, quota - used);
  }, [used, quota]);

  // When dialog opens, default the qty to remaining (capped at 100 for ux)
  useEffect(() => {
    if (open) {
      setSearch(initialSearch);
      setSource(initialSource);
      const def = isFinite(remaining) ? Math.min(remaining, 100) : 100;
      setLimit(def > 0 ? def : 1);
    }
  }, [open, initialSearch, initialSource, remaining]);

  const blocked = accessState === 'blocked';
  const exhausted = !blocked && isFinite(remaining) && remaining <= 0;
  const cappedLimit = isFinite(remaining) ? Math.min(limit, remaining) : limit;
  const wasCapped = isFinite(remaining) && limit > remaining;

  const submit = async () => {
    if (blocked || exhausted || loading) return;
    await onSubmit({
      limit: cappedLimit,
      format, source, search: search.trim(),
      categories: Array.from(selection.keys),
      allImages,
    });
  };

  const usagePct = isFinite(quota) && quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>

          {/* Quota strip */}
          <div className="mt-3 rounded-lg border bg-muted/30 p-3">
            {loadingUsage ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Checking your plan usage…
              </div>
            ) : blocked ? (
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                  Not included in your current plan.
                </span>
                <Link to="/pricing">
                  <Button size="sm" variant="default" className="h-7 gap-1 text-xs">
                    <Sparkles className="h-3 w-3" /> Upgrade
                  </Button>
                </Link>
              </div>
            ) : !isFinite(quota) ? (
              <div className="flex items-center gap-2 text-xs">
                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Unlimited</Badge>
                <span className="text-muted-foreground">Your plan has no monthly cap on this feature.</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Used <span className="font-medium text-foreground">{used.toLocaleString()}</span> of{' '}
                    <span className="font-medium text-foreground">{quota.toLocaleString()}</span> {unitName} this month
                  </span>
                  <span className={cn(
                    "font-medium",
                    remaining === 0 ? "text-destructive" : "text-foreground"
                  )}>
                    {remaining.toLocaleString()} remaining
                  </span>
                </div>
                <Progress value={usagePct} className="h-1.5" />
                {exhausted && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-xs text-destructive">Monthly quota reached.</span>
                    <Link to="/pricing">
                      <Button size="sm" variant="default" className="h-7 gap-1 text-xs">
                        <Sparkles className="h-3 w-3" /> Upgrade
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Body: grid of categories + filters — single scrollable column on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-0 flex-1 overflow-y-auto md:overflow-hidden">
          {/* Categories */}
          <div className="border-b md:border-b-0 md:border-r bg-muted/10 flex flex-col overflow-hidden h-[45dvh] min-h-[280px] max-h-[440px] md:h-auto md:min-h-0 md:max-h-none shrink-0">
            <div className="px-3 py-2 border-b bg-background/50 shrink-0">
              <div className="text-xs font-medium">Categories</div>
              <div className="text-[10px] text-muted-foreground">
                {selection.keys.size === 0 ? 'All categories' : `${selection.keys.size} selected`}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <CategorySidebar
                aggregatedCounts={aggregatedCounts}
                selection={selection}
                onChange={setSelection}
                className="h-full"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 space-y-3 overflow-visible md:overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Source</Label>
                <Select value={source} onValueChange={(v: any) => setSource(v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="local">Local (KSA)</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showFormat && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Format</Label>
                  <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                      <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Number of {unitName} {isFinite(remaining) && <span className="text-muted-foreground">(max {remaining.toLocaleString()})</span>}
              </Label>
              <Input
                type="number"
                min={1}
                max={isFinite(remaining) ? remaining : 100000}
                value={limit}
                onChange={(e) => setLimit(Math.max(1, Number(e.target.value) || 1))}
                className="h-9 text-xs"
                disabled={blocked || exhausted}
              />
              {wasCapped && (
                <p className="text-[10px] text-amber-600">Auto-capped to your remaining quota of {remaining.toLocaleString()}.</p>
              )}
            </div>

            {showAllImagesToggle && (
              <label className="flex items-center gap-2 text-xs cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={allImages}
                  onChange={(e) => setAllImages(e.target.checked)}
                  className="rounded border-input"
                />
                Include all images per product (default: first image only)
              </label>
            )}

            <RecentExports inProgress={loading} />
          </div>
        </div>

        <DialogFooter className="px-5 py-3 border-t bg-muted/20 gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={blocked || exhausted || loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
