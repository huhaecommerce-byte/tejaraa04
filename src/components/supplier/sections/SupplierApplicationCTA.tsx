import { Link } from '@/lib/router-compat';
import { ArrowRight, FileText, ShieldCheck, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupplierContainer } from '@/components/supplier/common/SupplierContainer';
import { supplierApplyPath } from '@/data/supplierPartners';

const prepare = [
  { icon: FileText, text: 'Company details and trade licence' },
  { icon: ShieldCheck, text: 'Owner or authorised person ID' },
  { icon: Warehouse, text: 'Warehouse city and address' },
];

interface SupplierApplicationCTAProps {
  variant?: 'light' | 'dark';
  title: string;
  text: string;
  showChecklist?: boolean;
}

export function SupplierApplicationCTA({
  variant = 'light', title, text, showChecklist = false,
}: SupplierApplicationCTAProps) {
  const dark = variant === 'dark';
  return (
    <section id="apply" className={`scroll-mt-28 py-11 lg:py-14 ${dark ? 'bg-retail-dark-green' : 'bg-retail-light-green/50'}`}>
      <SupplierContainer>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className={`text-2xl font-extrabold sm:text-3xl ${dark ? 'text-white' : 'text-retail-dark-green'}`}>{title}</h2>
          <p className={`mt-3 text-base leading-7 ${dark ? 'text-white/75' : 'text-retail-muted'}`}>{text}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className={dark
                ? 'bg-retail-gold font-semibold text-retail-dark-green hover:bg-retail-gold/90'
                : 'bg-retail-green font-semibold text-white hover:bg-retail-dark-green'}
            >
              <Link to={supplierApplyPath}>
                Become a Supplier
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className={dark
                ? 'border-white/30 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white'
                : 'border-retail-green/35 bg-white font-semibold text-retail-dark-green hover:bg-white'}
            >
              <Link to="/partners/contact">Talk to Tejaraa</Link>
            </Button>
          </div>

          {showChecklist ? (
            <ul className={`mt-6 grid gap-2.5 text-left sm:grid-cols-3 ${dark ? 'text-white/75' : 'text-retail-muted'}`}>
              {prepare.map((item) => (
                <li
                  key={item.text}
                  className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm leading-6 ${
                    dark ? 'border-white/12 bg-white/[0.06]' : 'border-retail-border bg-white'
                  }`}
                >
                  <item.icon className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? 'text-retail-gold' : 'text-retail-green'}`} aria-hidden />
                  <span className="min-w-0">{item.text}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </SupplierContainer>
    </section>
  );
}
