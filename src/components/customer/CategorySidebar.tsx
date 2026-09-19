import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Layers,
  Search,
  X,
  ArrowDownAZ,
  ArrowDown01,
  ChevronsUpDown,
  ChevronsDownUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ProductData } from '@/components/storefront/ProductCard';

/** Fully-qualified category key. Format: "top", "top::sub", or "top::sub::detailed". */
export type CategoryKey = string;

export interface CategorySelection {
  /** Set of selected category keys. Empty = all products. */
  keys: Set<CategoryKey>;
}

export const emptySelection = (): CategorySelection => ({ keys: new Set() });

export const keyForTop = (top: string) => top;
export const keyForSub = (top: string, sub: string) => `${top}::${sub}`;
export const keyForDetailed = (top: string, sub: string, det: string) =>
  `${top}::${sub}::${det}`;

/** Build labels for selected keys, for chip display. */
export function describeSelection(
  sel: CategorySelection
): { key: CategoryKey; label: string; path: string }[] {
  return Array.from(sel.keys).map(k => {
    const parts = k.split('::');
    return {
      key: k,
      label: parts[parts.length - 1],
      path: parts.join(' › '),
    };
  });
}

/** True if a product matches any selected key (OR logic). Kept for back-compat. */
export function productMatches(p: ProductData, sel: CategorySelection): boolean {
  if (sel.keys.size === 0) return true;
  for (const k of sel.keys) {
    const parts = k.split('::');
    if (parts.length === 1 && p.top_category === parts[0]) return true;
    if (
      parts.length === 2 &&
      p.top_category === parts[0] &&
      p.sub_category === parts[1]
    )
      return true;
    if (
      parts.length === 3 &&
      p.top_category === parts[0] &&
      p.sub_category === parts[1] &&
      p.detailed_category === parts[2]
    )
      return true;
  }
  return false;
}

/** Minimal category-bearing row used for tree building. */
export type CategoryRow = Pick<ProductData, 'top_category' | 'sub_category' | 'detailed_category'>;

/** Pre-aggregated count row from the `product_category_counts` view. */
export interface AggregatedCount {
  top_category: string | null;
  sub_category: string | null;
  detailed_category: string | null;
  cnt: number;
}

interface CategorySidebarProps {
  products?: ProductData[];
  /** Optional dedicated dataset for building the category tree & counts. */
  categorySource?: CategoryRow[];
  /** Pre-aggregated counts from the DB view. When provided, takes precedence. */
  aggregatedCounts?: AggregatedCount[];
  selection: CategorySelection;
  onChange: (sel: CategorySelection, meta?: { isLeaf?: boolean }) => void;
  className?: string;
  /** Show skeleton state while categories load. */
  loading?: boolean;
}

interface TreeNode {
  name: string;
  count: number;
  children: Map<string, TreeNode>;
}

function buildTreeFromRows(rows: CategoryRow[]): Map<string, TreeNode> {
  const root = new Map<string, TreeNode>();
  for (const p of rows) {
    const top = p.top_category;
    if (!top) continue;
    let topNode = root.get(top);
    if (!topNode) {
      topNode = { name: top, count: 0, children: new Map() };
      root.set(top, topNode);
    }
    topNode.count++;

    const sub = p.sub_category;
    if (!sub) continue;
    let subNode = topNode.children.get(sub);
    if (!subNode) {
      subNode = { name: sub, count: 0, children: new Map() };
      topNode.children.set(sub, subNode);
    }
    subNode.count++;

    const det = p.detailed_category;
    if (!det) continue;
    let detNode = subNode.children.get(det);
    if (!detNode) {
      detNode = { name: det, count: 0, children: new Map() };
      subNode.children.set(det, detNode);
    }
    detNode.count++;
  }
  return root;
}

function buildTreeFromAggregate(rows: AggregatedCount[]): Map<string, TreeNode> {
  const root = new Map<string, TreeNode>();
  for (const r of rows) {
    const top = r.top_category;
    const cnt = r.cnt || 0;
    if (!top) continue;
    let topNode = root.get(top);
    if (!topNode) {
      topNode = { name: top, count: 0, children: new Map() };
      root.set(top, topNode);
    }
    topNode.count += cnt;

    const sub = r.sub_category;
    if (!sub) continue;
    let subNode = topNode.children.get(sub);
    if (!subNode) {
      subNode = { name: sub, count: 0, children: new Map() };
      topNode.children.set(sub, subNode);
    }
    subNode.count += cnt;

    const det = r.detailed_category;
    if (!det) continue;
    let detNode = subNode.children.get(det);
    if (!detNode) {
      detNode = { name: det, count: 0, children: new Map() };
      subNode.children.set(det, detNode);
    }
    detNode.count += cnt;
  }
  return root;
}

/** Highlight matched query inside text. */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-primary/25 px-0.5 text-foreground">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

type SortMode = 'count' | 'name';

export function CategorySidebar({
  products,
  categorySource,
  aggregatedCounts,
  selection,
  onChange,
  className,
  loading,
}: CategorySidebarProps) {
  const tree = useMemo(() => {
    if (aggregatedCounts && aggregatedCounts.length > 0) {
      return buildTreeFromAggregate(aggregatedCounts);
    }
    const rows = categorySource ?? products ?? [];
    return buildTreeFromRows(rows);
  }, [aggregatedCounts, categorySource, products]);

  const [expandedTops, setExpandedTops] = useState<Set<string>>(new Set());
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('count');

  // Ref + state for the "scroll to more" floating arrow.
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const q = search.trim().toLowerCase();

  // Track scroll position to show/hide the bottom arrow button.
  useEffect(() => {
    const root = scrollAreaRef.current;
    if (!root) return;
    const vp = root.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
    if (!vp) return;
    viewportRef.current = vp;

    const update = () => {
      const more = vp.scrollHeight - vp.clientHeight - vp.scrollTop > 4;
      setCanScrollDown(more);
    };
    update();
    vp.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(vp);
    // Observe content size as well.
    const content = vp.firstElementChild;
    if (content) ro.observe(content as Element);
    return () => {
      vp.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  // Re-evaluate when filters/expansion change content height.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const more = vp.scrollHeight - vp.clientHeight - vp.scrollTop > 4;
    setCanScrollDown(more);
  }, [search, expandedTops, expandedSubs, sortMode]);

  const scrollDown = () => {
    const vp = viewportRef.current;
    if (!vp) return;
    vp.scrollBy({ top: Math.max(120, vp.clientHeight * 0.8), behavior: 'smooth' });
  };

  // Auto-expand the active top branch (accordion: only one at a time).
  useEffect(() => {
    if (selection.keys.size === 0) return;
    const tops = new Set<string>();
    const subs = new Set<string>();
    for (const k of selection.keys) {
      const parts = k.split('::');
      tops.add(parts[0]);
      if (parts.length === 2) subs.add(k);
      if (parts.length >= 3) subs.add(`${parts[0]}::${parts[1]}`);
    }
    setExpandedTops(tops);
    setExpandedSubs(subs);
  }, [selection]);

  const toggleTop = (name: string) => {
    setExpandedTops(prev => {
      // Accordion: collapse if already open, otherwise open only this one.
      if (prev.has(name)) return new Set();
      return new Set([name]);
    });
    // Collapse any sub-expansions belonging to other top branches.
    setExpandedSubs(prev => {
      const next = new Set<string>();
      for (const k of prev) {
        if (k.split('::')[0] === name) next.add(k);
      }
      return next;
    });
  };
  const toggleSub = (key: string) => {
    setExpandedSubs(prev => {
      // Accordion: collapse if open, otherwise open only this one
      // (siblings within the same top branch are collapsed).
      if (prev.has(key)) return new Set();
      return new Set([key]);
    });
  };

  const toggleKey = (key: CategoryKey, isLeaf = false) => {
    // Strict single-select at every level: clicking the active key clears it,
    // clicking anything else replaces the entire selection with just that key.
    if (selection.keys.has(key)) {
      onChange({ keys: new Set() }, { isLeaf });
    } else {
      onChange({ keys: new Set([key]) }, { isLeaf });
    }
    // Accordion behavior: ensure only the clicked top branch is expanded.
    const parts = key.split('::');
    const clickedTop = parts[0];
    setExpandedTops(new Set([clickedTop]));

    if (parts.length === 2) {
      // Sub-level click: always expand to show detailed categories.
      setExpandedSubs(new Set([key]));
    } else if (parts.length >= 3) {
      // Detailed click: keep its parent sub open.
      setExpandedSubs(new Set([`${parts[0]}::${parts[1]}`]));
    } else {
      // Top-level click: collapse all subs.
      setExpandedSubs(new Set());
    }
  };

  const removeKey = (key: CategoryKey) => {
    const next = new Set(selection.keys);
    next.delete(key);
    onChange({ keys: next });
  };

  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    const arr = [...nodes];
    if (sortMode === 'name') arr.sort((a, b) => a.name.localeCompare(b.name));
    else arr.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return arr;
  };

  const totalCount = useMemo(
    () => Array.from(tree.values()).reduce((s, n) => s + n.count, 0),
    [tree]
  );
  const allTops = useMemo(() => sortNodes(Array.from(tree.values())), [tree, sortMode]);

  // Filter tree by search query. Returns tops with filtered subs/dets.
  type FilteredTop = { node: TreeNode; subs: { node: TreeNode; dets: TreeNode[] }[] };
  const filteredTops = useMemo<FilteredTop[]>(() => {
    if (!q) {
      return allTops.map(t => ({
        node: t,
        subs: sortNodes(Array.from(t.children.values())).map(s => ({
          node: s,
          dets: sortNodes(Array.from(s.children.values())),
        })),
      }));
    }
    const out: FilteredTop[] = [];
    for (const top of allTops) {
      const topMatch = top.name.toLowerCase().includes(q);
      const subs: { node: TreeNode; dets: TreeNode[] }[] = [];
      for (const sub of sortNodes(Array.from(top.children.values()))) {
        const subMatch = sub.name.toLowerCase().includes(q);
        const dets = sortNodes(Array.from(sub.children.values())).filter(
          d => topMatch || subMatch || d.name.toLowerCase().includes(q)
        );
        if (subMatch || dets.length > 0 || topMatch) {
          subs.push({ node: sub, dets });
        }
      }
      if (topMatch || subs.length > 0) out.push({ node: top, subs });
    }
    return out;
  }, [allTops, q, sortMode]);

  // While searching, auto-expand everything that survived the filter.
  const effectiveExpandedTops = useMemo(() => {
    if (!q) return expandedTops;
    return new Set(filteredTops.map(t => t.node.name));
  }, [q, expandedTops, filteredTops]);
  const effectiveExpandedSubs = useMemo(() => {
    if (!q) return expandedSubs;
    const s = new Set<string>();
    for (const t of filteredTops) {
      for (const sub of t.subs) s.add(keyForSub(t.node.name, sub.node.name));
    }
    return s;
  }, [q, expandedSubs, filteredTops]);

  const isAllSelected = selection.keys.size === 0;
  const selectedCount = selection.keys.size;
  const selectedChips = describeSelection(selection);

  const allExpanded =
    expandedTops.size > 0 &&
    allTops.every(t => expandedTops.has(t.name)) &&
    allTops.every(t =>
      Array.from(t.children.keys()).every(s =>
        expandedSubs.has(keyForSub(t.name, s))
      )
    );

  const handleExpandToggleAll = () => {
    if (allExpanded) {
      setExpandedTops(new Set());
      setExpandedSubs(new Set());
    } else {
      const tops = new Set<string>();
      const subs = new Set<string>();
      for (const t of allTops) {
        tops.add(t.name);
        for (const s of t.children.keys()) subs.add(keyForSub(t.name, s));
      }
      setExpandedTops(tops);
      setExpandedSubs(subs);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          'flex h-full flex-col rounded-xl border border-border bg-card/40 backdrop-blur-sm',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-sm font-semibold truncate">Categories</h3>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    setSortMode(m => (m === 'count' ? 'name' : 'count'))
                  }
                  aria-label="Toggle sort"
                >
                  {sortMode === 'count' ? (
                    <ArrowDown01 className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownAZ className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Sort: {sortMode === 'count' ? 'Count (high→low)' : 'Name (A-Z)'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleExpandToggleAll}
                  aria-label={allExpanded ? 'Collapse all' : 'Expand all'}
                >
                  {allExpanded ? (
                    <ChevronsDownUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronsUpDown className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {allExpanded ? 'Collapse all' : 'Expand all'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Search */}
        <div className="border-b border-border/60 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search categories…"
              className="h-8 pl-8 pr-7 text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Selection summary */}
        {selectedCount > 0 && (
          <div className="border-b border-border/60 bg-primary/5 px-3 py-2">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-primary">
                {selectedCount} selected
              </span>
              <button
                onClick={() => onChange(emptySelection())}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedChips.map(chip => (
                <span
                  key={chip.key}
                  title={chip.path}
                  className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  <span className="truncate max-w-[120px]">{chip.label}</span>
                  <button
                    onClick={() => removeKey(chip.key)}
                    className="rounded-full hover:bg-primary/20"
                    aria-label={`Remove ${chip.path}`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="relative flex-1 min-h-0">
        <ScrollArea ref={scrollAreaRef} className="h-full px-2 pt-2 pb-12">
          {/* All products */}
          <button
            onClick={() => onChange(emptySelection())}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all',
              isAllSelected
                ? 'bg-primary/10 font-semibold text-primary shadow-sm'
                : 'text-foreground hover:bg-muted'
            )}
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" /> All products
            </span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                isAllSelected
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {totalCount.toLocaleString()}
            </span>
          </button>

          {/* Loading skeleton */}
          {loading && filteredTops.length === 0 && (
            <div className="mt-2 space-y-1.5 px-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          )}

          {/* Tree */}
          <div className="mt-1 space-y-0.5">
            {filteredTops.map(({ node: top, subs }) => {
              const isTopExpanded = effectiveExpandedTops.has(top.name);
              const topKey = keyForTop(top.name);
              const isTopChecked = selection.keys.has(topKey);
              const hasSelectedDescendant = Array.from(selection.keys).some(
                k => k.startsWith(`${top.name}::`)
              );
              const isTopActive = isTopChecked || hasSelectedDescendant;

              return (
                <div key={top.name}>
                  {/* Top row */}
                  <div
                    className={cn(
                      'group relative flex items-center rounded-lg transition-all',
                      isTopActive
                        ? 'bg-primary/10'
                        : 'hover:bg-muted/70'
                    )}
                  >
                    {isTopActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
                    )}
                    {/* Left chevron / spacer */}
                    {subs.length > 0 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => toggleTop(top.name)}
                            className="flex h-9 w-7 items-center justify-center rounded-l-lg text-foreground/70 hover:bg-primary/10 hover:text-foreground shrink-0"
                            aria-label={isTopExpanded ? 'Hide subcategories' : 'Show subcategories'}
                          >
                            <ChevronRight
                              className={cn(
                                'h-4 w-4 transition-transform duration-200',
                                isTopExpanded && 'rotate-90'
                              )}
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          {isTopExpanded ? 'Hide subcategories' : 'Show subcategories'}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="w-7 shrink-0" />
                    )}
                    <button
                      onClick={() => toggleKey(topKey, subs.length === 0)}
                      className="flex flex-1 cursor-pointer items-center gap-2 py-2 pl-1 pr-2 text-left min-w-0"
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full shrink-0',
                          isTopChecked
                            ? 'bg-primary'
                            : isTopActive
                              ? 'bg-primary/50'
                              : 'bg-muted-foreground/40 group-hover:bg-primary/60'
                        )}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={cn(
                              'truncate text-sm',
                              isTopChecked
                                ? 'font-semibold text-primary'
                                : 'font-medium text-foreground'
                            )}
                          >
                            <Highlight text={top.name} query={q} />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          {top.name}
                        </TooltipContent>
                      </Tooltip>
                      <span
                        className={cn(
                          'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold shrink-0',
                          isTopActive
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted/80 text-muted-foreground'
                        )}
                      >
                        {top.count.toLocaleString()}
                      </span>
                    </button>
                  </div>

                  {/* Sub level */}
                  {isTopExpanded && subs.length > 0 && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/60 pl-1.5">
                      {subs.map(({ node: sub, dets }) => {
                        const subKey = keyForSub(top.name, sub.name);
                        const isSubExpanded = effectiveExpandedSubs.has(subKey);
                        const isSubChecked = selection.keys.has(subKey);
                        const hasSelectedDet = Array.from(selection.keys).some(
                          k => k.startsWith(`${subKey}::`)
                        );
                        const isSubActive = isSubChecked || hasSelectedDet;
                        const hasDets = dets.length > 0;

                        return (
                          <div key={subKey}>
                            <div
                              className={cn(
                                'group relative flex items-center rounded-md transition-all',
                                isSubActive
                                  ? 'bg-primary/10'
                                  : 'hover:bg-muted/70'
                              )}
                            >
                              {isSubActive && (
                                <span className="absolute -left-1.5 top-1 bottom-1 w-0.5 rounded-full bg-primary" />
                              )}
                              {/* Left chevron / spacer */}
                              {hasDets ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => toggleSub(subKey)}
                                      className="flex h-7 w-7 items-center justify-center rounded-l-md text-foreground/70 hover:bg-primary/10 hover:text-foreground shrink-0"
                                      aria-label={isSubExpanded ? 'Hide detailed' : 'Show detailed'}
                                    >
                                      <ChevronRight
                                        className={cn(
                                          'h-3.5 w-3.5 transition-transform duration-200',
                                          isSubExpanded && 'rotate-90'
                                        )}
                                      />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="text-xs">
                                    {isSubExpanded ? 'Hide detailed' : 'Show detailed'}
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="w-7 shrink-0" />
                              )}
                              <button
                                onClick={() => toggleKey(subKey, !hasDets)}
                                className="flex flex-1 cursor-pointer items-center gap-2 py-1.5 pl-1 pr-2 text-left min-w-0"
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      className={cn(
                                        'truncate text-[13px]',
                                        isSubActive
                                          ? 'text-foreground font-medium'
                                          : 'text-foreground/90'
                                      )}
                                    >
                                      <Highlight text={sub.name} query={q} />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="text-xs">
                                    {sub.name}
                                  </TooltipContent>
                                </Tooltip>
                                <span
                                  className={cn(
                                    'ml-auto text-[10px] tabular-nums shrink-0',
                                    isSubActive
                                      ? 'text-primary/80 font-medium'
                                      : 'text-muted-foreground'
                                  )}
                                >
                                  {sub.count.toLocaleString()}
                                </span>
                              </button>
                            </div>

                            {/* Detailed level */}
                            {isSubExpanded && dets.length > 0 && (
                              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border/40 pl-1.5">
                                {dets.map(det => {
                                  const detKey = keyForDetailed(
                                    top.name,
                                    sub.name,
                                    det.name
                                  );
                                  const isDetChecked = selection.keys.has(detKey);
                                  return (
                                    <button
                                      key={det.name}
                                      onClick={() => toggleKey(detKey, true)}
                                      className={cn(
                                        'group relative flex w-full items-center gap-2 rounded-md py-1 pl-2 pr-2 text-left text-xs transition-all',
                                        isDetChecked
                                          ? 'bg-primary/10 font-semibold text-primary'
                                          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                                      )}
                                    >
                                      {isDetChecked && (
                                        <span className="absolute -left-1.5 top-1 bottom-1 w-0.5 rounded-full bg-primary" />
                                      )}
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="truncate flex-1">
                                            <Highlight text={det.name} query={q} />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="text-xs">
                                          {det.name}
                                        </TooltipContent>
                                      </Tooltip>
                                      <span className="ml-auto text-[10px] tabular-nums shrink-0">
                                        {det.count.toLocaleString()}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty states */}
          {!loading && filteredTops.length === 0 && q && (
            <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
              <Search className="h-5 w-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                No categories match "{search}"
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSearch('')}
              >
                Clear search
              </Button>
            </div>
          )}
          {!loading && allTops.length === 0 && !q && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No categories available.
            </p>
          )}
        </ScrollArea>
        {/* Full-width "more categories" arrow bar — always visible, sticky at bottom */}
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="pointer-events-none absolute inset-x-0 bottom-full h-6 bg-gradient-to-t from-background to-transparent" />
          <button
            type="button"
            onClick={scrollDown}
            aria-label="Show more categories"
            disabled={!canScrollDown}
            className="flex w-full items-center justify-center gap-1.5 border-t border-emerald-600/40 bg-emerald-600 py-2 text-[12px] font-semibold text-white shadow-[0_-4px_12px_-6px_hsl(var(--foreground)/0.2)] transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            More <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
