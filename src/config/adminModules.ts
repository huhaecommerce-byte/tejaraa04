// Registry of every gated admin module key, plus where it appears in the UI.
// Used by the staff-permissions checklist, sidebar filtering, and route guards.

export type AdminModuleKey =
  | 'orders' | 'labelling' | 'delivery' | 'warehouse' | 'returns'
  | 'sourcing' | 'quotes'
  | 'customers' | 'tickets' | 'reports' | 'analytics'
  | 'catalog' | 'suppliers' | 'platforms' | 'label-designer'
  | 'pricing' | 'promo' | 'homepage' | 'contact' | 'audit' | 'settings' | 'emails'
  | 'sunsky';

export interface AdminModule {
  key: AdminModuleKey;
  label: string;
  group: 'Operations' | 'Sourcing' | 'People' | 'Catalog' | 'Internal' | 'Integrations';
}

export const ADMIN_MODULES: AdminModule[] = [
  // Operations
  { key: 'orders',      label: 'Orders',         group: 'Operations' },
  { key: 'labelling',   label: 'Labelling',      group: 'Operations' },
  { key: 'delivery',    label: 'Delivery',       group: 'Operations' },
  { key: 'warehouse',   label: 'Warehouse',      group: 'Operations' },
  { key: 'returns',     label: 'Returns / RMA',  group: 'Operations' },

  // Sourcing
  { key: 'sourcing',    label: 'Sourcing Inbox', group: 'Sourcing' },
  { key: 'quotes',      label: 'Bulk Quotes',    group: 'Sourcing' },

  // People
  { key: 'customers',   label: 'Customers',      group: 'People' },
  { key: 'tickets',     label: 'Support Tickets', group: 'People' },
  { key: 'reports',     label: 'Reports',        group: 'People' },
  { key: 'analytics',   label: 'Visitor Analytics', group: 'People' },

  // Catalog
  { key: 'catalog',         label: 'Products',       group: 'Catalog' },
  { key: 'suppliers',       label: 'Suppliers',      group: 'Catalog' },
  { key: 'platforms',       label: 'Platforms',      group: 'Catalog' },
  { key: 'label-designer',  label: 'Label Designer', group: 'Catalog' },

  // Internal
  { key: 'pricing',     label: 'Pricing & Plans', group: 'Internal' },
  { key: 'promo',       label: 'Promo Codes',     group: 'Internal' },
  { key: 'homepage',    label: 'Homepage Layout', group: 'Internal' },
  { key: 'contact',     label: 'Contact Details', group: 'Internal' },
  { key: 'audit',       label: 'Audit Log',       group: 'Internal' },
  { key: 'settings',    label: 'Settings',        group: 'Internal' },
  { key: 'emails',      label: 'Emails',          group: 'Internal' },

  // Integrations
  { key: 'sunsky',      label: 'SunSky',          group: 'Integrations' },
];

export const MODULES_BY_GROUP: Record<AdminModule['group'], AdminModule[]> =
  ADMIN_MODULES.reduce((acc, m) => {
    (acc[m.group] = acc[m.group] || []).push(m);
    return acc;
  }, {} as Record<AdminModule['group'], AdminModule[]>);

/**
 * Map a pathname (+ optional ?tab=) to the module key that controls it.
 * Returns null for routes that should always be visible to staff
 * (e.g. /admin overview, customer detail page = part of customers module).
 */
export function moduleForRoute(pathname: string, tab: string | null): AdminModuleKey | null {
  if (pathname === '/admin' || pathname === '/admin/') return null;

  if (pathname.startsWith('/admin/customers')) return 'customers';
  if (pathname.startsWith('/admin/reports'))   return 'reports';
  if (pathname.startsWith('/admin/analytics')) return 'analytics';
  if (pathname.startsWith('/admin/emails'))    return 'emails';
  if (pathname.startsWith('/admin/tickets'))   return 'tickets';

  if (pathname.startsWith('/admin/orders/'))   return 'orders';

  if (pathname.startsWith('/admin/ops-hub')) {
    switch (tab) {
      case 'labelling': return 'labelling';
      case 'delivery':  return 'delivery';
      case 'warehouse': return 'warehouse';
      case 'returns':   return 'returns';
      default:          return 'orders';
    }
  }
  if (pathname.startsWith('/admin/catalog-hub')) {
    switch (tab) {
      case 'suppliers': return 'suppliers';
      case 'platforms': return 'platforms';
      case 'designer':  return 'label-designer';
      default:          return 'catalog';
    }
  }
  if (pathname.startsWith('/admin/sourcing-hub')) {
    return tab === 'quotes' ? 'quotes' : 'sourcing';
  }
  if (pathname.startsWith('/admin/sunsky')) return 'sunsky';
  if (pathname.startsWith('/admin/internal-hub')) {
    switch (tab) {
      case 'promo':    return 'promo';
      case 'homepage': return 'homepage';
      case 'contact':  return 'contact';
      case 'audit':    return 'audit';
      case 'settings': return 'settings';
      default:         return 'pricing';
    }
  }
  return null;
}
