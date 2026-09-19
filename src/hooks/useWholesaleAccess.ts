import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CONSOLE_ROLES, type AppRole } from '@/lib/partners/permissions';

const PORTAL_ROLES: AppRole[] = ['admin', 'supplier', 'staff', 'finance', 'viewer'];

export interface WholesaleAccess {
  /** True when the signed-in user may open the Wholesalers & Suppliers portal. */
  hasAccess: boolean;
  /** True when the user belongs to the internal console (admin/staff/finance/viewer). */
  isConsole: boolean;
  /** Where the user should land inside the portal. */
  portalHref: '/partners/admin' | '/partners/dashboard';
  loading: boolean;
}

/**
 * Shoppers and dropshipping sellers have no wholesale roles, so they never see
 * portal entry points. Wholesalers (and internal roles) do, on every surface.
 */
export function useWholesaleAccess(): WholesaleAccess {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const read = async (userId: string | undefined) => {
      if (!active) return;
      if (!userId) {
        setRoles([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('wl_user_roles').select('role').eq('user_id', userId);
      if (!active) return;
      setRoles(((data ?? []) as { role: AppRole }[]).map((row) => row.role));
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => void read(data.session?.user?.id));

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return;
      void read(session?.user?.id);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const isConsole = roles.some((role) => CONSOLE_ROLES.includes(role));
  return {
    hasAccess: roles.some((role) => PORTAL_ROLES.includes(role)),
    isConsole,
    portalHref: isConsole ? '/partners/admin' : '/partners/dashboard',
    loading,
  };
}
