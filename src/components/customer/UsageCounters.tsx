import { cn } from '@/lib/utils';

/**
 * Subscriptions/usage caps were removed — every feature is unlimited, so there
 * are no usage counters to display. Kept as a no-op so callers keep compiling.
 */
export function UsageCounters(_props: { className?: string; dark?: boolean }) {
  return null;
}

export default UsageCounters;
