import { Link } from '@/lib/router-compat';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { useLocale } from '@/i18n/LocaleProvider';

interface ServiceInquiryCTAProps {
  title: string;
  text: string;
  primaryLabel: string;
  defaultService?: string;
}

/** Conversion block: one primary action plus the enquiry form on the same page. */
export function ServiceInquiryCTA({ title, text, primaryLabel, defaultService }: ServiceInquiryCTAProps) {
  void defaultService;
  const { t } = useLocale();
  return (
    <section id="enquiry" className="scroll-mt-24 bg-retail-dark-green py-9 lg:py-10">
      <SellerContainer className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-retail-gold">{t('selling.svc.ui.eyebrowRegister')}</p>
          <h2 className="mt-2 text-2xl font-extrabold text-white">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-white/70">{text}</p>
        </div>
        <Button asChild size="lg" className="shrink-0 bg-white font-semibold text-retail-dark-green hover:bg-retail-light-green">
          <Link to="/selling/signup">
            {primaryLabel}
            <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </SellerContainer>
    </section>
  );
}
