import { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate, Link } from "@/lib/router-compat";
import { Menu, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { CommandDeck } from '@/components/layout/CommandDeck';
import { adminNavigation, filterNavigationByModules } from '@/config/navigation';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';
import { safeSetItem } from '@/lib/safeStorage';

const AdminLayout = () => {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const staffPerms = useStaffPermissions();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('aurora-panel-collapsed') === '1';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      safeSetItem('aurora-panel-collapsed', next ? '1' : '0');
      return next;
    });
  };

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (isLoading || staffPerms.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/shop/signin" replace />;
  if (user.role !== 'admin' && user.role !== 'staff') return <Navigate to="/dropshipping" replace />;

  const isStaffNoModules = user.role === 'staff' && staffPerms.modules.length === 0;
  const sections = user.role === 'staff'
    ? filterNavigationByModules(adminNavigation, staffPerms.modules)
    : adminNavigation;
  const staffBadge = user.role === 'staff'
    ? `Staff · ${staffPerms.modules.length} module${staffPerms.modules.length === 1 ? '' : 's'}`
    : undefined;

  return (
    <div className="min-h-screen w-full bg-[hsl(var(--muted)/0.5)]">
      <CommandDeck
        sections={sections}
        variant="admin"
        collapsed={collapsed}
        onToggle={toggle}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        staffBadge={staffBadge}
      />
      {/* Floating mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="lg:hidden fixed top-3 left-3 z-30 h-10 w-10 rounded-full bg-white/95 backdrop-blur shadow-md ring-1 ring-border/60 inline-flex items-center justify-center text-foreground/80 hover:bg-white"
        style={{ top: 'max(env(safe-area-inset-top), 0.75rem)' }}
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className={`${collapsed ? 'lg:ml-[64px]' : 'lg:ml-[260px]'} flex flex-col min-h-screen transition-[margin] duration-300`}>
        <main className="flex-1 px-3 md:px-6 pt-16 lg:pt-6 pb-24 md:pb-8">
          <div className="max-w-[1400px] mx-auto">
            {isStaffNoModules ? (
              <div className="max-w-md mx-auto mt-12 rounded-2xl border bg-card p-8 text-center shadow-sm">
                <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold mb-2">No modules assigned yet</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Your administrator hasn't granted you access to any admin modules. Once they do, the relevant pages will appear here automatically.
                </p>
                <Link to="/dropshipping" className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition">
                  Go to customer dashboard
                </Link>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
