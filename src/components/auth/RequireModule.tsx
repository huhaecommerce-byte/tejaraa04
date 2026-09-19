import { Navigate, useLocation, useSearchParams } from "@/lib/router-compat";
import { useStaffPermissions } from '@/hooks/useStaffPermissions';
import type { AdminModuleKey } from '@/config/adminModules';
import { moduleForRoute } from '@/config/adminModules';

interface Props {
  /** Explicit module to require. If omitted, infers from current route + ?tab. */
  module?: AdminModuleKey;
  children: React.ReactNode;
}

/**
 * Blocks access to an admin route when the current staff user lacks the required module.
 * Admins always pass through. Authentication itself is enforced by AdminLayout.
 */
export function RequireModule({ module, children }: Props) {
  const { isAdmin, isStaff, has, isLoading } = useStaffPermissions();
  const location = useLocation();
  const [params] = useSearchParams();

  if (isLoading) return null;
  if (isAdmin) return <>{children}</>;
  if (!isStaff) return <>{children}</>; // AdminLayout already redirects non-admin/staff away

  const required = module ?? moduleForRoute(location.pathname, params.get('tab'));
  if (!required) return <>{children}</>;
  if (has(required)) return <>{children}</>;

  return <Navigate to="/admin" replace />;
}
