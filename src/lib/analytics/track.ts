import { supabase } from '@/integrations/supabase/client';

const VISITOR_KEY = 'tejaraa_visitor_id';
const SESSION_KEY = 'tejaraa_analytics_session';
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes of inactivity ends a session

function uid(prefix: string) {
  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function ls(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function getVisitorId(): string {
  const store = ls();
  if (!store) return 'anon';
  let id = store.getItem(VISITOR_KEY);
  if (!id) {
    id = uid('v_');
    store.setItem(VISITOR_KEY, id);
  }
  return id;
}

interface SessionState {
  id: string;
  last: number;
  started: number;
  landed: boolean;
}

export function getSession(): SessionState {
  const store = ls();
  const now = Date.now();
  if (!store) return { id: 'anon', last: now, started: now, landed: true };
  let state: SessionState | null = null;
  try {
    const raw = store.getItem(SESSION_KEY);
    if (raw) state = JSON.parse(raw);
  } catch {
    state = null;
  }
  if (!state || now - state.last > SESSION_TTL) {
    state = { id: uid('s_'), last: now, started: now, landed: false };
  }
  state.last = now;
  store.setItem(SESSION_KEY, JSON.stringify(state));
  return state;
}

function markLanded() {
  const store = ls();
  if (!store) return;
  try {
    const raw = store.getItem(SESSION_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    state.landed = true;
    store.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function detectDevice(): string {
  if (typeof window === 'undefined') return 'unknown';
  const w = window.innerWidth;
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua) || (w >= 768 && w < 1024)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua) || w < 768) return 'mobile';
  return 'desktop';
}

function detectBrowser(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua)) return 'Opera';
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'Safari';
  if (/Firefox\//.test(ua)) return 'Firefox';
  return 'Other';
}

function detectOs(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/Windows/.test(ua)) return 'Windows';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Other';
}

function countryFromTimezone(tz: string | undefined): string | null {
  if (!tz) return null;
  const map: Record<string, string> = {
    'Asia/Riyadh': 'Saudi Arabia',
    'Asia/Dubai': 'UAE',
    'Asia/Kuwait': 'Kuwait',
    'Asia/Qatar': 'Qatar',
    'Asia/Bahrain': 'Bahrain',
    'Asia/Muscat': 'Oman',
    'Africa/Cairo': 'Egypt',
    'Asia/Karachi': 'Pakistan',
    'Asia/Shanghai': 'China',
    'Asia/Kolkata': 'India',
  };
  return map[tz] || tz.split('/')[1]?.replace(/_/g, ' ') || null;
}

let currentUserId: string | null = null;
supabase.auth.getUser().then(({ data }) => { currentUserId = data.user?.id ?? null; }).catch(() => {});
supabase.auth.onAuthStateChange((_e, session) => { currentUserId = session?.user?.id ?? null; });

let lastPath = '';
let lastEnteredAt = 0;
let lastRowId: string | null = null;

/** Records a page view. Safe to call on every route change; never throws. */
export async function trackPageView(path: string, title?: string) {
  if (typeof window === 'undefined') return;
  if (path === lastPath) return;

  // close out the previous page's dwell time
  void flushDuration();

  lastPath = path;
  lastEnteredAt = Date.now();

  try {
    const session = getSession();
    const params = new URLSearchParams(window.location.search);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const rowId = (crypto as any).randomUUID ? crypto.randomUUID() : uid('r_');
    const row = {
      id: rowId,
      visitor_id: getVisitorId(),
      session_id: session.id,
      user_id: currentUserId,
      path,
      title: title || document.title || '',
      referrer: document.referrer || '',
      is_landing: !session.landed,
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      referral_code: params.get('ref'),
      device_type: detectDevice(),
      browser: detectBrowser(),
      os: detectOs(),
      screen_w: window.screen?.width ?? null,
      screen_h: window.screen?.height ?? null,
      language: navigator.language || null,
      timezone: tz || null,
      country: countryFromTimezone(tz),
    };
    markLanded();

    lastRowId = rowId;
    await (supabase as any).from('page_view_events').insert(row);
  } catch {
    // analytics must never break the UX
  }
}

async function flushDuration(keepAlive = false) {
  if (!lastRowId || !lastEnteredAt) return;
  const id = lastRowId;
  const ms = Date.now() - lastEnteredAt;
  if (!keepAlive) lastRowId = null;
  if (ms < 300 || ms > 60 * 60 * 1000) return;
  try {
    await (supabase as any).rpc('record_page_duration', { _id: id, _ms: ms });
  } catch {
    /* ignore */
  }
}

if (typeof window !== 'undefined') {
  // Heartbeat keeps time-on-page accurate even if the tab is closed abruptly.
  window.setInterval(() => { void flushDuration(true); }, 10000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushDuration(true);
  });
  window.addEventListener('pagehide', () => { void flushDuration(); });
}


/** Records a named funnel event (search, product_view, checkout_started, order_placed…). */
export async function trackEvent(name: string, props: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  try {
    const session = getSession();
    await (supabase as any).from('site_events').insert({
      visitor_id: getVisitorId(),
      session_id: session.id,
      user_id: currentUserId,
      name,
      path: window.location.pathname,
      props,
    });
  } catch {
    /* ignore */
  }
}
