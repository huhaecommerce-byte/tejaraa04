import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { AdminModuleKey } from '@/config/adminModules';

interface State {
  modules: AdminModuleKey[];
  isStaff: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  /** True when the user can access the admin panel at all. */
  canEnterAdmin: boolean;
  has: (m: AdminModuleKey) => boolean;
}

/**
 * Resolves the current user's admin-module access.
 * - Admins implicitly have every module.
 * - Staff users get the modules listed in their staff_permissions row.
 * - Subscribes to realtime changes so revoke/grant takes effect immediately.
 */
export function useStaffPermissions(): State {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [modules, setModules] = useState<AdminModuleKey[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  const fetchModules = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('staff_permissions')
      .select('modules')
      .eq('user_id', uid)
      .maybeSingle();
    setModules(((data?.modules as string[]) || []) as AdminModuleKey[]);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (authLoading) return;
      if (!user) { setModules([]); setLoading(false); return; }
      if (isAdmin) { setModules([]); setLoading(false); return; }
      if (!isStaff) { setModules([]); setLoading(false); return; }
      await fetchModules(user.id);
      if (!alive) return;
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user?.id, isAdmin, isStaff, authLoading, fetchModules]);

  // Realtime: react to permission and role changes for this user.
  // Use a unique channel name per mount to avoid "cannot add callbacks after subscribe()"
  // when React StrictMode (or fast refresh) re-runs the effect against a cached channel.
  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    const channelName = `staff-perms-${uid}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase.channel(channelName);
    channel.on(
      'postgres_changes' as never,
      { event: '*', schema: 'public', table: 'staff_permissions', filter: `user_id=eq.${uid}` },
      () => { fetchModules(uid); },
    );
    channel.on(
      'postgres_changes' as never,
      { event: '*', schema: 'public', table: 'user_roles', filter: `user_id=eq.${uid}` },
      () => { refreshUser(); },
    );
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchModules, refreshUser]);

  return {
    modules,
    isStaff,
    isAdmin,
    isLoading: authLoading || loading,
    canEnterAdmin: isAdmin || (isStaff && modules.length > 0),
    has: (m) => isAdmin || modules.includes(m),
  };
}
