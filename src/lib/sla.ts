// SLA helpers for labelling & delivery countdowns
const HOUR_MS = 1000 * 60 * 60;

const SLA_HOURS: Record<string, number> = {
  // Labelling SLAs
  pending: 24,
  in_progress: 48,
  // Delivery SLAs
  processing: 24,
  labelling: 48,
  shipped: 96,
};

export type SlaInfo = {
  hoursLeft: number;
  label: string;
  tone: 'ok' | 'warn' | 'breach' | 'done';
};

export function computeSla(createdAt: string, status: string): SlaInfo {
  if (status === 'completed' || status === 'delivered' || status === 'cancelled') {
    return { hoursLeft: 0, label: '✓ Done', tone: 'done' };
  }
  const budget = SLA_HOURS[status] ?? 24;
  const elapsedMs = Date.now() - new Date(createdAt).getTime();
  const leftMs = budget * HOUR_MS - elapsedMs;
  const hoursLeft = Math.round(leftMs / HOUR_MS);

  if (leftMs <= 0) {
    const overH = Math.abs(hoursLeft);
    return { hoursLeft, label: `Breached ${overH}h ago`, tone: 'breach' };
  }
  if (leftMs < 6 * HOUR_MS) {
    return { hoursLeft, label: `${hoursLeft}h left`, tone: 'warn' };
  }
  return { hoursLeft, label: `${hoursLeft}h left`, tone: 'ok' };
}

export function slaBadgeClass(tone: SlaInfo['tone']): string {
  switch (tone) {
    case 'breach': return 'bg-destructive/15 text-destructive border-destructive/30';
    case 'warn': return 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400';
    case 'done': return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}
