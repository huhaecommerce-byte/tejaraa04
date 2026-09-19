import { Link } from '@/lib/router-compat';

export interface SubcategoryChip { label: string; href: string; count?: number }
export function SubcategoryChips({ title = 'Browse related categories', items }: { title?: string; items: SubcategoryChip[] }) {
  if (!items.length) return null;
  return <section aria-label={title}><h2 className="mb-2 text-xs font-bold uppercase text-retail-muted">{title}</h2><div className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1">{items.map((item) => <Link key={item.href} to={item.href} className="min-h-10 shrink-0 snap-start rounded-md border border-retail-border bg-retail-card px-3 py-2 text-xs font-semibold text-retail-text hover:border-retail-green hover:text-retail-green">{item.label}{typeof item.count === 'number' && item.count > 0 && <span className="ms-1.5 text-retail-muted">{item.count.toLocaleString()}</span>}</Link>)}</div></section>;
}