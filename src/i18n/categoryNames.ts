import type { Locale } from './dictionary';

/**
 * Arabic names for the storefront's standard department set. Category records that
 * come from supplier feeds keep their own name when no translation exists here.
 */
const CATEGORY_AR: Record<string, string> = {
  'mobiles & tablets': 'الجوالات والأجهزة اللوحية',
  'smart phones': 'الهواتف الذكية',
  'mobile parts': 'قطع غيار الجوالات',
  'mobile accessories': 'إكسسوارات الجوالات',
  'apple accessories': 'إكسسوارات آبل',
  'apple parts': 'قطع غيار آبل',
  'samsung accessories': 'إكسسوارات سامسونج',
  'samsung parts': 'قطع غيار سامسونج',
  electronics: 'الإلكترونيات',
  'consumer electronics': 'الإلكترونيات الاستهلاكية',
  'computer & networking': 'الحاسب والشبكات',
  'game accessories': 'إكسسوارات الألعاب',
  'camera accessories': 'إكسسوارات الكاميرات',
  'dji & insta360 accessories': 'إكسسوارات DJI و Insta360',
  'smart wear': 'الأجهزة القابلة للارتداء',
  security: 'الأمن والمراقبة',
  'home & kitchen': 'المنزل والمطبخ',
  'home & garden': 'المنزل والحديقة',
  fashion: 'الأزياء',
  'jewelry & apparel': 'المجوهرات والملابس',
  'beauty & care': 'الجمال والعناية',
  health: 'الصحة',
  sports: 'الرياضة',
  'outdoor & sports': 'الأنشطة الخارجية والرياضة',
  automotive: 'السيارات',
  'in car': 'مستلزمات السيارة',
  'daily needs': 'الاحتياجات اليومية',
  'office & school supplies': 'المستلزمات المكتبية والمدرسية',
  'print your demand(pod)': 'الطباعة حسب الطلب',
};

/** Translate a category label for display; unknown names are returned unchanged. */
export function translateCategory(name: string, locale: Locale) {
  if (locale !== 'ar') return name;
  return CATEGORY_AR[name.trim().toLowerCase()] ?? name;
}
