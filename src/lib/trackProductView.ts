import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/analytics/track';
import { safeSetItem, safeRemoveItem } from '@/lib/safeStorage';

const DEBOUNCE_MS = 5 * 60 * 1000; // one view per product per 5 min per session
const SESSION_KEY = 'tejaraa_view_session_id';
const SEEN_KEY = 'tejaraa_recent_views';

function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      safeSetItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

function readSeen(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const MAX_SEEN = 500; // hard cap so heavy browsing can't grow localStorage unbounded

function writeSeen(map: Record<string, number>) {
  const keys = Object.keys(map);
  if (keys.length > MAX_SEEN) {
    keys
      .sort((a, b) => map[a] - map[b])
      .slice(0, keys.length - MAX_SEEN)
      .forEach((k) => delete map[k]);
  }
  if (!safeSetItem(SEEN_KEY, JSON.stringify(map))) {
    safeRemoveItem(SEEN_KEY);
  }
}

export async function trackProductView(productId: string | undefined | null) {
  if (!productId) return;
  const seen = readSeen();
  const last = seen[productId] || 0;
  const now = Date.now();
  if (now - last < DEBOUNCE_MS) return;

  seen[productId] = now;
  // prune entries older than a day to keep map small
  const cutoff = now - 86400000;
  Object.keys(seen).forEach(k => {
    if (seen[k] < cutoff) delete seen[k];
  });
  writeSeen(seen);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    await (supabase as any).from('product_view_events').insert({
      product_id: productId,
      user_id: user?.id ?? null,
      session_id: getSessionId(),
    });
    void trackEvent('product_view', { product_id: productId });
  } catch {
    // silently ignore — analytics shouldn't break UX
  }
}
