import { NavLink } from '@/components/NavLink';
import { useLocation } from "@/lib/router-compat";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { NavSection } from '@/config/navigation';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  section: NavSection | undefined;
  rootPath: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function AuroraPanel({ section, rootPath, collapsed = false, onToggle }: Props) {
  const location = useLocation();
  const { limits } = useCurrentPlan();

  if (!section) return null;
  const Icon = section.icon;

  const items = section.items.filter(
    (it) => !it.starterOnly || limits.product_browsing !== 'unlimited'
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className={`aurora-panel ${collapsed ? 'is-collapsed' : ''}`}>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
            className="aurora-panel-toggle"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        )}

        {!collapsed && (
          <div key={section.id} className="px-5 pt-6 pb-4 border-b border-border/60 aurora-panel-header relative">
            {/* Cutout on the rail button now provides the visual link to this panel */}
            <div className="flex items-center gap-2.5 animate-fade-in">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white aurora-panel-icon">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-foreground">{section.label}</h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <span className="inline-block w-1 h-1 rounded-full bg-primary animate-pulse" />
                  Active workspace
                </p>
              </div>
            </div>
          </div>
        )}

        <nav className={`flex flex-col flex-1 overflow-y-auto ${collapsed ? 'px-2 py-3 gap-1 items-center' : 'px-3 py-3 gap-0.5'}`}>
          {items.map((it) => {
            const ItemIcon = it.icon;
            const isExact = it.url === rootPath;
            const link = (
              <NavLink
                key={it.url}
                to={it.url}
                end={isExact}
                className={collapsed ? 'aurora-nav-link is-collapsed group' : 'aurora-nav-link group'}
                activeClassName="is-active"
              >
                <ItemIcon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                {!collapsed && <span className="truncate">{it.title}</span>}
              </NavLink>
            );
            return collapsed ? (
              <Tooltip key={it.url}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{it.title}</TooltipContent>
              </Tooltip>
            ) : link;
          })}
        </nav>

        {!collapsed && (
          <div className="px-5 py-4 border-t border-border/60 text-[10px] text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground/70">Tejaraa.com</p>
            <p className="mt-0.5">© 2025 — Sourcing & fulfillment for KSA sellers.</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
