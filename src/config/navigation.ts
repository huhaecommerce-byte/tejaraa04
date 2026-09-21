import {
  LayoutDashboard, ShoppingBag, ShoppingCart, Tag, Truck, Wallet, FileText,
  TicketIcon, User, Settings, Users, CreditCard, MessageSquare, Globe, Palette,
  Box, Package, LayoutGrid, Search, Inbox, BarChart3, Factory, Undo2,
  ScrollText, Boxes, Warehouse, Cog, Briefcase, Cloud, ShoppingBasket, Coins,
  ListChecks, Activity, Webhook, Flame, Plug, Share2, Handshake, FileArchive,
} from 'lucide-react';

import type { AdminModuleKey } from './adminModules';

export type NavChild = { title: string; url: string; module?: AdminModuleKey };
export type BadgeKey = 'orders' | 'sourcing' | 'tickets';
export type NavItem = {
  title: string;
  url: string;
  icon: any;
  starterOnly?: boolean;
  children?: NavChild[];
  badgeKey?: BadgeKey;
  /** Admin module key gating visibility for staff users. Items with no module are always visible. */
  module?: AdminModuleKey;
};
export type NavSection = {
  id: string;
  label: string;
  icon: any;
  items: NavItem[];
  accent?: 'blue' | 'amber' | 'violet' | 'slate' | 'teal';
};

export const customerNavigation: NavSection[] = [
  {
    id: 'main',
    label: 'Workspace',
    icon: LayoutDashboard,
    items: [
      { title: 'Dashboard', url: '/dropshipping', icon: LayoutDashboard },
      {
        title: 'Product Sourcing',
        url: '/dropshipping/catalog',
        icon: ShoppingBag,
        children: [
          { title: 'Product Catalog', url: '/dropshipping/catalog' },
          { title: 'Product Hunting', url: '/dropshipping/catalog/hunting' },
          { title: 'Export Catalog', url: '/dropshipping/catalog/export' },
        ],
      },
      { title: 'Orders Hub', url: '/dropshipping/orders', icon: ShoppingCart },
      { title: 'Sourcing Request', url: '/dropshipping/sourcing', icon: Search },
      { title: 'Labelling & Fulfillment', url: '/dropshipping/fulfillment', icon: Truck },
      { title: 'Store Integrations', url: '/dropshipping/integrations', icon: Plug },
      { title: 'My Warehouse', url: '/dropshipping/warehouse', icon: Boxes },
      { title: 'Wallet & Billing', url: '/dropshipping/billing', icon: Wallet },
      { title: 'Support & Tickets', url: '/dropshipping/tickets', icon: TicketIcon },
      { title: 'Profile & Plan', url: '/dropshipping/profile', icon: User },
    ],
  },
];

export const agencyNavigation: NavSection[] = [
  {
    id: 'agency',
    label: 'Agency Portal',
    icon: LayoutDashboard,
    accent: 'teal',
    items: [
      { title: 'Dashboard', url: '/agency/portal', icon: LayoutDashboard },
      { title: 'My Invite Link', url: '/agency/portal/link', icon: Share2 },
      { title: 'My Dropshippers', url: '/agency/portal/clients', icon: Users },
      { title: 'Earnings', url: '/agency/portal/earnings', icon: Coins },
      { title: 'Payouts', url: '/agency/portal/payouts', icon: Wallet },
      { title: 'Profile', url: '/agency/portal/profile', icon: User },
    ],
  },
];

/**
 * Admin navigation grouped by INTENT with collapsible sub-tabs per hub.
 * Sidebar shows ~9 primary rows; chevrons reveal hub sub-tabs that deep-link via ?tab=.
 */
export const adminNavigation: NavSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    accent: 'teal',
    items: [
      { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    id: 'catalog',
    label: 'Catalog',
    icon: Box,
    accent: 'blue',
    items: [
      {
        title: 'Products',
        url: '/admin/catalog-hub',
        icon: Box,
        module: 'catalog',
        children: [
          { title: 'Suppliers', url: '/admin/catalog-hub?tab=suppliers', module: 'suppliers' },
          { title: 'Platforms', url: '/admin/catalog-hub?tab=platforms', module: 'platforms' },
          { title: 'Label Designer', url: '/admin/catalog-hub?tab=designer', module: 'label-designer' },
        ],
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Briefcase,
    accent: 'amber',
    items: [
      {
        title: 'Orders',
        url: '/admin/ops-hub',
        icon: ShoppingCart,
        badgeKey: 'orders',
        module: 'orders',
        children: [
          { title: 'Labelling Queue', url: '/admin/ops-hub?tab=labelling', module: 'labelling' },
          { title: 'Delivery', url: '/admin/ops-hub?tab=delivery', module: 'delivery' },
          { title: 'Warehouse', url: '/admin/ops-hub?tab=warehouse', module: 'warehouse' },
          { title: 'Returns / RMA', url: '/admin/ops-hub?tab=returns', module: 'returns' },
        ],
      },
      {
        title: 'Sourcing',
        url: '/admin/sourcing-hub',
        icon: Inbox,
        badgeKey: 'sourcing',
        module: 'sourcing',
        children: [
          { title: 'Inbox', url: '/admin/sourcing-hub', module: 'sourcing' },
          { title: 'Bulk Quotes', url: '/admin/sourcing-hub?tab=quotes', module: 'quotes' },
        ],
      },
    ],
  },
  {
    id: 'people',
    label: 'Customers',
    icon: Users,
    accent: 'violet',
    items: [
      { title: 'Customers', url: '/admin/customers', icon: Users, module: 'customers' },
      { title: 'Plan Usage', url: '/admin/plan-usage', icon: BarChart3, module: 'customers' },
      { title: 'Support Tickets', url: '/admin/tickets', icon: TicketIcon, badgeKey: 'tickets', module: 'tickets' },
      { title: 'Reports', url: '/admin/reports', icon: BarChart3, module: 'reports' },
      { title: 'Visitor Analytics', url: '/admin/analytics', icon: Activity, module: 'analytics' },
    ],
  },
  {
    id: 'internal',
    label: 'Internal',
    icon: Cog,
    accent: 'slate',
    items: [
      {
        title: 'Pricing & Plans',
        url: '/admin/internal-hub',
        icon: CreditCard,
        module: 'pricing',
        children: [
          { title: 'Promo Codes', url: '/admin/internal-hub?tab=promo', module: 'promo' },
          { title: 'Homepage Layout', url: '/admin/internal-hub?tab=homepage', module: 'homepage' },
          { title: 'Contact Details', url: '/admin/internal-hub?tab=contact', module: 'contact' },
          { title: 'Audit Log', url: '/admin/internal-hub?tab=audit', module: 'audit' },
          { title: 'Settings', url: '/admin/internal-hub?tab=settings', module: 'settings' },
          { title: 'Emails', url: '/admin/emails', module: 'emails' },
        ],
      },
      { title: 'Project Exports', url: '/admin/exports', icon: FileArchive, module: 'settings' },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Cloud,
    accent: 'teal',
    items: [
      {
        title: 'SunSky',
        url: '/admin/sunsky',
        icon: Cloud,
        module: 'sunsky',
        children: [
          { title: 'Products',  url: '/admin/sunsky?tab=products',  module: 'sunsky' },
          { title: 'Bulk import', url: '/admin/sunsky?tab=catalog', module: 'sunsky' },
          { title: 'Imported',  url: '/admin/sunsky?tab=imported',  module: 'sunsky' },
          { title: 'Orders',    url: '/admin/sunsky?tab=orders',    module: 'sunsky' },
          { title: 'Coupons',   url: '/admin/sunsky?tab=coupons',   module: 'sunsky' },
          { title: 'Hot Items', url: '/admin/sunsky?tab=stats',     module: 'sunsky' },
          { title: 'Webhooks',  url: '/admin/sunsky?tab=callbacks', module: 'sunsky' },
          { title: 'Logs',      url: '/admin/sunsky?tab=logs',      module: 'sunsky' },
          { title: 'Settings',  url: '/admin/sunsky?tab=settings',  module: 'sunsky' },
        ],
      },
    ],
  },
];

export function findActiveSectionId(pathname: string, sections: NavSection[]): string {
  for (const sec of sections) {
    for (const it of sec.items) {
      const url = it.url.split('?')[0];
      const matches = url === pathname || (url !== '/dropshipping' && url !== '/admin' && pathname.startsWith(url + '/'));
      if (matches) return sec.id;
      if ((url === '/dropshipping' || url === '/admin') && pathname === url) return sec.id;
    }
  }
  return sections[0].id;
}

/**
 * Returns a copy of `sections` containing only items whose `module` is in `allowed`
 * (or items with no module — those are always visible). Strips a section entirely
 * if no items remain. Used to hide admin sidebar entries from staff users.
 */
export function filterNavigationByModules(
  sections: NavSection[],
  allowed: AdminModuleKey[],
): NavSection[] {
  const allow = new Set(allowed);
  const out: NavSection[] = [];
  for (const sec of sections) {
    const items: NavItem[] = [];
    for (const it of sec.items) {
      if (it.module && !allow.has(it.module)) continue;
      const children = (it.children || []).filter(c => !c.module || allow.has(c.module));
      items.push({ ...it, children: it.children ? children : undefined });
    }
    if (items.length > 0) out.push({ ...sec, items });
  }
  return out;
}

/** Sidebar for the standalone Agencies & VAs admin portal (/agency-admin). */
export const agencyAdminNavigation: NavSection[] = [
  {
    id: 'agency-admin',
    label: 'Agency programme',
    icon: Handshake,
    accent: 'violet',
    items: [
      { title: 'Overview', url: '/agency-admin', icon: LayoutDashboard },
      { title: 'Agencies & VAs', url: '/agency-admin/partners', icon: Handshake },
      { title: 'Payout requests', url: '/agency-admin/payouts', icon: Wallet },
      { title: 'Programme settings', url: '/agency-admin/settings', icon: Cog },
    ],
  },
  {
    id: 'agency-admin-links',
    label: 'Elsewhere',
    icon: Briefcase,
    accent: 'slate',
    items: [
      { title: 'Main admin panel', url: '/admin', icon: Settings },
    ],
  },
];
