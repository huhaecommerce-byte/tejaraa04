import { Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { RetailTrustBar } from '@/components/retail/common';

const content = {
  en: [
    { icon: Truck, title: 'Delivery across KSA', description: 'Local and imported products' },
    { icon: ShieldCheck, title: 'Secure checkout', description: 'Protected payment experience' },
    { icon: RotateCcw, title: 'Returns support', description: 'Clear support process' },
    { icon: Headphones, title: 'Customer support', description: 'Arabic and English assistance' },
  ],
  ar: [
    { icon: Truck, title: 'توصيل داخل السعودية', description: 'منتجات محلية ومستوردة' },
    { icon: ShieldCheck, title: 'دفع آمن', description: 'تجربة دفع محمية' },
    { icon: RotateCcw, title: 'دعم الإرجاع', description: 'إجراءات واضحة للدعم' },
    { icon: Headphones, title: 'دعم العملاء', description: 'خدمة بالعربية والإنجليزية' },
  ],
};

export function HomepageTrustBar({ locale = 'en' }: { locale?: 'en' | 'ar' }) {
  return <RetailTrustBar items={content[locale]} />;
}
