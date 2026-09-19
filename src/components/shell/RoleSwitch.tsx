import { Link } from '@/lib/router-compat';
import { ShoppingBag, Warehouse } from 'lucide-react';

/**
 * Account chooser shown at the top of every auth panel.
 * Shopping and dropshipping share one account; wholesalers/suppliers
 * have their own separate portal sign-in.
 */
export function RoleSwitch({
  active,
  mode = 'signin',
}: {
  active: 'buyer' | 'seller' | 'supplier' | 'store';
  mode?: 'signin' | 'signup';
}) {
  const storeTo = mode === 'signup' ? '/signup' : '/login';
  const supplierTo = mode === 'signup' ? '/partners/signup' : '/partners/signin';
  const storeActive = active !== 'supplier';

  const base =
    'flex flex-1 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors';
  const on = 'border-primary bg-primary/10 text-primary';
  const off = 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground';

  return (
    <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <Link to={storeTo} className={`${base} ${storeActive ? on : off}`}>
        <ShoppingBag className="h-4 w-4 shrink-0" />
        <span>
          Shopping &amp; Dropshipping
          <span className="block text-[10px] font-medium opacity-70">One account for both</span>
        </span>
      </Link>
      <Link to={supplierTo} className={`${base} ${active === 'supplier' ? on : off}`}>
        <Warehouse className="h-4 w-4 shrink-0" />
        <span>
          Wholesale &amp; Suppliers
          <span className="block text-[10px] font-medium opacity-70">Separate supplier portal</span>
        </span>
      </Link>
    </div>
  );
}
