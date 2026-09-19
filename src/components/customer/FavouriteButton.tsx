import { Heart } from 'lucide-react';
import { useFavourites } from '@/hooks/useFavourites';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  productId: string;
  productName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  stopPropagation?: boolean;
}

const sizeMap = { sm: 'h-7 w-7', md: 'h-9 w-9', lg: 'h-11 w-11' };
const iconMap = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' };

export function FavouriteButton({ productId, productName = 'product', className, size = 'md', stopPropagation = true }: Props) {
  const { user } = useAuth();
  const { isFavourite, toggle, favs } = useFavourites();
  const { numericLimit, planName } = useCurrentPlan();
  const fav = isFavourite(productId);

  const handle = async (e: React.MouseEvent) => {
    if (stopPropagation) { e.preventDefault(); e.stopPropagation(); }
    if (!user) { toast.error('Please sign in to save favourites'); return; }

    // Plan-based soft gate: only blocks ADDING new favourites past the limit.
    if (!fav) {
      const lim = numericLimit('favourites_max');
      if (lim > 0 && favs.size >= lim) {
        toast.error(
          `You've reached your ${planName} plan limit of ${lim} favourites. Upgrade for more.`,
          { action: { label: 'View plans', onClick: () => { window.location.href = '/pricing'; } } },
        );
        return;
      }
    }

    const now = await toggle(productId);
    toast.success(now ? 'Added to favourites' : 'Removed from favourites');
  };

  return (
    <button
      type="button"
      onClick={handle}
      title={fav ? 'Remove from favourites' : 'Add to favourites'}
      aria-label={`${fav ? 'Remove' : 'Add'} ${productName} ${fav ? 'from' : 'to'} favourites`}
      aria-pressed={fav}
      className={cn(
        'inline-flex items-center justify-center rounded-full border border-retail-border bg-retail-card/95 text-retail-muted shadow-sm transition hover:border-retail-green hover:text-retail-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-retail-green focus-visible:ring-offset-2',
        sizeMap[size],
        fav && 'text-rose-500 border-rose-200',
        className,
      )}
    >
      <Heart className={cn(iconMap[size], fav && 'fill-rose-500')} />
    </button>
  );
}
