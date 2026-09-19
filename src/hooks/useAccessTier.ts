import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  GUEST_ACCESS,
  canAccess,
  loadAccessProfile,
  type AccessProfile,
  type AccessTier,
} from '@/lib/access-tiers';

export interface UseAccessTier extends AccessProfile {
  loading: boolean;
  /** Shop and Dropshipping & Selling are open to every signed-in account. */
  canUseSelling: boolean;
  canUseAgency: boolean;
  canUseSupplier: boolean;
  allows: (required: AccessTier) => boolean;
}

/**
 * Single source of truth for "which platforms may this account open".
 * Shop/Selling accounts stop at Selling, agency partners also get the partner
 * portal, and supplier/console accounts may browse every platform.
 */
export function useAccessTier(): UseAccessTier {
  const [profile, setProfile] = useState<AccessProfile>(GUEST_ACCESS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const read = async (userId: string | undefined) => {
      const next = await loadAccessProfile(userId);
      if (!active) return;
      setProfile(next);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => void read(data.session?.user?.id));
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return;
      setLoading(true);
      void read(session?.user?.id);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return {
    ...profile,
    loading,
    canUseSelling: true,
    canUseAgency: canAccess(profile.tier, 'agency'),
    canUseSupplier: canAccess(profile.tier, 'supplier'),
    allows: (required: AccessTier) => canAccess(profile.tier, required),
  };
}
