export type Segment = {
  key: 'vip' | 'at_risk' | 'new' | 'dormant' | 'active';
  label: string;
  color: string; // tailwind classes
};

export function deriveSegments(opts: {
  orders: any[];
  tickets: any[];
  returns: any[];
  joinedAt: string;
}): Segment[] {
  const segs: Segment[] = [];
  const now = Date.now();
  const dayMs = 86400000;
  const lifetime = opts.orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const orderCount = opts.orders.length;
  const lastOrder = opts.orders[0]?.created_at ? new Date(opts.orders[0].created_at).getTime() : 0;
  const daysSinceLast = lastOrder ? Math.floor((now - lastOrder) / dayMs) : 999;
  const daysSinceJoin = Math.floor((now - new Date(opts.joinedAt).getTime()) / dayMs);
  const openTickets = opts.tickets.filter(t => !['resolved', 'closed'].includes((t.status || '').toLowerCase())).length;
  const recentReturns = opts.returns.filter(r => (now - new Date(r.created_at).getTime()) < 60 * dayMs).length;

  if (lifetime >= 5000 || orderCount >= 10) {
    segs.push({ key: 'vip', label: 'VIP', color: 'bg-amber-100 text-amber-700 border-amber-200' });
  }
  if (orderCount > 0 && daysSinceLast > 60) {
    segs.push({ key: 'dormant', label: 'Dormant', color: 'bg-slate-100 text-slate-700 border-slate-200' });
  }
  if (openTickets >= 2 || recentReturns >= 2) {
    segs.push({ key: 'at_risk', label: 'At-risk', color: 'bg-rose-100 text-rose-700 border-rose-200' });
  }
  if (daysSinceJoin <= 30 && orderCount <= 2) {
    segs.push({ key: 'new', label: 'New', color: 'bg-sky-100 text-sky-700 border-sky-200' });
  }
  if (segs.length === 0) {
    segs.push({ key: 'active', label: 'Active', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' });
  }
  return segs;
}

export function computeRisk(opts: {
  openTickets: number;
  pendingReturns: number;
  walletBalance: number;
  overdueInvoices: number;
}): { level: 'low' | 'medium' | 'high'; score: number; color: string; label: string } {
  let score = 0;
  score += opts.openTickets * 2;
  score += opts.pendingReturns * 3;
  score += opts.overdueInvoices * 4;
  if (opts.walletBalance < 0) score += 5;
  const level = score >= 8 ? 'high' : score >= 3 ? 'medium' : 'low';
  const color = level === 'high'
    ? 'bg-rose-100 text-rose-700 border-rose-200'
    : level === 'medium'
    ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-emerald-100 text-emerald-700 border-emerald-200';
  return { level, score, color, label: level === 'high' ? 'High risk' : level === 'medium' ? 'Watch' : 'Healthy' };
}
