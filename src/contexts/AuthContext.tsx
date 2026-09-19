import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type UserRole = 'customer' | 'admin' | 'staff' | null;

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function resolveRole(userId: string): Promise<UserRole> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  const roles = (data || []).map((r: any) => r.role);
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('staff')) return 'staff';
  return 'customer';
}

async function buildAuthUser(session: Session): Promise<AuthUser> {
  const u = session.user;
  try {
    const [role, profile] = await Promise.all([
      resolveRole(u.id).catch(() => 'customer' as UserRole),
      supabase.from('profiles').select('display_name, avatar_url').eq('user_id', u.id).maybeSingle(),
    ]);
    const email = u.email || (u.user_metadata as any)?.email || '';
    return {
      id: u.id,
      email,
      name:
        profile.data?.display_name ||
        (u.user_metadata as any)?.full_name ||
        (u.user_metadata as any)?.name ||
        email.split('@')[0] ||
        'User',
      role,
      avatar_url: profile.data?.avatar_url || (u.user_metadata as any)?.avatar_url || null,
    };
  } catch {
    return {
      id: u.id,
      email: u.email || '',
      name: u.email?.split('@')[0] || 'User',
      role: 'customer',
      avatar_url: null,
    };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const hydrateUser = async (session: Session | null) => {
      if (!mounted) return;

      if (!session) {
        setUser(null);
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const nextUser = await buildAuthUser(session);
        if (!mounted) return;
        setUser(nextUser);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void hydrateUser(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      void hydrateUser(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(await buildAuthUser(session));
    } else {
      setUser(null);
    }
  }, []);

  /**
   * Frees browser storage when it's full (QuotaExceededError) by removing only
   * our app's non-essential cached data (analytics, browsing history, exports).
   * Auth/session keys are never touched.
   */
  const freeLocalStorageSpace = () => {
    try {
      const victims: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (
          key.startsWith('tejaraa_recent_views') ||
          key.startsWith('tejaraa_browsed_products_') ||
          key.startsWith('tejaraa_analytics') ||
          key.startsWith('tejaraa_view_session') ||
          key.startsWith('tejaraa.recentExports')
        ) {
          victims.push(key);
        }
      }
      victims.forEach(k => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  };

  const isQuotaError = (err: unknown) => {
    const name = (err as any)?.name || '';
    const msg = ((err as any)?.message || '').toLowerCase();
    return name === 'QuotaExceededError' || msg.includes('quota');
  };

  const claimGuestOrders = async () => {
    try {
      await (supabase as any).rpc('claim_guest_shop_orders');
    } catch { /* non-blocking */ }
  };

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await claimGuestOrders();
    } catch (err) {
      // Browser storage full → session couldn't be persisted. Free our own
      // cached data and retry once so the login succeeds.
      if (isQuotaError(err)) {
        freeLocalStorageSpace();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await claimGuestOrders();
        return;
      }
      throw err;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo:
          typeof window === 'undefined' ? 'https://tejaraa.com/login' : `${window.location.origin}/login`,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
