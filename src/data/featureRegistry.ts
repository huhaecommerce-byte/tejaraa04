export type FeatureValueType = 'toggle' | 'qty' | 'select';

export interface FeatureDefinition {
  key: string;
  label: string;
  valueType: FeatureValueType;
  options?: string[];
  unit?: string;
  section?: string; // for grouped display
}

export const FEATURE_SECTIONS = [
  'Catalog & discovery',
  'Ordering & fulfilment',
  'Warehousing & releases',
  'Labelling',
  'Sourcing & quotes',
  'Selling-channel integrations',
  'Team & accounts',
  'Money & billing',
  'Analytics & insight',
  'Support & success',
] as const;

export const FEATURE_REGISTRY: FeatureDefinition[] = [
  // A. Catalog & discovery
  { key: 'product_browsing', label: 'Browse full catalog', valueType: 'qty', unit: 'products', section: 'Catalog & discovery' },
  { key: 'favourites_max', label: 'Save favourites', valueType: 'qty', unit: 'items', section: 'Catalog & discovery' },
  { key: 'browsed_history_days', label: 'Recently-viewed history', valueType: 'qty', unit: 'days', section: 'Catalog & discovery' },
  { key: 'price_alerts_max', label: 'Product price alerts', valueType: 'qty', unit: 'alerts', section: 'Catalog & discovery' },
  { key: 'catalog_export', label: 'Catalog CSV/Excel export', valueType: 'select', options: ['no', 'limited', 'unlimited'], section: 'Catalog & discovery' },
  { key: 'catalog_export_qty_monthly', label: 'Catalog export rows / month (when limited)', valueType: 'qty', unit: 'rows/mo', section: 'Catalog & discovery' },
  { key: 'image_bulk_download', label: 'Product image downloads', valueType: 'qty', unit: 'products/mo', section: 'Catalog & discovery' },
  { key: 'early_access_hours', label: 'Early access to new arrivals', valueType: 'qty', unit: 'hours', section: 'Catalog & discovery' },
  { key: 'restock_alerts_max', label: 'Restock notifications', valueType: 'qty', unit: 'SKUs', section: 'Catalog & discovery' },

  // B. Ordering & fulfilment
  { key: 'total_units_monthly', label: 'Total units allowed to order', valueType: 'qty', unit: 'units/mo', section: 'Ordering & fulfilment' },
  { key: 'bulk_orders_monthly', label: 'Bulk orders / month', valueType: 'qty', unit: 'orders/mo', section: 'Ordering & fulfilment' },
  { key: 'dropshipping_orders', label: 'Dropship orders / month', valueType: 'qty', unit: 'orders/mo', section: 'Ordering & fulfilment' },
  { key: 'bulk_import', label: 'Bulk order CSV import', valueType: 'select', options: ['no', 'yes', 'scheduled'], section: 'Ordering & fulfilment' },
  { key: 'templates_max', label: 'Order templates (saved carts)', valueType: 'qty', unit: 'templates', section: 'Ordering & fulfilment' },
  { key: 'recurring_orders', label: 'Recurring auto-orders', valueType: 'select', options: ['no', 'standard', 'custom'], section: 'Ordering & fulfilment' },
  { key: 'order_edit_window_hours', label: 'Order edit window after placing', valueType: 'qty', unit: 'hours', section: 'Ordering & fulfilment' },
  { key: 'bulk_discount', label: 'Bulk order discount', valueType: 'qty', unit: '%', section: 'Ordering & fulfilment' },
  { key: 'min_order_sar', label: 'Minimum order value', valueType: 'qty', unit: 'SAR', section: 'Ordering & fulfilment' },
  { key: 'express_delivery', label: 'Express delivery option', valueType: 'select', options: ['no', 'yes', 'free_2'], section: 'Ordering & fulfilment' },
  { key: 'cash_on_delivery', label: 'Cash on delivery', valueType: 'toggle', section: 'Ordering & fulfilment' },
  { key: 'split_shipment', label: 'Split shipment to multiple addresses', valueType: 'toggle', section: 'Ordering & fulfilment' },

  // C. Warehousing & releases
  { key: 'storage_units_free', label: 'Stored units (free)', valueType: 'qty', unit: 'units', section: 'Warehousing & releases' },
  { key: 'storage_free_days', label: 'Free storage days', valueType: 'qty', unit: 'days', section: 'Warehousing & releases' },
  { key: 'storage_rate_sar', label: 'Storage rate after free', valueType: 'qty', unit: 'SAR/unit/mo', section: 'Warehousing & releases' },
  { key: 'release_requests_monthly', label: 'Release requests / month', valueType: 'qty', unit: 'releases/mo', section: 'Warehousing & releases' },
  { key: 'release_sla_hours', label: 'Release SLA', valueType: 'qty', unit: 'hours', section: 'Warehousing & releases' },
  { key: 'kitting_bundling', label: 'Bundling / kitting', valueType: 'select', options: ['no', 'basic', 'advanced'], section: 'Warehousing & releases' },
  { key: 'low_stock_alerts', label: 'Inventory low-stock alerts', valueType: 'select', options: ['no', 'yes', 'auto_reorder'], section: 'Warehousing & releases' },

  // D. Labelling
  { key: 'labelling_units_monthly', label: 'Labelling units / month', valueType: 'qty', unit: 'units/mo', section: 'Labelling' },
  { key: 'labelling_priority', label: 'Labelling queue priority', valueType: 'select', options: ['standard', 'priority', 'top'], section: 'Labelling' },
  { key: 'label_designer', label: 'Custom Label Designer', valueType: 'select', options: ['view', 'yes', 'brand_kit'], section: 'Labelling' },
  { key: 'polybagging', label: 'Polybagging', valueType: 'toggle', section: 'Labelling' },
  { key: 'fragile_packaging', label: 'Bubble wrap / fragile', valueType: 'toggle', section: 'Labelling' },
  { key: 'expiry_batch_labels', label: 'Expiry / batch labels', valueType: 'toggle', section: 'Labelling' },
  { key: 'free_relabel', label: 'Free re-labelling on errors', valueType: 'toggle', section: 'Labelling' },

  // E. Sourcing & quotes
  { key: 'sourcing_requests_monthly', label: 'Sourcing requests / month', valueType: 'qty', unit: 'requests/mo', section: 'Sourcing & quotes' },
  { key: 'quote_requests_monthly', label: 'Quote requests / month', valueType: 'qty', unit: 'requests/mo', section: 'Sourcing & quotes' },
  { key: 'sourcing_sla_hours', label: 'Sourcing SLA', valueType: 'qty', unit: 'hours', section: 'Sourcing & quotes' },
  { key: 'sample_sourcing', label: 'Sample sourcing', valueType: 'qty', unit: 'samples/mo', section: 'Sourcing & quotes' },
  { key: 'supplier_negotiation', label: 'Supplier negotiation', valueType: 'toggle', section: 'Sourcing & quotes' },
  { key: 'private_label_sourcing', label: 'Private-label sourcing', valueType: 'toggle', section: 'Sourcing & quotes' },

  // F. Selling-channel integrations
  { key: 'store_integrations_max', label: 'Connected stores (Salla / Zid / Shopify)', valueType: 'qty', unit: 'stores', section: 'Selling-channel integrations' },
  { key: 'channel_inventory_sync', label: 'Auto-sync inventory to channels', valueType: 'select', options: ['no', 'hourly', 'realtime'], section: 'Selling-channel integrations' },
  { key: 'channel_auto_fulfil', label: 'Auto-fulfil channel orders', valueType: 'toggle', section: 'Selling-channel integrations' },
  { key: 'marketplace_api', label: 'Amazon SP-API / Noon API', valueType: 'toggle', section: 'Selling-channel integrations' },

  // G. Team & accounts
  { key: 'team_seats', label: 'Team sub-users', valueType: 'qty', unit: 'seats', section: 'Team & accounts' },
  { key: 'team_roles', label: 'Roles (viewer/buyer/manager)', valueType: 'select', options: ['no', 'yes', 'custom'], section: 'Team & accounts' },
  { key: 'addresses_max', label: 'Multiple shipping addresses', valueType: 'qty', unit: 'addresses', section: 'Team & accounts' },
  { key: 'audit_log_days', label: 'Activity / audit log', valueType: 'qty', unit: 'days', section: 'Team & accounts' },

  // H. Money & billing
  { key: 'wallet_credit', label: 'Wallet & credit terms', valueType: 'select', options: ['prepaid', 'net_7', 'net_30'], section: 'Money & billing' },
  { key: 'credit_limit_sar', label: 'Credit limit', valueType: 'qty', unit: 'SAR', section: 'Money & billing' },
  { key: 'wallet_topup_bonus', label: 'Wallet top-up bonus', valueType: 'qty', unit: '%', section: 'Money & billing' },
  { key: 'invoices_tier', label: 'Invoices (VAT-compliant)', valueType: 'select', options: ['basic', 'bulk_export', 'auto_email'], section: 'Money & billing' },
  { key: 'multi_currency', label: 'Multi-currency view (USD/AED)', valueType: 'toggle', section: 'Money & billing' },
  { key: 'promo_stacking', label: 'Promo code stacking', valueType: 'qty', unit: 'codes', section: 'Money & billing' },

  // I. Analytics & insight
  { key: 'buyer_dashboard', label: 'Buyer dashboard', valueType: 'select', options: ['basic', 'full', 'cohorts'], section: 'Analytics & insight' },
  { key: 'profit_calculator', label: 'Profit calculator', valueType: 'select', options: ['basic', 'margin', 'per_sku'], section: 'Analytics & insight' },
  { key: 'reports_export', label: 'CSV/PDF export of reports', valueType: 'select', options: ['no', 'yes', 'scheduled'], section: 'Analytics & insight' },
  { key: 'sales_forecast', label: 'Sales velocity / restock forecast', valueType: 'toggle', section: 'Analytics & insight' },

  // J. Support & success
  { key: 'email_support_sla_hours', label: 'Email support SLA', valueType: 'qty', unit: 'hours', section: 'Support & success' },
  { key: 'whatsapp_support', label: 'WhatsApp support', valueType: 'select', options: ['no', 'business_hours', '24_7'], section: 'Support & success' },
  { key: 'account_manager', label: 'Dedicated account manager', valueType: 'select', options: ['no', 'shared', 'dedicated'], section: 'Support & success' },
  { key: 'onboarding', label: 'Onboarding session', valueType: 'select', options: ['self_serve', '30_min_call', 'white_glove'], section: 'Support & success' },
  { key: 'returns_fee_sar', label: 'Returns processing fee', valueType: 'qty', unit: 'SAR/return', section: 'Support & success' },

  // Legacy (kept for back-compat with old plan_limits rows)
  { key: 'product_export', label: 'Product Export (Excel/Images)', valueType: 'toggle' },
  { key: 'dropshipping_service', label: 'Dropshipping Service', valueType: 'toggle' },
  { key: 'labelling_service', label: 'Labelling Service', valueType: 'select', options: ['none', 'basic', 'priority'] },
  { key: 'delivery_service', label: 'Delivery Service', valueType: 'select', options: ['standard', 'express'] },
  { key: 'email_support', label: 'Email Support', valueType: 'toggle' },
  { key: 'custom_sourcing', label: 'Custom Sourcing Requests', valueType: 'toggle' },
  { key: 'white_label', label: 'White-Label Packaging', valueType: 'toggle' },
  { key: 'api_access', label: 'API Access', valueType: 'toggle' },
  { key: 'custom_payment', label: 'Custom Payment Terms', valueType: 'toggle' },
  { key: 'priority_support', label: 'Priority Support 24/7', valueType: 'toggle' },
];

export function getFeatureDef(key: string): FeatureDefinition | undefined {
  return FEATURE_REGISTRY.find(f => f.key === key);
}

/**
 * Per-qty-key semantics:
 *  - 'quota' (default) → 0 = Not included, ∞ = Unlimited
 *  - 'time'            → 0 = Not included, ∞ = Anytime / Forever
 *  - 'floor'           → 0 = No minimum
 *  - 'rate'            → 0 = Free / 0% (meaningful)
 */
export type QtySemantics = 'quota' | 'time' | 'floor' | 'rate';

export const QTY_SEMANTICS: Record<string, QtySemantics> = {
  browsed_history_days: 'time',
  early_access_hours: 'time',
  order_edit_window_hours: 'time',
  storage_free_days: 'time',
  release_sla_hours: 'time',
  sourcing_sla_hours: 'time',
  audit_log_days: 'time',
  email_support_sla_hours: 'time',
  min_order_sar: 'floor',
  bulk_discount: 'rate',
  storage_rate_sar: 'rate',
  wallet_topup_bonus: 'rate',
  returns_fee_sar: 'rate',
};

export function qtySemantics(key: string): QtySemantics {
  return QTY_SEMANTICS[key] ?? 'quota';
}

export function defaultValueFor(def: FeatureDefinition): string {
  switch (def.valueType) {
    case 'toggle': return 'no';
    case 'select': return def.options?.[0] ?? '';
    case 'qty':
    default: return '0';
  }
}

/** Sensible value to write when the admin flips a row ON. */
export function enabledDefaultFor(def: FeatureDefinition): string {
  switch (def.valueType) {
    case 'toggle': return 'yes';
    case 'select': {
      const opts = def.options ?? [];
      return opts[1] ?? opts[0] ?? '';
    }
    case 'qty':
    default: return '1';
  }
}

/** Value to write when the admin flips a row OFF. */
export function offValueFor(def: FeatureDefinition): string {
  switch (def.valueType) {
    case 'toggle': return 'no';
    case 'select': return def.options?.[0] ?? '';
    case 'qty':
    default: return '0';
  }
}

/** True when the stored value represents "the feature is turned on". */
export function isFeatureEnabled(def: FeatureDefinition | undefined, value: string): boolean {
  if (!def) return !!value && value !== '0' && value !== 'no' && value !== 'none';
  switch (def.valueType) {
    case 'toggle':
      return value === 'yes';
    case 'qty': {
      const sem = qtySemantics(def.key);
      // floor (no minimum) and rate (0 = free / 0%) treat 0 as still "on"
      if (sem === 'floor' || sem === 'rate') return value !== '' && value !== 'off';
      return value === 'unlimited' || (value !== '' && value !== '0');
    }
    case 'select': {
      const off = def.options?.[0];
      return !!value && value !== off;
    }
    default:
      return !!value;
  }
}

/** Friendly explanation of what "Off" means for a given feature, for tooltips. */
export function offMeaningFor(def: FeatureDefinition): string {
  if (def.valueType === 'qty') {
    const sem = qtySemantics(def.key);
    if (sem === 'floor') return 'Off = No minimum required';
    if (sem === 'rate') return 'Off = 0 / disabled';
    if (sem === 'time') return 'Off = Not included';
  }
  return 'Off = Not included';
}

function prettyOption(v: string): string {
  return v.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function formatFeatureLabel(key: string, value: string): string {
  const def = getFeatureDef(key);
  if (!def) return `${key}: ${value}`;

  switch (def.valueType) {
    case 'toggle':
      return value === 'yes' ? `${def.label}` : `${def.label} (Not included)`;
    case 'qty': {
      const sem = qtySemantics(key);
      const unit = def.unit ? ` ${def.unit}` : '';
      if (value === 'unlimited') {
        if (sem === 'time') {
          return /day/i.test(def.unit || '') ? `${def.label}: Forever` : `${def.label}: Anytime`;
        }
        return `${def.label}: Unlimited`;
      }
      if (value === '' || value === '0') {
        if (sem === 'floor') return `${def.label}: No minimum`;
        if (sem === 'rate') return `${def.label}: 0${unit}`;
        return `${def.label}: Not included`;
      }
      return `${def.label}: ${value}${unit}`;
    }
    case 'select':
      if (value === 'no' || value === 'none') return `${def.label}: Not included`;
      return `${def.label}: ${prettyOption(value)}`;
    default:
      return `${def.label}: ${value}`;
  }
}
