import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanFeatureChipProps {
  unlocksOn?: string;
  label?: string;
  locked?: boolean;
  className?: string;
}

/**
 * Subscriptions were removed. Locked/upgrade chips no longer apply, so those
 * render nothing. Unlocked perks (locked={false}) still render as a static
 * badge — no link to pricing plans.
 */
export function PlanFeatureChip({ label, locked = true, className }: PlanFeatureChipProps) {
  if (locked) return null;
  if (!label) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary',
        className,
      )}
    >
      <Sparkles className="h-2.5 w-2.5" />
      <span>{label}</span>
    </span>
  );
}

export default PlanFeatureChip;
