import { useEffect, useMemo, useRef, useState } from "react";

export interface NoonCategoryRow {
  category_code: string;
  name_en: string | null;
  name_ar: string | null;
  parent_code: string | null;
  level: number | null;
  path_en: string | null;
  path_ar: string | null;
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

const nameOf = (r: NoonCategoryRow) => r.name_en || r.category_code;

interface PickerProps {
  placeholder: string;
  disabledHint?: string;
  disabled?: boolean;
  options: NoonCategoryRow[];
  selectedCode: string | null;
  onSelect: (code: string | null) => void;
}

function LevelPicker({ placeholder, disabledHint, disabled, options, selectedCode, onSelect }: PickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => options.find((r) => r.category_code === selectedCode) ?? null, [options, selectedCode]);

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
      const hay = `${r.name_en ?? ""} ${r.name_ar ?? ""} ${r.category_code}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [options, query]);

  const words = useMemo(() => query.trim().toLowerCase().split(/\s+/).filter(Boolean), [query]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { if (disabled) return; setOpen(!open); setQuery(""); }}
        disabled={disabled}
        className={`flex h-9 w-full items-center justify-between gap-2 rounded-md border px-2.5 text-sm transition-colors ${
          open ? "border-primary ring-2 ring-primary/20" : "border-input bg-transparent"
        } ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-primary/50"}`}
      >
        <span className={`min-w-0 flex-1 truncate text-left ${selected ? "font-medium text-foreground" : "text-muted-foreground"}`}>
          {disabled && disabledHint ? disabledHint : selected ? nameOf(selected) : placeholder}
        </span>
        {selected && !disabled ? (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Clear selection"
            className="rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            onMouseDown={(e) => { e.stopPropagation(); onSelect(null); }}
          >
            <XIcon />
          </span>
        ) : (
          <ChevronIcon open={open} />
        )}
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full min-w-56 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <SearchIcon />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{filtered.length}</span>}
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">No matches</div>
            ) : (
              filtered.map((r) => (
                <button
                  key={r.category_code}
                  type="button"
                  onClick={() => { onSelect(r.category_code); setOpen(false); }}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                    r.category_code === selectedCode ? "bg-primary/10 font-medium text-foreground" : "hover:bg-accent"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">
                    <Highlighted text={nameOf(r)} words={words} />
                  </span>
                  {r.category_code === selectedCode && <CheckIcon />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  rows: NoonCategoryRow[];
  value: string | null;
  onChange: (code: string) => void;
  disabled?: boolean;
}

/** Three-level cascading Noon category picker with a global search bar on top. */
export function NoonCategorySelect({ rows, value, onChange, disabled }: Props) {
  const byName = (a: NoonCategoryRow, b: NoonCategoryRow) => nameOf(a).localeCompare(nameOf(b));

  const rowByCode = useMemo(() => new Map(rows.map((r) => [r.category_code, r])), [rows]);
  const childCodes = useMemo(() => new Set(rows.map((r) => r.parent_code).filter(Boolean) as string[]), [rows]);

  const chainOf = (code: string): NoonCategoryRow[] => {
    const chain: NoonCategoryRow[] = [];
    let cur = rowByCode.get(code);
    while (cur) {
      chain.unshift(cur);
      cur = cur.parent_code ? rowByCode.get(cur.parent_code) : undefined;
    }
    return chain;
  };

  const chain = value ? chainOf(value) : [];
  const l1 = chain[0]?.category_code ?? null;
  const l2 = chain[1]?.category_code ?? null;
  const l3 = chain[2]?.category_code ?? null;

  const tops = useMemo(() => rows.filter((r) => !r.parent_code).sort(byName), [rows]);
  const subs = useMemo(() => (l1 == null ? [] : rows.filter((r) => r.parent_code === l1).sort(byName)), [rows, l1]);
  const details = useMemo(() => (l2 == null ? [] : rows.filter((r) => r.parent_code === l2).sort(byName)), [rows, l2]);

  /** Deepest selected code, only emitted once it has no children left. */
  const emit = (n1: string | null, n2: string | null, n3: string | null) => {
    const leaf = n3 ?? n2 ?? n1;
    if (!leaf) return;
    if (childCodes.has(leaf)) return; // deeper level still to pick
    onChange(leaf);
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

  const gWords = useMemo(() => gQuery.trim().toLowerCase().split(/\s+/).filter(Boolean), [gQuery]);

  const gResults = useMemo(() => {
    if (gWords.join("").length < 2) return [];
    const scored: { row: NoonCategoryRow; nameHit: boolean; pos: number }[] = [];
    for (const r of rows) {
      const name = `${r.name_en ?? ""} ${r.name_ar ?? ""} ${r.category_code}`.toLowerCase();
      const haystack = chainOf(r.category_code)
        .map((c) => `${c.name_en ?? ""} ${c.name_ar ?? ""} ${c.category_code}`.toLowerCase())
        .join(" ");
      if (!gWords.every((w) => haystack.includes(w))) continue;
      scored.push({ row: r, nameHit: gWords.every((w) => name.includes(w)), pos: name.indexOf(gWords[0]) });
      if (scored.length >= 400) break;
    }
    return scored
      .sort((a, b) =>
        Number(b.nameHit) - Number(a.nameHit) ||
        (a.pos === -1 ? 999 : a.pos) - (b.pos === -1 ? 999 : b.pos) ||
        nameOf(a.row).localeCompare(nameOf(b.row)),
      )
      .slice(0, 30)
      .map((s) => s.row);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, gWords]);

  const pickGlobal = (row: NoonCategoryRow) => {
    onChange(row.category_code);
    setGOpen(false);
    setGQuery("");
  };

  const currentPath = value ? (rowByCode.get(value)?.path_en ?? value) : "";

  return (
    <div className={`overflow-visible rounded-lg border bg-card transition-colors ${gOpen ? "border-primary ring-2 ring-primary/20" : "border-border"}`}>
      {/* Global search on top */}
      <div ref={gRef} className="relative border-b border-border">
        <div className="relative mx-2 my-1.5 flex h-9 items-center gap-2 rounded-md border border-input px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <SearchIcon />
          <input
            value={gQuery}
            disabled={disabled || rows.length === 0}
            onFocus={() => setGOpen(true)}
            onChange={(e) => { setGQuery(e.target.value); setGOpen(true); }}
            placeholder={rows.length === 0 ? "Sync categories first" : "Search all Noon categories…"}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
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
              {gResults.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">No categories match “{gQuery.trim()}”</div>
              ) : (
                gResults.map((r) => {
                  const resultChain = chainOf(r.category_code);
                  const ctx = resultChain.length > 1 ? resultChain.slice(0, -1).map((c) => nameOf(c)).join(" › ") : null;
                  return (
                    <button
                      key={r.category_code}
                      type="button"
                      onClick={() => pickGlobal(r)}
                      className="w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
                    >
                      <span className="block truncate text-sm font-medium text-foreground">
                        <Highlighted text={nameOf(r)} words={gWords} />
                      </span>
                      {ctx && (
                        <span className="block truncate text-xs text-muted-foreground">
                          <Highlighted text={ctx} words={gWords} />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            <div className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
              Picking a result fills all three levels below
            </div>
          </div>
        )}
      </div>

      {/* Three cascading levels in one row */}
      <div className="grid gap-2 p-2 sm:grid-cols-3">
        <LevelPicker
          placeholder="Main category"
          disabled={disabled || rows.length === 0}
          options={tops}
          selectedCode={l1}
          onSelect={(code) => emit(code, null, null)}
        />
        <LevelPicker
          placeholder="Sub category"
          disabledHint="Pick main first"
          disabled={disabled || l1 == null}
          options={subs}
          selectedCode={l2}
          onSelect={(code) => emit(l1, code, null)}
        />
        <LevelPicker
          placeholder="Detail category"
          disabledHint="Pick sub first"
          disabled={disabled || l2 == null || details.length === 0}
          options={details}
          selectedCode={l3}
          onSelect={(code) => emit(l1, l2, code)}
        />
      </div>

      {currentPath && (
        <div className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{currentPath}</span>
        </div>
      )}
    </div>
  );
}
