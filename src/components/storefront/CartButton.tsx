import { Link } from '@/lib/router-compat';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export function CartButton({ onDark = false }: { onDark?: boolean }) {
  const { count } = useCart();
  return (
    <Link
      to="/cart"
      aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
        onDark ? 'text-primary-foreground hover:bg-primary-foreground/15' : 'text-foreground hover:bg-muted/60'
      }`}
    >
      <ShoppingCart className="h-[18px] w-[18px]" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
