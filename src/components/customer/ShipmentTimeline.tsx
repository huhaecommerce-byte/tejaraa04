import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALL_STAGES = [
  { key: 'pending', label: 'Order placed' },
  { key: 'processing', label: 'Picked & packed' },
  { key: 'labelling', label: 'Labelled' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

interface Props {
  status: string;
  compact?: boolean;
  /** Whether this order uses labelling service. Defaults to true for backwards compatibility. */
  hasLabelling?: boolean;
}

export const ShipmentTimeline = ({ status, compact = false, hasLabelling = true }: Props) => {
  // If status itself is 'labelling', force-include the stage even if flag is false
  const includeLabelling = hasLabelling || status === 'labelling';
  const STAGES = includeLabelling ? ALL_STAGES : ALL_STAGES.filter(s => s.key !== 'labelling');
  const currentIdx = STAGES.findIndex(s => s.key === status);
  const activeIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div className={cn('w-full', compact ? 'mt-2' : 'mt-3')}>
      <div className="flex items-center justify-between gap-1">
        {STAGES.map((s, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx && status !== 'delivered';
          const last = i === activeIdx && status === 'delivered';
          return (
            <div key={s.key} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div className={cn(
                    'flex-1 h-[2px] rounded-full transition-colors',
                    done || last ? 'bg-emerald-500' : active ? 'bg-gradient-to-r from-emerald-500 to-muted' : 'bg-muted'
                  )} />
                )}
                <div className={cn(
                  'flex-shrink-0 rounded-full flex items-center justify-center transition-all',
                  compact ? 'w-5 h-5' : 'w-6 h-6',
                  done || last ? 'bg-emerald-500 text-white' :
                  active ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                  'bg-muted text-muted-foreground'
                )}>
                  {done || last ? <CheckCircle2 className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} /> :
                   active ? <Loader2 className={cn(compact ? 'h-3 w-3' : 'h-3.5 w-3.5', 'animate-spin')} /> :
                   <Circle className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} />}
                </div>
                {i < STAGES.length - 1 && (
                  <div className={cn(
                    'flex-1 h-[2px] rounded-full transition-colors',
                    done ? 'bg-emerald-500' : 'bg-muted'
                  )} />
                )}
              </div>
              <span className={cn(
                'text-[9px] sm:text-[10px] text-center leading-tight truncate w-full',
                done || last ? 'text-emerald-600 font-medium' :
                active ? 'text-primary font-semibold' :
                'text-muted-foreground'
              )}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
