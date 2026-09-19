/**
 * Quota-safe localStorage writes.
 *
 * Firefox (and other browsers) cap localStorage at ~5–10 MB per origin. When it
 * fills up, EVERY write fails — including the auth session — and Firefox shows a
 * "running out of disk space" warning. This helper wraps setItem, and on a quota
 * error clears only known nonessential Tejaraa cache keys, then retries once.
 * Auth/session keys are never touched.
 */

/** Key prefixes that are safe to evict when storage is full. Never add auth keys here. */
const EVICTABLE_PREFIXES = [
  'tejaraa_recent_views',
  'tejaraa_browsed_products_',
  'tejaraa_analytics',
  'tejaraa_view_session',
  'tejaraa.recentExports',
];

function evictNonessential() {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && EVICTABLE_PREFIXES.some((p) => key.startsWith(p))) doomed.push(key);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/** Returns true if the value was written (possibly after an eviction retry). */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    evictNonessential();
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
}

export function safeRemoveItem(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
