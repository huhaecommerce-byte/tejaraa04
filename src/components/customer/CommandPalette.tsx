import { useEffect, useState } from 'react';
import { useNavigate } from "@/lib/router-compat";
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, Search as SearchIcon, Truck,
  Boxes, Wallet, TicketIcon, User, Plus, CreditCard, Inbox, Tag,
} from 'lucide-react';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, url: '/dropshipping' },
  { label: 'Products', icon: ShoppingBag, url: '/dropshipping/catalog' },
  { label: 'Orders', icon: ShoppingCart, url: '/dropshipping/orders' },
  { label: 'Sourcing', icon: SearchIcon, url: '/dropshipping/sourcing' },
  { label: 'Fulfillment', icon: Truck, url: '/dropshipping/fulfillment' },
  { label: 'Warehouse', icon: Boxes, url: '/dropshipping/warehouse' },
  { label: 'Wallet & Billing', icon: Wallet, url: '/dropshipping/billing' },
  { label: 'Support', icon: TicketIcon, url: '/dropshipping/tickets' },
  { label: 'Profile', icon: User, url: '/dropshipping/profile' },
];

const ACTIONS = [
  { label: 'Place Order', icon: Plus, url: '/dropshipping/catalog' },
  { label: 'Top Up Wallet', icon: CreditCard, url: '/dropshipping/billing?tab=wallet' },
  { label: 'New Sourcing Request', icon: Inbox, url: '/dropshipping/sourcing' },
  { label: 'Create Support Ticket', icon: TicketIcon, url: '/dropshipping/tickets' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!open || !user?.id) return;
    supabase
      .from('orders')
      .select('id, status, total, type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setRecentOrders(data || []));
  }, [open, user?.id]);

  const go = (url: string) => {
    onOpenChange(false);
    navigate(url);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, actions, orders..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {NAV_ITEMS.map((item) => (
            <CommandItem key={item.url} onSelect={() => go(item.url)}>
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          {ACTIONS.map((item) => (
            <CommandItem key={item.label} onSelect={() => go(item.url)}>
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        {recentOrders.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Orders">
              {recentOrders.map((o) => (
                <CommandItem key={o.id} onSelect={() => go(`/dropshipping/orders/${o.id}`)}>
                  <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">#{o.id.slice(0, 8)} · SAR {Number(o.total).toFixed(2)}</span>
                  <Badge variant="secondary" className={`text-[10px] ml-2 ${STATUS_COLORS[o.status] || ''}`}>
                    {o.status}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
