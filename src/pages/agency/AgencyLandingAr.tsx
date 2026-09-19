import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AgencyPublicShell } from '@/components/agency/shell/AgencyPublicShell';
import { Handshake, Users, Coins, Repeat, ShieldCheck, LineChart, CheckCircle2 } from 'lucide-react';

const steps = [
  { icon: Handshake, title: 'قدّم طلبك في دقيقتين', text: 'أخبرنا من أنت وكيف تخطط لجلب البائعين إلى تجارة. نراجع كل طلب بأنفسنا.' },
  { icon: Users, title: 'انضم بالدروب شيبرز', text: 'بعد الموافقة تحصل على رابط دعوة خاص بك. كل من يسجّل عبره يرتبط بك بشكل دائم.' },
  { icon: Coins, title: 'اربح من كل طلب', text: 'تحصل على نسبة من أرباح تجارة على كل طلب يقوم به بائعوك، وليس الطلب الأول فقط.' },
  { icon: Repeat, title: 'اسحب أرباحك', text: 'تتجمع أرباحك في رصيدك، ويمكنك طلب السحب في أي وقت بعد تجاوز الحد الأدنى.' },
];

const benefits = [
  { icon: Repeat, title: 'عمولة مدى الحياة', text: 'لا توجد فترة انتهاء. ما دام بائعك يطلب، أنت تربح.' },
  { icon: LineChart, title: 'شفافية كاملة', text: 'شاهد كل طلب والربح الذي حققه ونصيبك منه لحظة بلحظة.' },
  { icon: ShieldCheck, title: 'نحن نتكفّل بالباقي', text: 'التوريد والتخزين والتغليف والشحن والدعم كلها على تجارة.' },
];

export default function AgencyLandingAr() {
  return (
    <AgencyPublicShell dir="rtl">
      <section className="bg-gradient-to-bl from-[hsl(152_45%_14%)] via-[hsl(152_40%_18%)] to-[hsl(152_35%_22%)] text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold">
            <Handshake className="h-4 w-4" /> برنامج الوكالات والمساعدين
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            دخل متجدد مع كل عملية بيع لبائعيك
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            اجلب الدروب شيبرز إلى منصة تجارة واحصل على نسبة من أرباحنا على كل طلب يقومون به.
            عشرة بائعين نشطين يعني عشرة مصادر دخل مستمرة.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-[hsl(152_45%_18%)] hover:bg-white/90">
              <Link to="/agency/apply">قدّم طلب الانضمام</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
              <Link to="/agency/signin">تسجيل دخول الشركاء</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/70">
            {['أرباح مدى الحياة', 'الانضمام مجاني', 'الدفع بالريال'].map((t) => (
              <span key={t} className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> {t}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-black md:text-4xl">كيف يعمل البرنامج</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Card key={s.title}>
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="text-xs font-semibold text-muted-foreground">الخطوة {i + 1}</div>
                <h3 className="mt-1 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-black md:text-4xl">مثال على شهر واحد</h2>
            <p className="mt-3 text-muted-foreground">
              لنفترض أنك ضممت 10 دروب شيبرز، وكل واحد منهم نفّذ 40 طلباً في الشهر، بمتوسط ربح
              25 ريالاً للطلب، ونسبتك 10%.
            </p>
            <div className="mt-6 space-y-3 rounded-2xl border bg-card p-6">
              {[
                ['عدد الطلبات', '400'],
                ['أرباح تجارة من هذه الطلبات', '10,000 ريال'],
                ['عمولتك (10%)', '1,000 ريال'],
              ].map(([k, v], i) => (
                <div key={k} className={`flex items-center justify-between gap-4 ${i === 2 ? 'border-t pt-3 text-lg font-bold' : 'text-sm'}`}>
                  <span className={i === 2 ? '' : 'text-muted-foreground'}>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">أرقام توضيحية. يتم تأكيد نسبتك عند اعتماد طلبك.</p>
          </div>
          <div className="grid gap-4">
            {benefits.map((b) => (
              <Card key={b.title}>
                <CardContent className="flex gap-4 p-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <b.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">{b.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{b.text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="text-3xl font-black">جاهز للبدء؟</h2>
        <p className="mt-3 text-muted-foreground">الانضمام مجاني تماماً ولا توجد أهداف أو رسوم.</p>
        <Button asChild size="lg" className="mt-6"><Link to="/agency/apply">ابدأ طلبي</Link></Button>
      </section>
    </AgencyPublicShell>
  );
}
