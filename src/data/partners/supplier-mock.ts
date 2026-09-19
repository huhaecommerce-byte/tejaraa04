/**
 * Supplier portal data shapes. No demo records — the arrays below stay empty
 * until the backend is connected and real supplier data is loaded.
 */

export type ProductStatus = "Active" | "Pending Approval" | "Rejected" | "Draft" | "Out of Stock";
export type OrderStatus =
  | "New" | "Confirmed" | "Processing" | "Ready to Ship" | "Shipped"
  | "Delivered" | "Cancelled" | "Return Requested" | "Returned";

export type Product = {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  price: number;
  moq: number;
  stock: number;
  warehouse: string;
  status: ProductStatus;
  updated: string;
};

export const products: Product[] = [];

export const productTabs = ["All Products", "Active", "Pending Approval", "Rejected", "Draft", "Out of Stock"] as const;

export type PricingRow = {
  id: string;
  name: string;
  sku: string;
  cost: number;
  wholesale: number;
  dropship: number;
  tiers: { qty: string; price: number }[];
  currency: string;
};

export const pricingRows: PricingRow[] = [];

export type InventoryRow = {
  id: string;
  name: string;
  sku: string;
  warehouse: string;
  available: number;
  reserved: number;
  lowStockAt: number;
  incoming: number;
  updated: string;
};

export const inventoryRows: InventoryRow[] = [];

export type Order = {
  id: string;
  channel: string;
  product: string;
  items: number;
  quantity: number;
  value: string;
  shipping: string;
  country: string;
  status: OrderStatus;
  date: string;
};

export const orders: Order[] = [];

export const orderStatuses: OrderStatus[] = [
  "New", "Confirmed", "Processing", "Ready to Ship", "Shipped", "Delivered", "Cancelled", "Return Requested", "Returned",
];

export const salesChannels = ["Our Storefront", "B2B Buyers", "Dropshipping Network", "API Integrations"] as const;

export const supplierUser = { name: "", company: "", country: "" };
