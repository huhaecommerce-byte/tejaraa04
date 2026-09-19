import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { AgencyCTA, AgencyFeatureList } from '@/components/agency/sections';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { ServiceFAQ } from '@/components/seller/service';
import {
  Handshake, Users, Coins, Repeat, ShieldCheck, LineChart, ArrowLeft,
} from 'lucide-react';

const steps = [
  { icon: Handshake, title: 'قدّم طلبك في دقيقتين', text: 'أخبرنا من أنت وكيف تخطط لجلب البائعين إلى تجارة. نراجع كل طلب بأنفسنا.' },
  { icon: Users, title: 'انضم بالدروب شيبرز', text: 'تحصل على رابط دعوة خاص بك، وكل من يسجّل عبره يرتبط بك بشكل دائم.' },
  { icon: Coins, title: 'اربح من كل طلب', text: 'تحصل على نسبة من أرباح تجارة على كل طلب ينفّذه بائعوك، وليس الطلب الأول فقط.' },
  { icon: Repeat, title: 'اسحب أرباحك', text: 'تتجمع أرباحك في رصيدك، ويمكنك طلب السحب في أي وقت بعد تجاوز الحد الأدنى.' },
];

const benefits = [
  { icon: Repeat, title: 'عمولة مدى الحياة', text: 'لا توجد فترة انتهاء. ما دام بائعك يطلب، أنت تربح.' },
  { icon: LineChart, title: 'شفافية كاملة', text: 'شاهد كل طلب والربح الذي حققه ونصيبك منه لحظة بلحظة.' },
  { icon: ShieldCheck, title: 'نحن نتكفّل بالباقي', text: 'التوريد والتخزين والتغليف والشحن والدعم كلها على تجارة.' },
];

const faqs = [
  { q: 'من يمكنه الانضمام؟', a: 'وكالات التسويق والمساعدون الافتراضيون ومديرو المجتمعات والمدربون وكل من لديه جمهور من بائعي التجارة الإلكترونية في السعودية والخليج.' },
  { q: 'إلى متى أستمر في الربح؟', a: 'ما دام البائع مستمراً مع تجارة. كل طلب ينفّذه يمنحك عمولة، ولا يوجد تاريخ انتهاء.' },
  { q: 'متى يمكنني السحب؟', a: 'تُفتح الأرباح بعد تسليم الطلب وانتهاء فترة الإرجاع، وبعدها يمكنك طلب السحب متى تجاوزت الحد الأدنى.' },
  { q: 'هل هناك أي رسوم؟', a: 'لا. الانضمام مجاني تماماً ولا توجد أهداف أو رسوم.' },
];

const exampleRows: Array<[string, string]> = [
  ['عدد الطلبات من بائعيك', '400'],
  ['أرباح تجارة من هذه الطلبات', '10,000 ريال'],
  ['عمولتك (10%)', '1,000 ريال'],
];

export default function AgencyLandingAr() {
  return (
    <AgencyPublicShell dir="rtl">
      <section className="hero-surface relative overflow-hidden text-white">
        <div aria-hidden className="hero-grid pointer-events-none absolute inset-0 opacity-15" />
        <SellerContainer className="relative py-10 sm:py-12 lg:py-14">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-retail-gold" />
              برنامج الوكالات والمساعدين في السعودية
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.15] sm:text-5xl">
              دخلك يكبر مع كل <span className="text-retail-gold">عملية بيع لبائعيك.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
              احصل على نسبة من أرباحنا على كل طلب ينفّذه البائعون الذين تضمّهم إلى تجارة.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-retail-gold font-bold text-retail-dark-green hover:bg-retail-gold/90">
                <Link to="/agency/apply">
                  قدّم طلب الانضمام
                  <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white">
                <Link to="/agency/signin">تسجيل دخول الشركاء</Link>
              </Button>
            </div>
          </div>
        </SellerContainer>
      </section>

      <section id="how" className="scroll-mt-28 py-9 lg:py-11">
        <SellerContainer>
          <SellerSectionHeading
            eyebrow="البرنامج"
            title="كيف يعمل البرنامج"
            description="أربع خطوات من الطلب حتى أول عملية سحب."
          />
          <ol className="mt-5 grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="border-t-2 border-retail-green pt-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-retail-green text-xs font-bold text-retail-card">
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-bold text-retail-dark-green">{step.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-7 text-retail-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </SellerContainer>
      </section>

      <section className="border-y border-retail-border bg-retail-light-green py-9 lg:py-11">
        <SellerContainer className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="min-w-0">
            <SellerSectionHeading
              eyebrow="مثال"
              title="مثال على شهر واحد"
              description="ضمّ 10 دروب شيبرز ينفّذ كل منهم 40 طلباً شهرياً، بمتوسط ربح 25 ريالاً للطلب ونسبة 10% لك."
            />
            <dl className="mt-5 divide-y divide-retail-border border-t border-retail-border bg-white">
              {exampleRows.map(([label, value], index) => (
                <div
                  key={label}
                  className={`flex items-center justify-between gap-4 px-4 py-3 ${index === 2 ? 'text-base font-extrabold text-retail-dark-green' : 'text-sm'}`}
                >
                  <dt className={index === 2 ? '' : 'text-retail-muted'}>{label}</dt>
                  <dd className="font-bold text-retail-dark-green">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs leading-6 text-retail-muted">
              أرقام توضيحية. يتم تأكيد نسبتك عند تفعيل حسابك.
            </p>
          </div>
          <div className="min-w-0">
            <SellerSectionHeading eyebrow="لماذا ينضم الشركاء" title="مبني ليستمر في الدفع لك" />
            <div className="mt-5">
              <AgencyFeatureList items={benefits} columns={2} />
            </div>
          </div>
        </SellerContainer>
      </section>

      <ServiceFAQ items={faqs} title="أسئلة شائعة" />

      <AgencyCTA
        variant="dark"
        title="ابدأ بضم البائعين إلى تجارة"
        text="الانضمام مجاني ولا يستغرق سوى دقيقتين."
        primaryLabel="ابدأ طلبي"
      />
    </AgencyPublicShell>
  );
}
