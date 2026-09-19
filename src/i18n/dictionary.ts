/**
 * Central UI string dictionary for Tejaraa.
 *
 * Keys are namespaced by section: `common.*`, `shop.*`, `selling.*`,
 * `agency.*`, `supplier.*`. English is the source of truth; every key MUST
 * have an Arabic counterpart. Missing Arabic falls back to English at runtime.
 */
export type Locale = 'en' | 'ar';

export const en = {
  // ---------- common ----------
  'common.language': 'Language',
  'common.english': 'English',
  'common.arabic': 'العربية',
  'common.signIn': 'Sign in',
  'common.signOut': 'Sign out',
  'common.logout': 'Logout',
  'common.createAccount': 'Create account',
  'common.myAccount': 'My Account',
  'common.orders': 'Orders',
  'common.wishlist': 'Wishlist',
  'common.cart': 'Cart',
  'common.search': 'Search',
  'common.searchEllipsis': 'Search...',
  'common.home': 'Home',
  'common.categories': 'Categories',
  'common.viewAll': 'View all',
  'common.helpCenter': 'Help Center',
  'common.support': 'Support',
  'common.wallet': 'Wallet',
  'common.openNavigation': 'Open navigation',
  'common.currency': 'SAR',

  // ---------- platform switcher ----------
  'platform.shop': 'Shop',
  'platform.selling': 'Dropshipping & Selling Services',
  'platform.agencies': 'Agencies & VAs',
  'platform.suppliers': 'Wholesalers and Suppliers',

  // ---------- shop header ----------
  'shop.brand': 'Tejaraa Shop',
  'shop.homeAria': 'Tejaraa Shop home',
  'shop.searchPlaceholder': 'Search products, brands and categories…',
  'shop.searchAria': 'Search products, brands and categories',
  'shop.departments': 'Departments',
  'shop.departmentsAria': 'Shop departments',
  'shop.readyToShip': 'Ready to Ship',
  'shop.allCategories': 'All categories',
  'shop.browseDepartments': 'Browse Tejaraa departments',
  'shop.viewAllCategories': 'View all categories →',
  'shop.backToAllCategories': 'All Categories',
  'shop.viewAllIn': 'View all {name}',
  'shop.helloSignIn': 'Hello, sign in',
  'shop.hello': 'Hello, {name}',
  'shop.tagline': 'Shop products across Saudi Arabia',
  'shop.adminPortal': 'Admin Portal',
  'shop.wholesalePortal': 'Wholesale Portal',
  'shop.mobileNavAria': 'Mobile shop navigation',
  'shop.account': 'Account',

  // ---------- shop footer ----------
  'shop.footer.language': 'Language',
} as const;

export type TranslationKey = keyof typeof en;

export const ar: Partial<Record<TranslationKey, string>> = {
  // ---------- common ----------
  'common.language': 'اللغة',
  'common.english': 'English',
  'common.arabic': 'العربية',
  'common.signIn': 'تسجيل الدخول',
  'common.signOut': 'تسجيل الخروج',
  'common.logout': 'تسجيل الخروج',
  'common.createAccount': 'إنشاء حساب',
  'common.myAccount': 'حسابي',
  'common.orders': 'الطلبات',
  'common.wishlist': 'المفضلة',
  'common.cart': 'السلة',
  'common.search': 'بحث',
  'common.searchEllipsis': 'ابحث...',
  'common.home': 'الرئيسية',
  'common.categories': 'الأقسام',
  'common.viewAll': 'عرض الكل',
  'common.helpCenter': 'مركز المساعدة',
  'common.support': 'الدعم',
  'common.wallet': 'المحفظة',
  'common.openNavigation': 'فتح القائمة',
  'common.currency': 'ر.س',

  // ---------- platform switcher ----------
  'platform.shop': 'المتجر',
  'platform.selling': 'خدمات الدروب شيبنق والبيع',
  'platform.agencies': 'الوكالات والمساعدون الافتراضيون',
  'platform.suppliers': 'تجار الجملة والموردون',

  // ---------- shop header ----------
  'shop.brand': 'متجر تجارة',
  'shop.homeAria': 'الصفحة الرئيسية لمتجر تجارة',
  'shop.searchPlaceholder': 'ابحث عن المنتجات والعلامات التجارية والأقسام…',
  'shop.searchAria': 'ابحث عن المنتجات والعلامات التجارية والأقسام',
  'shop.departments': 'الأقسام',
  'shop.departmentsAria': 'أقسام المتجر',
  'shop.readyToShip': 'جاهز للشحن',
  'shop.allCategories': 'كل الأقسام',
  'shop.browseDepartments': 'تصفح أقسام تجارة',
  'shop.viewAllCategories': '← عرض كل الأقسام',
  'shop.backToAllCategories': 'كل الأقسام',
  'shop.viewAllIn': 'عرض كل {name}',
  'shop.helloSignIn': 'مرحباً، سجّل الدخول',
  'shop.hello': 'مرحباً، {name}',
  'shop.tagline': 'تسوق المنتجات في جميع أنحاء السعودية',
  'shop.adminPortal': 'لوحة الإدارة',
  'shop.wholesalePortal': 'بوابة الجملة',
  'shop.mobileNavAria': 'قائمة التنقل للمتجر',
  'shop.account': 'الحساب',

  // ---------- shop footer ----------
  'shop.footer.language': 'اللغة',
};

export const dictionaries: Record<Locale, Partial<Record<TranslationKey, string>>> = {
  en,
  ar,
};
