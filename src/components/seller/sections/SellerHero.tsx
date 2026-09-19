import { Link } from '@/lib/router-compat';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { useLocale } from '@/i18n/LocaleProvider';

export function SellerHero() {
  const { t } = useLocale();
  return (
    <section className="hero-surface relative overflow-hidden text-white">
      <div aria-hidden className="hero-grid pointer-events-none absolute inset-0 opacity-15" />
      <SellerContainer className="relative py-10 sm:py-12 lg:py-14">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-retail-gold" />
            {t('selling.hero.badge')}
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] sm:text-5xl">
            {t('selling.hero.title1')}<span className="text-retail-gold">{t('selling.hero.title2')}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
            {t('selling.hero.lead')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-retail-gold font-bold text-retail-dark-green hover:bg-retail-gold/90">
              <Link to="/selling/signup">
                {t('selling.hero.startSelling')}
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white">
              <a href="#services">{t('selling.hero.exploreServices')}</a>
            </Button>
          </div>
        </div>
      </SellerContainer>
    </section>
  );
}
