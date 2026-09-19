import { useEffect, useState } from 'react';
import { Link } from "@/lib/router-compat";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, Circle, MapPin, ShoppingBag, Store, Wallet, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { safeSetItem } from '@/lib/safeStorage';

interface Step {
  key: string;
  label: string;
  description: string;
  icon: any;
  to: string;
  done: boolean;
}

const DISMISS_KEY = 'tejaraa_onboarding_dismissed';

export const OnboardingChecklist = () => {
  const { user } = useAuth();
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  useEffect(() => {
    if (!user?.id || dismissed) return;
    (async () => {
      const [addr, orders, stores, wallet] = await Promise.all([
        supabase.from('shipping_addresses').select('id').eq('user_id', user.id).limit(1),
        supabase.from('orders').select('id').eq('user_id', user.id).limit(1),
        supabase.from('store_integrations').select('id').eq('user_id', user.id).limit(1),
        supabase.from('wallet_transactions').select('id').eq('user_id', user.id).limit(1),
      ]);
      setSteps([
        { key: 'address', label: 'Add shipping address', description: 'Where should we deliver?', icon: MapPin, to: '/dropshipping/profile?tab=addresses', done: (addr.data?.length || 0) > 0 },
        { key: 'order', label: 'Place your first order', description: 'Try our catalog', icon: ShoppingBag, to: '/dropshipping/catalog', done: (orders.data?.length || 0) > 0 },
        { key: 'store', label: 'Connect your store', description: 'Sync Amazon, Noon, Salla', icon: Store, to: '/dropshipping/profile?tab=stores', done: (stores.data?.length || 0) > 0 },
        { key: 'wallet', label: 'Top up wallet', description: 'Faster checkout', icon: Wallet, to: '/dropshipping/billing?tab=wallet', done: (wallet.data?.length || 0) > 0 },
      ]);
    })();
  }, [user?.id, dismissed]);

  if (!steps || dismissed) return null;
  const completed = steps.filter(s => s.done).length;
  const total = steps.length;
  if (completed === total) return null;

  const pct = (completed / total) * 100;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const handleDismiss = () => {
    safeSetItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-card to-accent/[0.05] p-4 md:p-5">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-background/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-4 mb-4">
        <div className="relative flex-shrink-0">
          <svg width="68" height="68" className="-rotate-90">
            <circle cx="34" cy="34" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
            <circle
              cx="34" cy="34" r={radius} fill="none"
              stroke="hsl(var(--primary))" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{completed}/{total}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
            <Sparkles className="h-3.5 w-3.5" /> Get started
          </div>
          <h3 className="font-bold text-base md:text-lg leading-tight">Complete your seller setup</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Finish these {total - completed} steps to unlock the full Tejaraa experience</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {steps.map(step => {
          const Icon = step.icon;
          return (
            <Link
              key={step.key}
              to={step.to}
              className={cn(
                'group flex items-center gap-3 rounded-xl border p-3 transition-all',
                step.done
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-border/50 bg-card hover:border-primary/40 hover:shadow-md'
              )}
            >
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition',
                step.done ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary group-hover:bg-primary/20'
              )}>
                {step.done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold leading-tight', step.done && 'line-through text-muted-foreground')}>
                  {step.label}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{step.description}</p>
              </div>
              {!step.done && (
                <Button size="sm" variant="ghost" className="h-7 text-[11px] rounded-full opacity-0 group-hover:opacity-100 transition">
                  Start →
                </Button>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
