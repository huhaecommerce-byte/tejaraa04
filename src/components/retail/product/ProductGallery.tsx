import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useLocale } from '@/i18n/LocaleProvider';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const { t } = useLocale();
  const uniqueImages = useMemo(() => [...new Set(images.filter(Boolean))], [images]);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [viewerOpen, setViewerOpen] = useState(false);
  const image = uniqueImages[active];
  const showImage = Boolean(image) && !failed.has(image);

  useEffect(() => setActive(0), [productName]);

  const move = (step: number) => {
    if (uniqueImages.length < 2) return;
    setActive((current) => (current + step + uniqueImages.length) % uniqueImages.length);
  };

  const markFailed = (src: string) => setFailed((current) => new Set(current).add(src));

  return (
    <section aria-label={t('shopx.product.galleryAria')} className="min-w-0">
      <div className="grid gap-2 lg:grid-cols-[72px_minmax(0,1fr)]">
        {uniqueImages.length > 1 && (
          <div className="no-scrollbar order-2 flex gap-2 overflow-x-auto lg:order-1 lg:max-h-[560px] lg:flex-col lg:overflow-y-auto">
            {uniqueImages.map((src, index) => (
              <button
                type="button"
                key={src}
                onClick={() => setActive(index)}
                aria-label={t('shopx.product.viewImage', { index: index + 1, total: uniqueImages.length })}
                aria-current={index === active ? 'true' : undefined}
                className={cn(
                  'h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-retail-card p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-retail-green lg:h-[72px] lg:w-[72px]',
                  index === active ? 'border-retail-green ring-1 ring-retail-green' : 'border-retail-border hover:border-retail-medium-green',
                )}
              >
                <img src={src} alt="" loading="lazy" className="h-full w-full object-contain" onError={() => markFailed(src)} />
              </button>
            ))}
          </div>
        )}

        <div className="order-1 relative aspect-square min-h-[320px] overflow-hidden rounded-lg border border-retail-border bg-retail-card sm:min-h-[420px] lg:order-2 lg:max-h-[620px]">
          <button
            type="button"
            onClick={() => showImage && setViewerOpen(true)}
            aria-label={showImage ? t('shopx.product.openLargerView', { name: productName }) : undefined}
            disabled={!showImage}
            className="group h-full w-full cursor-zoom-in p-5 sm:p-8"
          >
            {showImage ? (
              <img src={image} alt={productName} fetchPriority="high" decoding="async" className="h-full w-full object-contain transition duration-300 motion-safe:group-hover:scale-[1.025]" onError={() => markFailed(image)} />
            ) : (
              <span className="grid h-full place-items-center text-retail-green"><Package className="h-20 w-20 opacity-30" /><span className="sr-only">{t('shopx.product.noImageAvailable')}</span></span>
            )}
          </button>
          {showImage && <span className="pointer-events-none absolute end-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-retail-border bg-retail-card/90 text-retail-muted"><Expand className="h-4 w-4" /></span>}
          {uniqueImages.length > 1 && (
            <>
              <Button type="button" variant="outline" size="icon" onClick={() => move(-1)} aria-label={t('shopx.product.previousImage')} className="absolute start-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-retail-card/95"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></Button>
              <Button type="button" variant="outline" size="icon" onClick={() => move(1)} aria-label={t('shopx.product.nextImage')} className="absolute end-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-retail-card/95"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></Button>
              <span className="absolute bottom-3 end-3 rounded-full border border-retail-border bg-retail-card/90 px-2 py-1 text-xs font-semibold text-retail-muted">{active + 1} / {uniqueImages.length}</span>
            </>
          )}
        </div>
      </div>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="h-[min(88dvh,900px)] max-w-5xl overflow-hidden bg-retail-card p-4">
          <DialogTitle className="pe-10 text-base text-retail-text">{productName}</DialogTitle>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {showImage && <img src={image} alt={productName} className="h-full w-full object-contain" />}
            {uniqueImages.length > 1 && (
              <>
                <Button type="button" variant="outline" size="icon" onClick={() => move(-1)} aria-label={t('shopx.product.previousImage')} className="absolute start-2 top-1/2 rounded-full"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></Button>
                <Button type="button" variant="outline" size="icon" onClick={() => move(1)} aria-label={t('shopx.product.nextImage')} className="absolute end-2 top-1/2 rounded-full"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}