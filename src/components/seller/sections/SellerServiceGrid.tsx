import { Link } from '@/lib/router-compat';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { sellerServices, type SellerService } from '@/data/sellerServices';

export function SellerServiceCard({ service }: { service: SellerService }) {
  return (
    <Link
      to={service.href}
      className="group min-w-0 border-b border-r border-retail-border p-4 transition-colors hover:bg-retail-light-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-retail-green sm:p-5"
    >
      <span className="mb-4 block h-px w-6 bg-retail-green/35 transition-all duration-300 group-hover:w-10" />
      <div className="flex items-center gap-2.5">
        <service.icon className="h-4 w-4 shrink-0 text-retail-green" aria-hidden />
        <h3 className="text-sm font-bold text-retail-dark-green">{service.title}</h3>
      </div>
      <p className="mt-2 text-xs leading-5 text-retail-muted sm:text-sm">{service.text}</p>
    </Link>
  );
}

export function SellerServiceGrid() {
  return (
    <section id="services" className="scroll-mt-28 py-9 lg:py-11">
      <SellerContainer>
        <div className="mb-6 max-w-2xl">
          <p className="text-xs font-bold uppercase text-retail-green">Services</p>
          <h2 className="mt-2 text-2xl font-semibold text-retail-dark-green sm:text-3xl">Everything you need to sell online.</h2>
        </div>
        <div className="grid grid-cols-1 border-l border-t border-retail-border sm:grid-cols-2 lg:grid-cols-4">
          {sellerServices.map((service) => (
            <SellerServiceCard key={service.id} service={service} />
          ))}
        </div>
      </SellerContainer>
    </section>
  );
}
