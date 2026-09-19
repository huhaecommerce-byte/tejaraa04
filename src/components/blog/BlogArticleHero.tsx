import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Clock3 } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { SellerContainer } from '@/components/seller/common/SellerContainer';

interface BlogArticleHeroProps {
  icon: LucideIcon;
  category: string;
  title: string;
  excerpt: string;
  date?: string;
}

export function BlogArticleHero({ icon: Icon, category, title, excerpt, date }: BlogArticleHeroProps) {
  const formattedDate = date
    ? new Intl.DateTimeFormat('en-SA', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
    : null;

  return (
    <section className="hero-surface relative overflow-hidden py-9 text-primary-foreground lg:py-11">
      <div aria-hidden className="hero-grid pointer-events-none absolute inset-0 opacity-15" />
      <SellerContainer className="relative grid items-end gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)] lg:gap-12">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-bold uppercase text-retail-gold">
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {category}
          </span>
          <h1 className="font-blog-heading mt-3 max-w-4xl text-3xl font-extrabold leading-[1.12] sm:text-4xl lg:text-[2.45rem]">
            {title}
          </h1>
          <p className="font-blog-body mt-3 max-w-3xl text-base leading-7 text-primary-foreground/80">{excerpt}</p>
        </div>
        <div className="border-l border-primary-foreground/20 pl-5">
          <p className="text-xs font-bold uppercase text-retail-gold">Seller guide</p>
          <p className="mt-2 text-sm leading-6 text-primary-foreground/75">Practical guidance for building and operating an e-commerce business in Saudi Arabia.</p>
          {formattedDate ? <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-primary-foreground/65"><Clock3 className="h-3.5 w-3.5" aria-hidden />Updated {formattedDate}</p> : null}
          <Button asChild variant="outline" size="sm" className="mt-4 border-primary-foreground/35 bg-transparent font-semibold text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
            <Link to="/blog">All seller guides <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden /></Link>
          </Button>
        </div>
      </SellerContainer>
    </section>
  );
}