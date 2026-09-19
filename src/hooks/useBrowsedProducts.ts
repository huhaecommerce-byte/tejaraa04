import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentPlan } from './useCurrentPlan';
import { safeSetItem, safeRemoveItem } from '@/lib/safeStorage';

const MAX_IDS = 200;
const SYNC_EVENT = 'tejaraa_browsed_update';

interface StoredEntry {
  id: string;
  ts: number;
}

function getKey(userId: string) {
  return `tejaraa_browsed_products_${userId}`;
}

function readEntries(userId: string): StoredEntry[] {
  try {
    const stored = localStorage.getItem(getKey(userId));
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      const now = Date.now();
      return parsed.map((id: string) => ({ id, ts: now }));
    }
    return parsed as StoredEntry[];
  } catch {
    return [];
  }
}

function writeEntries(userId: string, entries: StoredEntry[]) {
  const key = getKey(userId);
  let list = entries.slice(-MAX_IDS);
  // Storage can be full (quota exceeded) — degrade gracefully instead of crashing the page.
  for (let attempt = 0; attempt < 4; attempt++) {
    if (safeSetItem(key, JSON.stringify(list))) return;
    list = list.slice(Math.ceil(list.length / 2));
    if (list.length === 0) {
      safeRemoveItem(key);
      return;
    }
  }
}


export function useBrowsedProducts() {
  const { user } = useAuth();
  const { numericLimit } = useCurrentPlan();
  const historyDays = numericLimit('browsed_history_days');

  // Eagerly initialise from localStorage when user is already known
  const [entries, setEntries] = useState<StoredEntry[]>(() =>
    user?.id ? readEntries(user.id) : []
  );

  const prevUserId = useRef(user?.id);

  useEffect(() => {
    if (!user?.id) return;
    // Re-read when user changes (not on every render)
    if (prevUserId.current !== user.id) {
      setEntries(readEntries(user.id));
      prevUserId.current = user.id;
    }
    const handler = () => setEntries(readEntries(user.id));
    window.addEventListener(SYNC_EVENT, handler);
    return () => window.removeEventListener(SYNC_EVENT, handler);
  }, [user?.id]);

  const addBrowsed = useCallback((ids: string[]) => {
    if (!user?.id) return;
    const current = readEntries(user.id);
    const map = new Map(current.map(e => [e.id, e.ts]));
    const now = Date.now();
    ids.forEach(id => map.set(id, now));
    const arr = Array.from(map.entries()).map(([id, ts]) => ({ id, ts })).slice(-MAX_IDS);
    writeEntries(user.id, arr);
    setEntries(arr);
    window.dispatchEvent(new Event(SYNC_EVENT));
  }, [user?.id]);

  const clearBrowsed = useCallback(() => {
    if (!user?.id) return;
    safeRemoveItem(getKey(user.id));
    setEntries([]);
    window.dispatchEvent(new Event(SYNC_EVENT));
  }, [user?.id]);

  // Enforce plan-based history window — reverse so newest-first
  const browsedIds = useMemo(() => {
    let filtered = entries;
    if (historyDays && historyDays !== Infinity) {
      const cutoff = Date.now() - historyDays * 86400_000;
      filtered = entries.filter(e => e.ts >= cutoff);
    }
    return [...filtered].reverse().map(e => e.id);
  }, [entries, historyDays]);

  return { browsedIds, addBrowsed, clearBrowsed, historyDays };
}
