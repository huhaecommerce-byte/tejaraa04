import { Link, useNavigate } from "@/lib/router-compat";
import { Package, LogOut, Shield, Store } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { NavSection } from '@/config/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  sections: NavSection[];
  activeSectionId: string;
  onSelectSection: (id: string) => void;
  variant?: 'customer' | 'admin';
}

export function AuroraRail({ sections, activeSectionId, onSelectSection, variant = 'customer' }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.name || user?.email || 'U').slice(0, 2).toUpperCase();

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="aurora-rail">
        <Link to="/" className="aurora-rail-brand group" aria-label="Home">
          <Package className="h-5 w-5 transition-transform group-hover:rotate-12" />
        </Link>

        {variant === 'admin' && (
          <span className="text-[9px] font-bold tracking-widest text-white/70 -mt-1 mb-2">ADMIN</span>
        )}

        <nav className="flex flex-col items-center gap-1 mt-2 flex-1">
          {sections.map((s) => {
            const active = s.id === activeSectionId;
            const Icon = s.icon;
            return (
              <Tooltip key={s.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSection(s.id);
                      if (s.items[0]) navigate(s.items[0].url);
                    }}
                    className={`aurora-rail-btn ${active ? 'is-active' : ''}`}
                    aria-label={s.label}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{s.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-2 pt-3 border-t border-white/10 w-10">
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={variant === 'admin' ? '/dropshipping' : '/admin'}
                  className="aurora-rail-btn aurora-rail-switcher"
                  aria-label={variant === 'admin' ? 'Switch to Buyer Panel' : 'Switch to Admin Panel'}
                >
                  {variant === 'admin' ? <Store className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                {variant === 'admin' ? 'Switch to Buyer Panel' : 'Switch to Admin Panel'}
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={variant === 'admin' ? '/admin' : '/dropshipping/profile'}>
                <Avatar className="h-9 w-9 ring-2 ring-white/30 hover:ring-white/60 transition">
                  {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                  <AvatarFallback className="bg-white/15 text-white text-[11px] font-semibold">{initials}</AvatarFallback>
                </Avatar>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{user?.name || 'Profile'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleLogout} className="aurora-rail-btn" aria-label="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
