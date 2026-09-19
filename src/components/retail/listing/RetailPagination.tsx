import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/i18n/LocaleProvider';

export function RetailPagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  const { t } = useLocale();
  if (totalPages <= 1) return null;
  const candidates = [1, currentPage - 1, currentPage, currentPage + 1, totalPages].filter((n) => n >= 1 && n <= totalPages);
  const pages = [...new Set(candidates)].sort((a, b) => a - b);
  return <nav aria-label="Product pages" className="flex items-center justify-center gap-1.5 pt-3"><Button type="button" variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} className="h-9"><ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">{t('shopx.listing.previous')}</span></Button><span className="px-2 text-xs text-retail-muted sm:hidden">{t('shopx.listing.pageOf', { current: currentPage, total: totalPages })}</span><div className="hidden items-center gap-1 sm:flex">{pages.map((page, index) => <span key={page} className="contents">{index > 0 && page - pages[index - 1] > 1 && <span className="px-1 text-retail-muted">…</span>}<Button type="button" variant={page === currentPage ? 'default' : 'outline'} size="sm" aria-current={page === currentPage ? 'page' : undefined} onClick={() => onPageChange(page)} className="h-9 min-w-9 px-2">{page}</Button></span>)}</div><Button type="button" variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} className="h-9"><span className="hidden sm:inline">{t('shopx.listing.next')}</span><ChevronRight className="h-4 w-4" /></Button></nav>;
}
