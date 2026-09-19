import { ArrowRight } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import techImage from '@/assets/home/tejaraa-tech-promo.jpg';
import homeImage from '@/assets/home/tejaraa-home-promo.jpg';

const copy = {
  en: {
    label: 'Featured collections',
    shop: 'Shop now',
    items: [
      { title: 'Technology for every day', copy: 'Phones, computing and smart accessories' },
      { title: 'A better home', copy: 'Practical picks for every room' },
      { title: 'Style made simple', copy: 'Fashion for every moment' },
    ],
  },
  ar: {
    label: 'مجموعات مميزة',
    shop: 'تسوق الآن',
    items: [
      { title: 'تقنية لكل يوم', copy: 'جوالات وحواسيب وملحقات ذكية' },
      { title: 'منزل أفضل', copy: 'اختيارات عملية لكل غرفة' },
      { title: 'أناقة بسهولة', copy: 'أزياء لكل مناسبة' },
    ],
  },
};

export function PromotionGrid({ locale = 'en' }: { locale?: 'en' | 'ar' }) {
  const t = copy[locale];
  const promotions = [
    { ...t.items[0], image: techImage, href: '/catalog?q=Electronics', className: 'md:col-span-2 lg:col-span-2' },
    { ...t.items[1], image: homeImage, href: '/catalog?q=Home', className: '' },
    { ...t.items[2], image: '/marketplace/fashion.jpg', href: '/catalog?q=Fashion', className: '' },
  ];

  return (
    <section aria-label={t.label} className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {promotions.map((promotion) => (
        <Link key={promotion.title} to={promotion.href} className={`group relative min-h-[160px] overflow-hidden rounded-lg border border-retail-border bg-retail-card sm:min-h-[190px] ${promotion.className}`}>
          <img src={promotion.image} alt="" loading="lazy" width={1200} height={800} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-retail-dark-green/90 via-retail-dark-green/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 z-10 p-4 text-primary-foreground">
            <h2 className="font-display text-base font-bold sm:text-xl">{promotion.title}</h2>
            <p className="mt-1 hidden text-xs text-primary-foreground/80 sm:block">{promotion.copy}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-retail-gold">{t.shop} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" /></span>
          </div>
        </Link>
      ))}
    </section>
  );
}
