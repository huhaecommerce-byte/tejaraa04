import { cn } from '@/lib/utils';

interface UpgradePromptProps {
  currentPlan?: string;
  limitLabel?: string;
  message?: string;
  variant?: 'card' | 'chip';
  usage?: number;
  limit?: number | 'unlimited';
  className?: string;
}

/**
 * Subscriptions were removed — every feature is unlocked, so there is nothing
 * to upgrade to. Kept as a no-op so existing call sites keep compiling.
 */
const UpgradePrompt = (_props: UpgradePromptProps) => null;

export default UpgradePrompt;
