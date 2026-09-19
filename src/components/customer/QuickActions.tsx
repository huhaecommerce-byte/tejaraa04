import { Link } from "@/lib/router-compat";
import {
  ShoppingBag, CreditCard, Truck, Inbox, Tag, TicketIcon,
} from 'lucide-react';

const actions = [
  { label: 'Place Order', icon: ShoppingBag, url: '/dropshipping/catalog', color: 'hsl(152 60% 92%)' },
  { label: 'Top Up Wallet', icon: CreditCard, url: '/dropshipping/billing?tab=wallet', color: 'hsl(45 90% 92%)' },
  { label: 'Track Shipment', icon: Truck, url: '/dropshipping/fulfillment', color: 'hsl(210 80% 92%)' },
  { label: 'Request Sourcing', icon: Inbox, url: '/dropshipping/sourcing', color: 'hsl(280 60% 92%)' },
  { label: 'Create Label', icon: Tag, url: '/dropshipping/labelling', color: 'hsl(330 60% 92%)' },
  { label: 'Submit Ticket', icon: TicketIcon, url: '/dropshipping/tickets', color: 'hsl(20 80% 92%)' },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-nowrap lg:gap-2 lg:overflow-x-auto lg:pb-1 scrollbar-none">
      {actions.map((a) => (
        <Link
          key={a.label}
          to={a.url}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-card/80 backdrop-blur-sm border border-border/60 hover:border-border hover:shadow-md hover:-translate-y-0.5 transition-all whitespace-nowrap"
        >
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: a.color }}
          >
            <a.icon className="h-3.5 w-3.5 text-foreground/70" />
          </span>
          <span className="truncate">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}
