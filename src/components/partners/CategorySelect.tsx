import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Field } from "@/components/partners/SupplierShell";

export interface CategoryRow {
  category_id: number;
  parent_id: number | null;
  name: string;
  name_ar?: string | null;
  level: number;
  has_children: boolean;
}

export interface CategoryValue {
  l1: number | null;
  l2: number | null;
  l3: number | null;
  path: string;
}

export const emptyCategoryValue = (): CategoryValue => ({ l1: null, l2: null, l3: null, path: "" });

/** Deepest selected id — the one products are filed under. */
export function categoryLeafId(v: CategoryValue) {
  return v.l3 ?? v.l2 ?? v.l1 ?? null;
}

/** A category is only complete once no deeper level remains to pick. */
export function isCategoryComplete(v: CategoryValue, rows: CategoryRow[]) {
  const leaf = categoryLeafId(v);
  if (!leaf) return false;
  const row = rows.find((r) => r.category_id === leaf);
  return !row?.has_children;
}

async function fetchAllCategories(): Promise<CategoryRow[]> {
  const PAGE = 1000;
  const out: CategoryRow[] = [];
  for (let i = 0; i < 20; i++) {
    const { data, error } = await supabase
      .from("sunsky_categories")
      .select("category_id,parent_id,name,name_ar,level,has_children")
      .order("name")
      .range(i * PAGE, i * PAGE + PAGE - 1);
    if (error) break;
    const batch = (data ?? []) as CategoryRow[];
    out.push(...batch);
    if (batch.length < PAGE) break;
  }
  return out;
}

let cache: CategoryRow[] | null = null;
let inflight: Promise<CategoryRow[]> | null = null;

export function useCategoryTree() {
  // Drop a stale cache from before Arabic names existed (older in-memory copy).
  if (cache && cache.length > 0 && !cache.some((r) => r.name_ar)) cache = null;
  const [rows, setRows] = useState<CategoryRow[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    inflight = inflight ?? fetchAllCategories();
    void inflight.then((data) => {
      cache = data;
      inflight = null;
      if (alive) { setRows(data); setLoading(false); }
    });
    return () => { alive = false; };
  }, []);

  return { rows, loading };
}

export function buildCategoryPath(rows: CategoryRow[], value: CategoryValue) {
  const nameOf = (id: number | null) => (id == null ? "" : rows.find((r) => r.category_id === id)?.name ?? "");
  return [nameOf(value.l1), nameOf(value.l2), nameOf(value.l3)].filter(Boolean).join(" › ");
}

/** Same path, in Arabic (falls back to the English name when not translated yet). */
export function buildCategoryPathAr(rows: CategoryRow[], value: CategoryValue) {
  const nameOf = (id: number | null) => {
    if (id == null) return "";
    const r = rows.find((x) => x.category_id === id);
    return r ? r.name_ar || r.name : "";
  };
  return [nameOf(value.l1), nameOf(value.l2), nameOf(value.l3)].filter(Boolean).join(" › ");
}


interface Props {
  value: CategoryValue;
  onChange: (next: CategoryValue) => void;
  rows: CategoryRow[];
  loading?: boolean;
}

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-muted-foreground">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-primary">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

/** Read-only field mirroring the selected category's Arabic name. */
function ArMirror({ text }: { text: string }) {
  return (
    <div
      className={`flex h-10 w-full items-center rounded-md border border-input bg-muted/30 px-3 text-sm ${
        text ? "font-medium text-foreground" : "text-muted-foreground"
      }`}
    >
      <span className="truncate">{text || "—"}</span>
    </div>
  );
}

interface PickerProps {
  placeholder: string;
  disabledHint?: string;
  disabled?: boolean;
  options: CategoryRow[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onOpenCascade?: () => void;
  /** Show Arabic names and lay the control out right-to-left. */
  arabic?: boolean;
}

function CategoryPicker({ placeholder, disabledHint, disabled, options, selectedId, onSelect, onOpenCascade, arabic }: PickerProps) {
  const label = (r: CategoryRow) => (arabic ? r.name_ar || r.name : r.name);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => options.find((r) => r.category_id === selectedId) ?? null, [options, selectedId]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return options;
    return options.filter((r) => {
      const hay = `${r.name} ${r.name_ar ?? ""}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [options, query]);

  const toggle = () => {
    if (disabled) return;
    if (!open && onOpenCascade) onOpenCascade();
    setOpen(!open);
    setQuery("");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 text-sm transition-colors ${
          open ? "border-primary ring-2 ring-primary/20" : "border-input bg-transparent"
        } ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-primary/50"}`}
      >
        <span
          dir={arabic ? "rtl" : undefined}
          className={`min-w-0 flex-1 truncate ${arabic ? "text-right" : "text-left"} ${selected ? "text-foreground font-medium" : "text-muted-foreground"}`}
        >
          {disabled && disabledHint ? disabledHint : selected ? label(selected) : placeholder}
        </span>
        {selected && !disabled ? (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Clear selection"
            className="rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            onMouseDown={(e) => {
              e.stopPropagation();
              onSelect(null);
            }}
          >
            <XIcon />
          </span>
        ) : (
          <ChevronIcon open={open} />
        )}
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <SearchIcon />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={arabic ? "بحث…" : "Search…"}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{filtered.length}</span>
            )}
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">No matches</div>
            ) : (
              filtered.map((r) => (
                <button
                  key={r.category_id}
                  type="button"
                  onClick={() => { onSelect(r.category_id); setOpen(false); }}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                    r.category_id === selectedId
                      ? "bg-primary/10 font-medium text-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">
                    <Highlighted text={label(r)} words={query.trim().toLowerCase().split(/\s+/).filter(Boolean)} />
                  </span>
                  {r.category_id === selectedId && <CheckIcon />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Highlights every occurrence of the search words inside a text. */
function Highlighted({ text, words }: { text: string; words: string[] }) {
  const parts = useMemo(() => {
    if (words.length === 0) return [text];
    const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    return text.split(new RegExp(`(${escaped.join("|")})`, "gi"));
  }, [text, words]);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-sm bg-primary/25 px-0 font-semibold text-foreground">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function PartnerCategorySelect({ value, onChange, rows, loading }: Props) {
  const byName = (a: CategoryRow, b: CategoryRow) => a.name.localeCompare(b.name);
  const tops = useMemo(() => rows.filter((r) => r.parent_id == null).sort(byName), [rows]);
  const subs = useMemo(
    () => (value.l1 == null ? [] : rows.filter((r) => r.parent_id === value.l1).sort(byName)),
    [rows, value.l1],
  );
  const details = useMemo(
    () => (value.l2 == null ? [] : rows.filter((r) => r.parent_id === value.l2).sort(byName)),
    [rows, value.l2],
  );

  const emit = (next: Omit<CategoryValue, "path">) => onChange({ ...next, path: buildCategoryPath(rows, { ...next, path: "" }) });

  const pathAr = useMemo(() => buildCategoryPathAr(rows, value), [rows, value]);

  // Arabic-sorted copies of the same options for the Arabic pickers.
  const byNameAr = (a: CategoryRow, b: CategoryRow) => (a.name_ar || a.name).localeCompare(b.name_ar || b.name, "ar");
  const topsAr = useMemo(() => [...tops].sort(byNameAr), [tops]);
  const subsAr = useMemo(() => [...subs].sort(byNameAr), [subs]);
  const detailsAr = useMemo(() => [...details].sort(byNameAr), [details]);

  /** Arabic display name for a selected id (falls back to English). */
  const nameArOf = (id: number | null) => {
    if (id == null) return "";
    const r = rows.find((x) => x.category_id === id);
    return r ? r.name_ar || r.name : "";
  };

  // ===== Global search across the whole tree =====
  const [gOpen, setGOpen] = useState(false);
  const [gQuery, setGQuery] = useState("");
  const gRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (gRef.current && !gRef.current.contains(e.target as Node)) setGOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [gOpen]);

  const rowById = useMemo(() => new Map(rows.map((r) => [r.category_id, r])), [rows]);

  const chainOf = (id: number): CategoryRow[] => {
    const chain: CategoryRow[] = [];
    let cur = rowById.get(id);
    while (cur) {
      chain.unshift(cur);
      cur = cur.parent_id == null ? undefined : rowById.get(cur.parent_id);
    }
    return chain;
  };

  const gWords = useMemo(() => gQuery.trim().toLowerCase().split(/\s+/).filter(Boolean), [gQuery]);

  const gResults = useMemo(() => {
    if (gWords.join("").length < 2) return [];
    const scored: { row: CategoryRow; nameHit: boolean; pos: number }[] = [];
    for (const r of rows) {
      const name = `${r.name} ${r.name_ar ?? ""}`.toLowerCase();
      // Every word must match — in the name itself (either language) or somewhere in its parent path.
      const haystack = chainOf(r.category_id).map((c) => `${c.name} ${c.name_ar ?? ""}`.toLowerCase()).join(" ");
      if (!gWords.every((w) => haystack.includes(w))) continue;
      scored.push({ row: r, nameHit: gWords.every((w) => name.includes(w)), pos: name.indexOf(gWords[0]) });
      if (scored.length >= 400) break;
    }
    return scored
      .sort((a, b) =>
        Number(b.nameHit) - Number(a.nameHit) ||
        (a.pos === -1 ? 999 : a.pos) - (b.pos === -1 ? 999 : b.pos) ||
        a.row.name.localeCompare(b.row.name),
      )
      .slice(0, 30)
      .map((s) => s.row);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, gWords]);

  const pickGlobal = (row: CategoryRow) => {
    const chain = chainOf(row.category_id).slice(0, 3);
    const l1 = chain[0]?.category_id ?? null;
    const l2 = chain[1]?.category_id ?? null;
    const l3 = chain[2]?.category_id ?? null;
    emit({ l1, l2, l3 });
    setGOpen(false);
    setGQuery("");
  };

  return (
    <div className="sm:col-span-2">
      <span className="mb-1.5 block text-sm font-medium text-foreground">Product category *</span>
      <div className={`overflow-visible rounded-lg border bg-card transition-colors ${
        gOpen ? "border-primary ring-2 ring-primary/20" : "border-border"
      }`}>
        {/* Search bar on top — finds any category across all levels */}
        <div ref={gRef} className="relative border-b border-border">
          <div className="relative mx-2 my-1.5 flex h-10 items-center gap-2 rounded-md border border-input px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <SearchIcon />
            <input
              value={gQuery}
              disabled={loading}
              onFocus={() => setGOpen(true)}
              onChange={(e) => { setGQuery(e.target.value); setGOpen(true); }}
              placeholder={loading ? "Loading categories…" : "Search all categories in English"}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {/* Arabic placeholder on the right — same single row, hides once typing starts */}
            {!gQuery && !loading && (
              <span dir="rtl" className="pointer-events-none absolute right-3 text-sm text-muted-foreground">
                ابحث في جميع الفئات بالعربية
              </span>
            )}
            {gQuery && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Clear search"
                className="rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                onMouseDown={(e) => { e.stopPropagation(); setGQuery(""); }}
              >
                <XIcon />
              </span>
            )}
          </div>
          {gOpen && gQuery.trim().length >= 2 && (
            <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
              <div className="max-h-64 overflow-y-auto p-1">
                <div className="grid grid-cols-2 gap-3 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>English</span>
                  <span dir="rtl" className="text-right">العربية</span>
                </div>
                {gResults.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">No categories match “{gQuery.trim()}”</div>
                ) : (
                  gResults.map((r) => {
                    const chain = chainOf(r.category_id);
                    const ctx = chain.length > 1 ? chain.slice(0, -1).map((c) => c.name).join(" › ") : null;
                    const ctxAr = chain.length > 1 ? chain.slice(0, -1).map((c) => c.name_ar || c.name).join(" › ") : null;
                    return (
                      <button
                        key={r.category_id}
                        type="button"
                        onClick={() => pickGlobal(r)}
                        className="w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
                      >
                        <span className="grid grid-cols-2 gap-3">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">
                              <Highlighted text={r.name} words={gWords} />
                            </span>
                            {ctx && (
                              <span className="block truncate text-xs text-muted-foreground">
                                <Highlighted text={ctx} words={gWords} />
                              </span>
                            )}
                          </span>
                          <span dir="rtl" className="min-w-0 text-right">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {r.name_ar ? <Highlighted text={r.name_ar} words={gWords} /> : "—"}
                            </span>
                            {ctxAr && (
                              <span className="block truncate text-xs text-muted-foreground">
                                <Highlighted text={ctxAr} words={gWords} />
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
                Picking a result fills all matching levels below
              </div>
            </div>
          )}
        </div>

        {/* Two columns — English pickers on the left, Arabic mirror on the right (like Title/Brand/Description) */}
        <div className="grid gap-4 p-3 lg:grid-cols-2">
          {/* English column */}
          <div className="space-y-4 rounded-lg border border-border bg-background p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">English</div>
            <Field label="Category *">
              <CategoryPicker
                placeholder={loading ? "Loading categories…" : "Select a category"}
                disabled={loading}
                options={tops}
                selectedId={value.l1}
                onSelect={(id) => emit({ l1: id, l2: null, l3: null })}
              />
            </Field>
            <Field label="Sub category *">
              <CategoryPicker
                placeholder="Select a sub category"
                disabledHint="Pick a category first"
                disabled={loading || value.l1 == null}
                options={subs}
                selectedId={value.l2}
                onSelect={(id) => emit({ l1: value.l1, l2: id, l3: null })}
              />
            </Field>
            <Field label={details.length > 0 ? "Detailed category *" : "Detailed category"}>
              <CategoryPicker
                placeholder={details.length === 0 ? "No deeper level" : "Select a detailed category"}
                disabledHint="Pick a sub category first"
                disabled={loading || value.l2 == null || details.length === 0}
                options={details}
                selectedId={value.l3}
                onSelect={(id) => emit({ l1: value.l1, l2: value.l2, l3: id })}
              />
            </Field>
            {value.path && (
              <p className="truncate border-t border-border pt-2 text-xs text-muted-foreground">
                Filed under: <span className="font-medium text-foreground">{value.path}</span>
              </p>
            )}
          </div>

          {/* Arabic column — selectable, stays in sync with the English side */}
          <div dir="rtl" className="space-y-4 rounded-lg border border-border bg-background p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">العربية</div>
            <Field label="الفئة *">
              <CategoryPicker
                arabic
                placeholder={loading ? "جارٍ التحميل…" : "اختر الفئة"}
                disabled={loading}
                options={topsAr}
                selectedId={value.l1}
                onSelect={(id) => emit({ l1: id, l2: null, l3: null })}
              />
            </Field>
            <Field label="الفئة الفرعية *">
              <CategoryPicker
                arabic
                placeholder="اختر الفئة الفرعية"
                disabledHint="اختر الفئة أولاً"
                disabled={loading || value.l1 == null}
                options={subsAr}
                selectedId={value.l2}
                onSelect={(id) => emit({ l1: value.l1, l2: id, l3: null })}
              />
            </Field>
            <Field label="الفئة التفصيلية">
              <CategoryPicker
                arabic
                placeholder={details.length === 0 ? "لا يوجد مستوى أعمق" : "اختر الفئة التفصيلية"}
                disabledHint="اختر الفئة الفرعية أولاً"
                disabled={loading || value.l2 == null || details.length === 0}
                options={detailsAr}
                selectedId={value.l3}
                onSelect={(id) => emit({ l1: value.l1, l2: value.l2, l3: id })}
              />
            </Field>
            {(pathAr || value.path) && (
              <p className="truncate border-t border-border pt-2 text-xs text-muted-foreground">
                مصنّف ضمن: <span className="font-medium text-foreground">{pathAr || value.path}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
