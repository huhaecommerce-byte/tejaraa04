import { useState } from 'react';
import { ArrowRight, Grid2X2 } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { categoryPath, slugify } from '@/lib/seo/slug';
import { categoryImageFor, formatCategoryCount, type RetailCategoryGroup } from './categoryTypes';
import { useLocale } from '@/i18n/LocaleProvider';

export function CategoryCard({ category, priority = false }: { category: RetailCategoryGroup; priority?: boolean }) {
  const { t } = useLocale();
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <article id={`category-${slugify(category.name)}`} className="scroll-mt-40 overflow-hidden rounded-lg border border-retail-border bg-retail-card transition hover:border-retail-medium-green hover:shadow-sm">
      <Link to={categoryPath(category.name)} className="group block">
        <span className="relative block aspect-[4/3] overflow-hidden bg-retail-light-green">
          {!imageFailed ? <img src={categoryImageFor(category.name)} alt="" loading={priority ? 'eager' : 'lazy'} width={480} height={360} onError={() => setImageFailed(true)} className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" /> : <span className="grid h-full place-items-center text-retail-medium-green"><Grid2X2 className="h-9 w-9" /></span>}
        </span>
        <span className="block p-3 sm:p-4">
          <span className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2"><span className="min-w-0 font-display text-sm font-bold text-retail-text group-hover:text-retail-green sm:text-base">{category.name}</span><ArrowRight className="h-4 w-4 shrink-0 text-retail-green" /></span>
          {category.cnt > 0 && <span className="mt-1 block text-[11px] text-retail-muted">{formatCategoryCount(category.cnt)} {t('shopx.category.productsSuffixShort')}</span>}
          {category.subs.length > 0 && <span className="mt-2 line-clamp-2 block text-xs leading-relaxed text-retail-muted">{category.subs.slice(0, 3).map((sub) => sub.name).join(' · ')}</span>}
        </span>
      </Link>
    </article>
  );
}
