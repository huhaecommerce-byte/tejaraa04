import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  DEFAULT_BULK_TIERS,
  parseBulkTiers,
  unitPriceForQty,
  type BulkTier,
} from '@/lib/retailPricing';

export interface CartItem {
  productId: string;
  sku: string;
  slug?: string | null;
  name: string;
  image?: string | null;
  basePriceSar: number;
  qty: number;
  moq: number;
  source: string;
  weightKg: number;
}

interface CartContextValue {
  items: CartItem[];
  isHydrated: boolean;
  tiers: BulkTier[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  lineTotal: (item: CartItem) => number;
  unitPrice: (item: CartItem) => number;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'tejaraa_cart_v1';

function readStored(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [tiers, setTiers] = useState<BulkTier[]>(DEFAULT_BULK_TIERS);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    setItems(readStored());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !isHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full or unavailable — cart stays in memory */
    }
  }, [items, isHydrated]);

  useEffect(() => {
    supabase
      .from('platform_settings')
      .select('key, value')
      .like('key', 'retail_tier_%')
      .then(({ data }) => {
        if (!data?.length) return;
        const map: Record<string, string> = {};
        data.forEach((r: any) => { map[r.key] = r.value; });
        setTiers(parseBulkTiers(map));
      });
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const unitPrice = (item: CartItem) => unitPriceForQty(item.basePriceSar, item.qty, tiers);
    const lineTotal = (item: CartItem) => Math.round(unitPrice(item) * item.qty * 100) / 100;
    return {
      items,
      isHydrated,
      tiers,
      isOpen,
      setOpen,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + lineTotal(i), 0),
      unitPrice,
      lineTotal,
      addItem: (item, qty = 1) =>
        setItems((prev) => {
          const existing = prev.find((p) => p.productId === item.productId);
          if (existing) {
            return prev.map((p) =>
              p.productId === item.productId ? { ...p, qty: p.qty + qty } : p,
            );
          }
          return [...prev, { ...item, qty }];
        }),
      setQty: (productId, qty) =>
        setItems((prev) =>
          prev.map((p) => (p.productId === productId ? { ...p, qty: Math.max(1, qty) } : p)),
        ),
      removeItem: (productId) => setItems((prev) => prev.filter((p) => p.productId !== productId)),
      clear: () => setItems([]),
    };
  }, [items, tiers, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
