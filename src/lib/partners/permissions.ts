export type AppRole = "admin" | "supplier" | "staff" | "finance" | "viewer";

export const CONSOLE_ROLES: AppRole[] = ["admin", "staff", "finance", "viewer"];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  staff: "Staff / Moderator",
  finance: "Finance",
  viewer: "Viewer",
  supplier: "Wholesaler",
};

/** Admin console areas. */
export type AdminArea = "overview" | "wholesalers" | "products" | "money" | "platform" | "team";

const AREA_BY_ROLE: Record<AppRole, AdminArea[]> = {
  admin: ["overview", "wholesalers", "products", "money", "platform", "team"],
  staff: ["overview", "wholesalers", "products"],
  finance: ["overview", "money"],
  viewer: ["overview", "wholesalers", "products", "money"],
  supplier: [],
};

export const ROUTE_AREA: { prefix: string; area: AdminArea }[] = [
  { prefix: "/partners/admin/applications", area: "wholesalers" },
  { prefix: "/partners/admin/suppliers", area: "wholesalers" },
  { prefix: "/partners/admin/products", area: "products" },
  { prefix: "/partners/admin/live-products", area: "products" },
  { prefix: "/partners/admin/orders", area: "money" },
  { prefix: "/partners/admin/payouts", area: "money" },
  { prefix: "/partners/admin/markets", area: "platform" },
  { prefix: "/partners/admin/connections", area: "platform" },
  { prefix: "/partners/admin/supplier-integrations", area: "platform" },
  { prefix: "/partners/admin/team", area: "team" },
];

export function areaForPath(path: string): AdminArea {
  const match = ROUTE_AREA.find((entry) => path === entry.prefix || path.startsWith(`${entry.prefix}/`));
  return match ? match.area : "overview";
}

export function allowedAreas(roles: AppRole[]): AdminArea[] {
  const set = new Set<AdminArea>();
  roles.forEach((role) => AREA_BY_ROLE[role]?.forEach((area) => set.add(area)));
  return [...set];
}

export function canOpen(roles: AppRole[], area: AdminArea) {
  return allowedAreas(roles).includes(area);
}

export function canOpenPath(roles: AppRole[], path: string) {
  return canOpen(roles, areaForPath(path));
}

export function hasConsoleAccess(roles: AppRole[]) {
  return roles.some((role) => CONSOLE_ROLES.includes(role));
}

/** Viewers may look but never change anything. */
export function canAct(roles: AppRole[]) {
  return roles.some((role) => role === "admin" || role === "staff" || role === "finance");
}
