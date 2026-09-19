import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "@/lib/router-compat";
import {
  Home,
  ShoppingBag,
  Package,
  User,
  LayoutDashboard,
  MoreHorizontal,
  Box,
  Users,
  Tag,
  Truck,
  CreditCard,
  TicketIcon,
  Globe,
  Palette,
  LayoutGrid,
  MessageSquare,
  Settings,
  ShoppingCart,
  Warehouse,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

/**
 * Native-app style bottom tab bar.
 * Renders only on mobile (`md:hidden`).
 */
export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const inAdmin = location.pathname.startsWith("/admin");
  const inDashboard = location.pathname.startsWith("/dropshipping");
  // Public retail Shop routes render their own retail tab bar (RetailHeader),
  // and checkout is intentionally distraction-free.
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const isRetailShopRoute =
    path === "/" ||
    path === "/cart" ||
    path === "/catalog" ||
    path === "/search" ||
    path === "/category" ||
    path.startsWith("/category/") ||
    path.startsWith("/product/") ||
    path.startsWith("/checkout");

  // Public Seller Services has its own header nav and CTA; no shop tab bar there.
  const isSellerPublicRoute = path === "/selling" || path.startsWith("/selling/");

  // Wholesalers/Suppliers portal renders its own supplier tab bar (SupplierShell),
  // the shopper account area renders the retail tab bar from RetailHeader, and the
  // Arabic storefront mirrors the retail shop routes.
  const isPartnersRoute = path === "/partners" || path.startsWith("/partners/");
  const isShopAccountRoute = path === "/account" || path.startsWith("/account/");
  const isArabicShopRoute = path === "/ar" || path.startsWith("/ar/");

  if (
    isRetailShopRoute ||
    isSellerPublicRoute ||
    isPartnersRoute ||
    isShopAccountRoute ||
    isArabicShopRoute
  )
    return null;


  // Admin: render dedicated tab bar with "More" drawer
  if (inAdmin) {
    const adminTabs = [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/admin/orders", label: "Orders", icon: ShoppingCart, end: false },
      { to: "/admin/products", label: "Products", icon: Box, end: false },
    ];
    const moreItems = [
      { to: "/admin/customers", label: "Customers", icon: Users },
      { to: "/admin/labelling", label: "Labelling Queue", icon: Tag },
      { to: "/admin/delivery", label: "Delivery", icon: Truck },
      { to: "/admin/warehouse", label: "Warehouse", icon: Warehouse },

      { to: "/admin/tickets", label: "Support Tickets", icon: TicketIcon },
      { to: "/admin/platforms", label: "Platforms", icon: Globe },
      { to: "/admin/label-designer", label: "Label Designer", icon: Palette },
      { to: "/admin/homepage", label: "Homepage Layout", icon: LayoutGrid },
      { to: "/admin/contact", label: "Contact Details", icon: MessageSquare },
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ];
    const moreActive = moreItems.some((m) => location.pathname.startsWith(m.to));

    return (
      <>
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_-4px_hsl(var(--foreground)/0.08)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Admin mobile navigation"
        >
          <ul className="grid grid-cols-4">
            {adminTabs.map((t) => (
              <li key={t.label}>
                <NavLink
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-all active:scale-90 ${
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex items-center justify-center h-9 w-12 rounded-2xl transition-all ${
                          isActive ? "bg-primary/15 shadow-sm" : ""
                        }`}
                      >
                        <t.icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                      </span>
                      <span className="leading-none">{t.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className={`w-full flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-all active:scale-90 ${
                  moreActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="More admin sections"
              >
                <span
                  className={`flex items-center justify-center h-9 w-12 rounded-2xl transition-all ${
                    moreActive ? "bg-primary/15 shadow-sm" : ""
                  }`}
                >
                  <MoreHorizontal
                    className="h-[22px] w-[22px]"
                    strokeWidth={moreActive ? 2.5 : 2}
                  />
                </span>
                <span className="leading-none">More</span>
              </button>
            </li>
          </ul>
        </nav>

        <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
          <DrawerContent className="md:hidden">
            <DrawerHeader>
              <DrawerTitle>Admin Sections</DrawerTitle>
              <DrawerDescription>Quick access to all admin tools</DrawerDescription>
            </DrawerHeader>
            <div
              className="px-2 pb-4 grid grid-cols-2 gap-2"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
            >
              {moreItems.map((m) => {
                const isActive =
                  location.pathname === m.to || location.pathname.startsWith(m.to + "/");
                return (
                  <button
                    key={m.to}
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      navigate(m.to);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all active:scale-[0.98] min-h-[64px] ${
                      isActive
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-card hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center h-9 w-9 rounded-lg shrink-0 ${
                        isActive ? "bg-primary/15" : "bg-muted"
                      }`}
                    >
                      <m.icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium leading-tight">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Hide bottom nav on public pages for logged-out visitors — only show for authenticated users
  if (!user) return null;

  const tabs = inDashboard
    ? [
        { to: "/dropshipping", label: "Home", icon: LayoutDashboard, end: true },
        { to: "/dropshipping/catalog", label: "Products", icon: ShoppingBag, end: false },
        { to: "/dropshipping/orders", label: "Orders", icon: Package, end: false },
        { to: "/dropshipping/profile", label: "Account", icon: User, end: false },
      ]
    : [
        { to: "/", label: "Home", icon: Home, end: true },
        { to: "/services", label: "Services", icon: ShoppingBag, end: false },
        { to: "/dropshipping/catalog", label: "Sourcing", icon: Package, end: false },
        {
          to: user.role === "admin" ? "/admin" : "/dropshipping",
          label: "Account",
          icon: User,
          end: false,
        },
      ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-[hsl(152_40%_88%/0.7)] shadow-[0_-4px_20px_-4px_hsl(152_69%_31%/0.12)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary mobile navigation"
    >
      <ul className="grid grid-cols-4">
        {tabs.map((t) => (
          <li key={t.label}>
            <NavLink
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-all active:scale-90 touch-manipulation ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex items-center justify-center h-9 w-12 rounded-2xl transition-all ${
                      isActive
                        ? "bg-primary/15 shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.35)]"
                        : ""
                    }`}
                  >
                    <t.icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                  </span>
                  <span className="leading-none">{t.label}</span>
                  {isActive && (
                    <span className="absolute top-1 right-[28%] w-1.5 h-1.5 rounded-full bg-[hsl(45_90%_55%)] shadow-[0_0_8px_hsl(45_90%_55%/0.7)]" />
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
