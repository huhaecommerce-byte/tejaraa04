import { useEffect } from 'react';
import { useLocation } from '@/lib/router-compat';
import { useLocale } from './LocaleProvider';

const phrases: Record<string, string> = {
  'Workspace': 'مساحة العمل',
  'Agency Portal': 'بوابة الوكالات',
  'Dashboard': 'لوحة التحكم',
  'Product Sourcing': 'توريد المنتجات',
  'Product Catalog': 'كتالوج المنتجات',
  'Product Hunting': 'البحث عن المنتجات',
  'Export Catalog': 'تصدير الكتالوج',
  'Orders Hub': 'مركز الطلبات',
  'Sourcing Request': 'طلب توريد',
  'Labelling & Fulfillment': 'التوسيم والتنفيذ',
  'Store Integrations': 'ربط المتاجر',
  'My Warehouse': 'مستودعي',
  'Wallet & Billing': 'المحفظة والفوترة',
  'Support & Tickets': 'الدعم والتذاكر',
  'Profile & Plan': 'الملف الشخصي والباقة',
  'My Invite Link': 'رابط دعوتي',
  'My Dropshippers': 'المسوقون التابعون لي',
  'Earnings': 'الأرباح',
  'Payouts': 'الدفعات',
  'Profile': 'الملف الشخصي',
  'Homepage': 'الصفحة الرئيسية',
  'Agency programme': 'برنامج الوكالات',
  'Expand sidebar': 'توسيع القائمة الجانبية',
  'Collapse sidebar': 'طي القائمة الجانبية',
  'Close menu': 'إغلاق القائمة',
  'Open menu': 'فتح القائمة',
  'Search...': 'ابحث...',
  'Search': 'بحث',
  'Navigation': 'التنقل',
  'Seller portal': 'بوابة البائع',
  'Partner portal': 'بوابة الشركاء',
  'Supplier portal': 'بوابة المورد',
  'Hello': 'مرحباً',
  'Logout': 'تسجيل الخروج',
  'Sign out': 'تسجيل الخروج',
  'Shop': 'المتجر',
  'Selling': 'البيع',
  'Agencies': 'الوكالات',
  'Suppliers': 'الموردون',
  'Tejaraa platforms': 'منصات تجارة',
  'Catalog': 'الكتالوج',
  'Sales': 'المبيعات',
  'Business': 'الأعمال',
  'Products': 'المنتجات',
  'Add Products': 'إضافة منتجات',
  'Add Product': 'إضافة منتج',
  'Import From A Link': 'استيراد من رابط',
  'Drafts': 'المسودات',
  'Orders': 'الطلبات',
  'Analytics': 'التحليلات',
  'Finance': 'المالية',
  'Verification': 'التحقق',
  'Company Profile': 'ملف الشركة',
  'Settings': 'الإعدادات',
  'Home': 'الرئيسية',
  'Visit Tejaraa store': 'زيارة متجر تجارة',
  'Notifications': 'الإشعارات',
  'No new notifications': 'لا توجد إشعارات جديدة',
  'View profile': 'عرض الملف الشخصي',
  'Account Status': 'حالة الحساب',
  'Verified supplier': 'مورد موثّق',
  'Pending verification': 'بانتظار التحقق',
  'Application rejected': 'تم رفض الطلب',
  'Complete application': 'أكمل الطلب',
  'Verified': 'موثّق',
  'Pending': 'قيد الانتظار',
  'Pending review': 'قيد المراجعة',
  'Approved': 'معتمد',
  'Rejected': 'مرفوض',
  'Submitted': 'تم الإرسال',
  'Not submitted': 'لم يتم الإرسال',
  'Active': 'نشط',
  'Inactive': 'غير نشط',
  'Enabled': 'مفعّل',
  'Disabled': 'معطّل',
  'New': 'جديد',
  'Processing': 'قيد المعالجة',
  'Confirmed': 'مؤكد',
  'Delivered': 'تم التسليم',
  'Cancelled': 'ملغي',
  'Returned': 'مرتجع',
  'Refunded': 'مسترد',
  'Failed': 'فشل',
  'Succeeded': 'ناجح',
  'Available': 'متاح',
  'Paid': 'مدفوع',
  'Reversed': 'معكوس',
  'Loading…': 'جارٍ التحميل…',
  'Loading...': 'جارٍ التحميل...',
  'Saving…': 'جارٍ الحفظ…',
  'Save': 'حفظ',
  'Save changes': 'حفظ التغييرات',
  'Save Settings': 'حفظ الإعدادات',
  'Save Profile': 'حفظ الملف الشخصي',
  'Cancel': 'إلغاء',
  'Close': 'إغلاق',
  'Back': 'رجوع',
  'Next': 'التالي',
  'Previous': 'السابق',
  'Continue': 'متابعة',
  'Submit': 'إرسال',
  'Delete': 'حذف',
  'Edit': 'تعديل',
  'Remove': 'إزالة',
  'Replace': 'استبدال',
  'Download': 'تنزيل',
  'Export': 'تصدير',
  'Print': 'طباعة',
  'Copy': 'نسخ',
  'View': 'عرض',
  'View all': 'عرض الكل',
  'Details': 'التفاصيل',
  'Status': 'الحالة',
  'Date': 'التاريخ',
  'Amount': 'المبلغ',
  'Total': 'الإجمالي',
  'Subtotal': 'المجموع الفرعي',
  'Quantity': 'الكمية',
  'Price': 'السعر',
  'Unit price': 'سعر الوحدة',
  'Product': 'المنتج',
  'Order': 'الطلب',
  'Order ID': 'رقم الطلب',
  'Order Type': 'نوع الطلب',
  'Order Notes': 'ملاحظات الطلب',
  'Items': 'العناصر',
  'Channel': 'القناة',
  'Currency': 'العملة',
  'Country': 'الدولة',
  'City': 'المدينة',
  'Mobile': 'الجوال',
  'Email': 'البريد الإلكتروني',
  'Full name': 'الاسم الكامل',
  'First name': 'الاسم الأول',
  'Last name': 'اسم العائلة',
  'Business name': 'اسم المنشأة',
  'Business type': 'نوع المنشأة',
  'Contact person': 'جهة الاتصال',
  'Contact email': 'بريد التواصل',
  'Contact mobile': 'رقم التواصل',
  'Company details': 'بيانات الشركة',
  'Default currency': 'العملة الافتراضية',
  'Notification preferences': 'تفضيلات الإشعارات',
  'Choose what you want to be notified about': 'اختر الإشعارات التي ترغب في استلامها',
  'Email & in-app prefs': 'تفضيلات البريد والإشعارات داخل التطبيق',
  'Avatar': 'الصورة الشخصية',
  'Change avatar': 'تغيير الصورة',
  'Addresses': 'العناوين',
  'Saved addresses': 'العناوين المحفوظة',
  'No saved addresses': 'لا توجد عناوين محفوظة',
  'Add address': 'إضافة عنوان',
  'Full street address': 'العنوان الكامل',
  'Destination': 'الوجهة',
  'Notes': 'ملاحظات',
  'Wallet': 'المحفظة',
  'Wallet balance': 'رصيد المحفظة',
  'Available Balance': 'الرصيد المتاح',
  'Balance & top-ups': 'الرصيد وعمليات الشحن',
  'Transaction History': 'سجل المعاملات',
  'All wallet activity': 'جميع عمليات المحفظة',
  'Top Up': 'شحن الرصيد',
  'Top Up Now': 'اشحن الآن',
  'Payment': 'الدفع',
  'Payment successful': 'تم الدفع بنجاح',
  'Payment received': 'تم استلام الدفعة',
  'Payment completed successfully.': 'اكتملت عملية الدفع بنجاح.',
  'Confirming payment': 'جارٍ تأكيد الدفع',
  'Payout Requests': 'طلبات الدفعات',
  'Request Payout': 'طلب دفعة',
  'Request a payout': 'طلب دفعة',
  'Payout history': 'سجل الدفعات',
  'No payout requests yet.': 'لا توجد طلبات دفعات بعد.',
  'My Stock': 'مخزوني',
  'Stored inventory': 'المخزون المحفوظ',
  'Release History': 'سجل إخراج المخزون',
  'Shipped out': 'تم شحنه',
  'My warehouse': 'مستودعي',
  'SKUs': 'رموز المنتجات',
  'Units': 'الوحدات',
  'Reserved': 'محجوز',
  'On Hand': 'المتوفر فعلياً',
  'Stored': 'تاريخ التخزين',
  'Release stock': 'إخراج المخزون',
  'No stored stock yet': 'لا يوجد مخزون محفوظ بعد',
  'No release requests yet': 'لا توجد طلبات إخراج بعد',
  'Tracking': 'التتبع',
  'Carrier': 'شركة الشحن',
  'Active delivery': 'شحنة نشطة',
  'No active shipments': 'لا توجد شحنات نشطة',
  'Delivery': 'التوصيل',
  'Labelling': 'التوسيم',
  'Fulfillment': 'تنفيذ الطلبات',
  'Labelling Service': 'خدمة التوسيم',
  'Add Labelling': 'إضافة التوسيم',
  'Labelling Type': 'نوع التوسيم',
  'Label type': 'نوع الملصق',
  'Create Label': 'إنشاء ملصق',
  'Invoices': 'الفواتير',
  'My invoices': 'فواتيري',
  'Tax Invoice': 'فاتورة ضريبية',
  'TAX INVOICE': 'فاتورة ضريبية',
  'VAT 15%': 'ضريبة القيمة المضافة 15٪',
  'Payment Method': 'طريقة الدفع',
  'No line items': 'لا توجد بنود',
  'Returns': 'المرتجعات',
  'My returns': 'مرتجعاتي',
  'Request a return': 'طلب إرجاع',
  'Reason': 'السبب',
  'Describe the issue': 'صف المشكلة',
  'Requested refund (SAR)': 'المبلغ المطلوب استرداده (ر.س)',
  'Photos (up to 5)': 'صور (حتى 5)',
  'No return requests yet': 'لا توجد طلبات إرجاع بعد',
  'Tickets': 'التذاكر',
  'Support tickets': 'تذاكر الدعم',
  'Submit Ticket': 'إرسال تذكرة',
  'New ticket': 'تذكرة جديدة',
  'Subject': 'الموضوع',
  'Message': 'الرسالة',
  'Reply...': 'اكتب ردك...',
  'Attach file': 'إرفاق ملف',
  'Get help from our team': 'احصل على مساعدة فريقنا',
  'Brief description of your issue': 'وصف مختصر للمشكلة',
  'Describe your issue in detail...': 'اشرح مشكلتك بالتفصيل...',
  'Quick Actions': 'إجراءات سريعة',
  'Browse Products': 'تصفح المنتجات',
  'Browse products': 'تصفح المنتجات',
  'Place Order': 'إنشاء طلب',
  'Track Shipment': 'تتبع الشحنة',
  'Request Sourcing': 'طلب توريد',
  'Complete your seller setup': 'أكمل إعداد حساب البائع',
  'Connect Shopify': 'اربط شوبيفاي',
  'Place first order': 'أنشئ طلبك الأول',
  'Active Orders': 'الطلبات النشطة',
  'Month Spend': 'إنفاق الشهر',
  'No orders yet': 'لا توجد طلبات بعد',
  'No order data yet': 'لا توجد بيانات طلبات بعد',
  'No spending data': 'لا توجد بيانات إنفاق',
  'All Orders': 'كل الطلبات',
  'New Orders': 'طلبات جديدة',
  'Imported orders': 'الطلبات المستوردة',
  'Recurring orders': 'الطلبات المتكررة',
  'Order templates': 'قوالب الطلبات',
  'Save as template': 'حفظ كقالب',
  'Save Order as Template': 'حفظ الطلب كقالب',
  'Template name *': 'اسم القالب *',
  'No orders with this status yet.': 'لا توجد طلبات بهذه الحالة بعد.',
  'Bulk import': 'استيراد جماعي',
  'Sample CSV': 'ملف CSV نموذجي',
  'Clear': 'مسح',
  'Product Details': 'تفاصيل المنتج',
  'Product not found': 'المنتج غير موجود',
  'Back to Catalog': 'العودة إلى الكتالوج',
  'Product link': 'رابط المنتج',
  'Paste the product page address': 'ألصق رابط صفحة المنتج',
  'Read product details': 'قراءة تفاصيل المنتج',
  'Opening the product page…': 'جارٍ فتح صفحة المنتج…',
  'Reading the page…': 'جارٍ قراءة الصفحة…',
  'Recently browsed': 'شوهدت مؤخراً',
  'My favourites': 'مفضلتي',
  'No favourites yet': 'لا توجد منتجات مفضلة بعد',
  'No browsed products yet': 'لا توجد منتجات شوهدت مؤخراً',
  'Product Drafts': 'مسودات المنتجات',
  'All Products': 'كل المنتجات',
  'Live Listings': 'المنتجات المنشورة',
  'Pending Approval': 'بانتظار الموافقة',
  'Out of stock': 'نفد المخزون',
  'Inventory Alerts': 'تنبيهات المخزون',
  'Low-stock alerts': 'تنبيهات انخفاض المخزون',
  'No products added yet': 'لم تتم إضافة منتجات بعد',
  'No listings in this view yet.': 'لا توجد منتجات في هذا العرض بعد.',
  'Total Products': 'إجمالي المنتجات',
  'Active Listings': 'المنتجات النشطة',
  'Orders This Month': 'طلبات هذا الشهر',
  'Sales This Month': 'مبيعات هذا الشهر',
  'Buyer Markets': 'أسواق المشترين',
  'In your catalog': 'في كتالوجك',
  'Live on channels': 'منشورة في القنوات',
  'Across all channels': 'عبر جميع القنوات',
  'Gross order value': 'إجمالي قيمة الطلبات',
  'Awaiting first sale': 'بانتظار أول عملية بيع',
  'Ready to withdraw': 'جاهز للسحب',
  'No payouts yet': 'لا توجد دفعات بعد',
  '6 GCC markets available': '6 أسواق خليجية متاحة',
  'Recent Orders': 'أحدث الطلبات',
  'Verification Status': 'حالة التحقق',
  'Business Registration': 'السجل التجاري',
  'Warehouse Details': 'بيانات المستودع',
  'Documents Submitted': 'المستندات المرسلة',
  'Documents Verified': 'المستندات الموثقة',
  'Business documents': 'مستندات المنشأة',
  'Required business documents': 'مستندات المنشأة المطلوبة',
  'No file on record': 'لا يوجد ملف مسجل',
  'Upload': 'رفع',
  'Replace file': 'استبدال الملف',
  'Company and contact details for GCC wholesalers.': 'بيانات الشركة والتواصل لتجار الجملة في الخليج.',
  'Sales performance analytics for GCC wholesalers.': 'تحليلات أداء المبيعات لتجار الجملة في الخليج.',
  'Payouts and settlement for GCC wholesalers.': 'الدفعات والتسويات لتجار الجملة في الخليج.',
  'Sales, last 6 months': 'المبيعات خلال آخر 6 أشهر',
  'Gross Sales': 'إجمالي المبيعات',
  'Delivered Sales': 'المبيعات المسلّمة',
  'Channel split': 'توزيع القنوات',
  'Best selling products': 'المنتجات الأكثر مبيعاً',
  'No sales data yet. Analytics build up as orders arrive.': 'لا توجد بيانات مبيعات بعد. ستظهر التحليلات عند ورود الطلبات.',
  'Store Integrations': 'ربط المتاجر',
  'Connect store': 'ربط متجر',
  'Connect your selling platforms': 'اربط منصات البيع الخاصة بك',
  'Shopify Store': 'متجر شوبيفاي',
  'Noon Store': 'متجر نون',
  'Connection verified': 'تم التحقق من الاتصال',
  'Disconnect': 'قطع الاتصال',
  'Connect': 'ربط',
  'Referral & Earn': 'الإحالة والربح',
  'Refer & Earn': 'أحِل واربح',
  'Copy link': 'نسخ الرابط',
  'Invite friends, earn 25 SAR': 'ادعُ أصدقاءك واربح 25 ر.س',
  'Team Members': 'أعضاء الفريق',
  'Invite teammate': 'دعوة عضو',
  'Invite teammates with limited access to your account': 'ادعُ أعضاء فريق بصلاحيات محدودة إلى حسابك',
  'Profit calculator': 'حاسبة الربح',
  'Selling price (SAR)': 'سعر البيع (ر.س)',
  'Commission %': 'نسبة العمولة ٪',
  'Profit per unit': 'الربح لكل وحدة',
  'Margin': 'هامش الربح',
  'Revenue': 'الإيرادات',
  'Total profit': 'إجمالي الربح',
  'Plan usage': 'استخدام الباقة',
  'Usage': 'الاستخدام',
  'Upgrade': 'ترقية',
  'Current plan': 'الباقة الحالية',
  'Free plan': 'الباقة المجانية',
  'Paid plan': 'باقة مدفوعة',
  'Unlimited': 'غير محدود',
  'Monthly limit reached': 'تم بلوغ الحد الشهري',
  'Source': 'المصدر',
  'Local (KSA)': 'محلي (السعودية)',
  'Global': 'عالمي',
  'Good morning': 'صباح الخير',
  'Good afternoon': 'مساء الخير',
  'Good evening': 'مساء الخير',
  'No results found.': 'لم يتم العثور على نتائج.',
  'No results': 'لا توجد نتائج',
  'No data yet': 'لا توجد بيانات بعد',
  'Try again': 'حاول مرة أخرى',
  'Something went wrong': 'حدث خطأ ما',
  'Action failed': 'تعذر تنفيذ الإجراء',
  'Required': 'مطلوب',
  'Optional': 'اختياري',
  'Yes': 'نعم',
  'No': 'لا',
};

const patterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^Hello,\s*(.+)$/i, (m) => `مرحباً، ${m[1]}`],
  [/^Good morning,\s*(.+)$/i, (m) => `صباح الخير، ${m[1]}`],
  [/^Good afternoon,\s*(.+)$/i, (m) => `مساء الخير، ${m[1]}`],
  [/^Good evening,\s*(.+)$/i, (m) => `مساء الخير، ${m[1]}`],
  [/^Showing\s+(\d+)–(\d+)\s+of\s+(\d+)$/i, (m) => `عرض ${m[1]}–${m[2]} من ${m[3]}`],
  [/^Page\s+(\d+)\s+of\s+(\d+)$/i, (m) => `الصفحة ${m[1]} من ${m[2]}`],
  [/^(\d+)\s+orders?$/i, (m) => `${m[1]} طلب`],
  [/^(\d+)\s+products?$/i, (m) => `${m[1]} منتج`],
  [/^(\d+)\s+items?$/i, (m) => `${m[1]} عنصر`],
  [/^Tracking:\s*(.+)$/i, (m) => `التتبع: ${m[1]}`],
];

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const translatedAttributes = ['placeholder', 'title', 'aria-label'];

function translate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return value;
  const exact = phrases[trimmed];
  let translated = exact;
  if (!translated) {
    for (const [pattern, replacer] of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        translated = replacer(match);
        break;
      }
    }
  }
  if (!translated) return value;
  const start = value.match(/^\s*/)?.[0] ?? '';
  const end = value.match(/\s*$/)?.[0] ?? '';
  return `${start}${translated}${end}`;
}

function translateTree(root: ParentNode, arabic: boolean) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    const parent = node.parentElement;
    if (!parent || parent.closest('script, style, code, pre, [data-no-portal-translate]')) continue;
    const saved = originalText.get(node) ?? node.data;
    if (!originalText.has(node)) originalText.set(node, saved);
    const next = arabic ? translate(saved) : saved;
    if (node.data !== next) node.data = next;
  }

  const elements = root instanceof Element ? [root, ...root.querySelectorAll('*')] : [...root.querySelectorAll('*')];
  for (const element of elements) {
    if (element.closest('script, style, code, pre, [data-no-portal-translate]')) continue;
    let saved = originalAttributes.get(element);
    if (!saved) {
      saved = new Map();
      originalAttributes.set(element, saved);
    }
    for (const attribute of translatedAttributes) {
      const current = element.getAttribute(attribute);
      if (current === null) continue;
      if (!saved.has(attribute)) saved.set(attribute, current);
      const source = saved.get(attribute) ?? current;
      const next = arabic ? translate(source) : source;
      if (current !== next) element.setAttribute(attribute, next);
    }
  }
}

function isCustomerPortal(pathname: string) {
  if (pathname === '/dropshipping' || pathname.startsWith('/dropshipping/')) return true;
  if (pathname === '/agency/portal' || pathname.startsWith('/agency/portal/')) return true;
  return /^\/partners\/(dashboard|products|orders|analytics|finance|verification|profile|settings)(\/|$)/.test(pathname);
}

/**
 * Localizes legacy portal screens while they are migrated to keyed copy.
 * It is deliberately restricted to signed-in customer portals; admin areas
 * and public marketing pages are never touched.
 */
export function PortalArabicTranslator() {
  const { pathname } = useLocation();
  const { isArabic } = useLocale();

  useEffect(() => {
    if (!isCustomerPortal(pathname)) return;
    let queued = false;
    const apply = () => {
      queued = false;
      translateTree(document.body, isArabic);
    };
    apply();
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(apply);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: translatedAttributes });
    return () => observer.disconnect();
  }, [isArabic, pathname]);

  return null;
}