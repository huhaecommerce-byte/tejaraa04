import { ArrowRight, Grid2X2, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/home/tejaraa-retail-hero.jpg';
import techImage from '@/assets/home/tejaraa-tech-promo.jpg';
import homeImage from '@/assets/home/tejaraa-home-promo.jpg';

const copy = {
  en: {
    label: 'Featured shopping',
    eyebrow: 'Shopping across Saudi Arabia',
    heading: 'Everything you need. Easily at Tejaraa.',
    sub: 'Discover useful products for your home, family and everyday life, all in one trusted marketplace.',
    shop: 'Shop now',
    explore: 'Explore categories',
    trust: 'Secure shopping with clear prices in SAR',
    collection: 'Shop collection',
    promos: [
      { eyebrow: 'Everyday technology', title: 'Upgrade your essentials' },
      { eyebrow: 'Home collection', title: 'Make every room work better' },
    ],
    heroAlt: 'A Saudi family shopping for home, technology, beauty and family essentials',
  },
  ar: {
    label: 'تسوق مميز',
    eyebrow: 'تسوق في كل أنحاء السعودية',
    heading: 'كل ما تحتاجه. بسهولة مع تجارة.',
    sub: 'اكتشف منتجات عملية لمنزلك وعائلتك وحياتك اليومية في متجر واحد موثوق.',
    shop: 'تسوق الآن',
    explore: 'استعرض الفئات',
    trust: 'تسوق آمن بأسعار واضحة بالريال السعودي',
    collection: 'تسوق المجموعة',
    promos: [
      { eyebrow: 'تقنية كل يوم', title: 'طوّر أساسياتك' },
      { eyebrow: 'مجموعة المنزل', title: 'اجعل كل غرفة أفضل' },
    ],
    heroAlt: 'عائلة سعودية تتسوق مستلزمات المنزل والتقنية والعناية',
  },
};

export function RetailHero({ locale = 'en' }: { locale?: 'en' | 'ar' }) {
  const t = copy[locale];
  const prefix = locale === 'ar' ? '/ar' : '';
  const sidePromotions = [
    { image: techImage, ...t.promos[0], href: '/catalog?q=Electronics' },
    { image: homeImage, ...t.promos[1], href: '/catalog?q=Home' },
  ];

  return (
    <section aria-label={t.label} className="grid gap-3 lg:grid-cols-[minmax(0,2.15fr)_minmax(280px,.85fr)]">
      <div className="relative min-h-[310px] overflow-hidden rounded-lg bg-retail-dark-green md:min-h-[370px] lg:min-h-[410px]">
        <img src={heroImage} alt={t.heroAlt} width={1600} height={900} fetchPriority="high" className={`absolute inset-0 h-full w-full object-cover object-[62%_center] sm:object-center ${locale === 'ar' ? 'scale-x-[-1]' : ''}`} />
        <div className={`absolute inset-0 ${locale === 'ar' ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-retail-dark-green via-retail-dark-green/95 to-retail-dark-green/10`} />
        <div className="relative z-10 flex min-h-[310px] max-w-2xl flex-col justify-center px-5 py-8 text-primary-foreground sm:px-8 md:min-h-[370px] lg:min-h-[410px] lg:px-12">
          <p className="flex items-center gap-2 text-xs font-bold uppercase text-retail-gold"><Sparkles className="h-4 w-4" />{t.eyebrow}</p>
          <h1 className="mt-3 max-w-xl font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{t.heading}</h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-primary-foreground/85 sm:text-base">{t.sub}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild size="lg" className="bg-retail-gold text-retail-dark-green hover:bg-retail-gold/90"><Link to="/catalog">{t.shop} <ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link></Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/50 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to={`${prefix}/category`}><Grid2X2 className="h-4 w-4" />{t.explore}</Link></Button>
          </div>
          <p className="mt-6 flex items-center gap-2 text-xs font-semibold text-primary-foreground/80"><ShieldCheck className="h-4 w-4 text-retail-gold" />{t.trust}</p>
        </div>
      </div>

      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto lg:grid lg:grid-rows-2 lg:overflow-visible">
        {sidePromotions.map((promotion) => (
          <Link key={promotion.title} to={promotion.href} className="group relative min-h-[170px] w-[82vw] max-w-[420px] shrink-0 snap-start overflow-hidden rounded-lg bg-retail-card lg:min-h-0 lg:w-auto lg:max-w-none">
            <img src={promotion.image} alt="" loading="lazy" width={1200} height={800} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
            <div className={`absolute inset-0 ${locale === 'ar' ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-retail-dark-green/90 via-retail-dark-green/45 to-transparent`} />
            <div className="relative z-10 flex h-full max-w-[70%] flex-col justify-end p-5 text-primary-foreground">
              <p className="text-[10px] font-bold uppercase text-retail-gold">{promotion.eyebrow}</p>
              <h2 className="mt-1 font-display text-xl font-bold leading-tight">{promotion.title}</h2>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold">{t.collection} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" /></span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
