import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LucideIcon } from 'lucide-react';

export interface HubTabDef {
  value: string;
  icon: LucideIcon;
  label: string;
  sub: string;
}

interface HubTabsProps {
  tabs: HubTabDef[];
  /** Visual variant — admin gets a slate accent band, customer the default */
  variant?: 'customer' | 'admin';
}

/**
 * Shared tab list used by every hub-style page (customer + admin) so the look-and-feel
 * stays consistent. Pair with shadcn `<Tabs value=... onValueChange=...>` and
 * `<TabsContent value="...">` blocks in the parent.
 */
export function HubTabs({ tabs, variant = 'customer' }: HubTabsProps) {
  return (
    <TabsList
      className={`mb-4 flex w-full gap-1 overflow-x-auto no-scrollbar snap-x snap-mandatory sm:flex-wrap sm:overflow-visible sm:[&>button]:flex-1 [&>button]:min-h-[44px] [&>button]:snap-start [&>button]:shrink-0 ${
        variant === 'admin'
          ? 'bg-slate-100/70 p-1 ring-1 ring-slate-200 dark:bg-slate-800/40 dark:ring-slate-700/60'
          : ''
      }`}
    >
      {tabs.map((t) => (
        <TabsTrigger key={t.value} value={t.value} className="touch-manipulation active:scale-[0.97] transition-transform">
          <t.icon />
          <div className="flex flex-col leading-tight text-left">
            <span>{t.label}</span>
            <span className="hidden sm:block text-xs font-normal opacity-70">{t.sub}</span>
          </div>
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
