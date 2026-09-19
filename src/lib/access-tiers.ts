import { supabase } from '@/integrations/supabase/client';

/**
 * Tejaraa account tiers.
 *
 * The platforms are nested, not separate silos:
 *
 *   member   → Shop + Dropshipping & Selling (one and the same account)
 *   agency   → Shop + Selling + Agencies & VAs portal
 *   supplier → everything above + the Wholesalers & Suppliers portal
 *
 * A higher tier always includes every lower one, so the rule is a simple
 * comparison instead of a per-portal role list.
 */
export type AccessTier = 'member' | 'agency' | 'supplier';

export const TIER_RANK: Record<AccessTier, number> = {
  member: 1,
  agency: 2,
  supplier: 3,
};

/** Roles inside the wholesale console that unlock the supplier tier. */
export const SUPPLIER_TIER_ROLES = ['supplier', 'admin', 'staff', 'finance', 'viewer'] as const;

export interface AccessProfile {
  tier: AccessTier;
  /** True when the user belongs to internal staff (admin/staff/finance/viewer). */
  isConsole: boolean;
  /** True when an approved/pending agency partner profile exists for the user. */
  hasAgencyProfile: boolean;
}

export const GUEST_ACCESS: AccessProfile = {
  tier: 'member',
  isConsole: false,
  hasAgencyProfile: false,
};

/** Can this account open a platform that requires `required` or above? */
export function canAccess(tier: AccessTier, required: AccessTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[required];
}

/** Reads the signed-in user's tier from the wholesale roles + agency profile. */
export async function loadAccessProfile(userId: string | undefined): Promise<AccessProfile> {
  if (!userId) return GUEST_ACCESS;

  const [wholesale, agency] = await Promise.all([
    supabase.from('wl_user_roles').select('role').eq('user_id', userId),
    supabase.from('agency_profiles').select('id').eq('user_id', userId).maybeSingle(),
  ]);

  const roles = ((wholesale.data ?? []) as { role: string }[]).map((row) => row.role);
  const isConsole = roles.some((role) => ['admin', 'staff', 'finance', 'viewer'].includes(role));
  const isSupplier = roles.some((role) => (SUPPLIER_TIER_ROLES as readonly string[]).includes(role));
  const hasAgencyProfile = Boolean(agency.data);

  return {
    tier: isSupplier ? 'supplier' : hasAgencyProfile ? 'agency' : 'member',
    isConsole,
    hasAgencyProfile,
  };
}
