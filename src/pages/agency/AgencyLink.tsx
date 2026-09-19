import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { useAgency, inviteLink } from '@/hooks/useAgency';
import { Copy, MessageCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AgencyLink() {
  const { agency } = useAgency();
  const code = agency?.code || '';
  const link = code ? inviteLink(code) : '';

  const pitchEn = `Start dropshipping in Saudi Arabia with Tejaraa — sourcing, warehousing, labelling and delivery all handled for you. Sign up with my link: ${link}`;
  const pitchAr = `ابدأ الدروب شيبنج في السعودية مع تجارة — التوريد والتخزين والتغليف والتوصيل، كل شيء علينا. سجّل عبر رابطي: ${link}`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <>
      <PageHeader
        title="My invite link"
        highlight="invite"
        subtitle="Anyone who signs up through this link is linked to you for life — you earn on every order they ever place."
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invite code</div>
            <div className="mt-1 text-3xl font-black tracking-widest">{code || '—'}</div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={link} className="font-mono text-sm" />
            <Button onClick={() => copy(link, 'Link')}><Copy className="mr-2 h-4 w-4" /> Copy link</Button>
            <Button
              variant="outline"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(pitchEn)}`, '_blank')}
            >
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 p-6">
          <h2 className="flex items-center gap-2 font-bold"><Share2 className="h-4 w-4" /> Ready-made messages</h2>
          {[
            ['English', pitchEn, 'ltr'],
            ['العربية', pitchAr, 'rtl'],
          ].map(([label, text, dir]) => (
            <div key={label as string} className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
              <p dir={dir as 'ltr' | 'rtl'} className="text-sm">{text}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => copy(text as string, label as string)}>
                <Copy className="mr-2 h-3.5 w-3.5" /> Copy
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-bold">Tips that convert</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Target sellers who already have an audience but no supply chain — they order fastest.</li>
            <li>Walk them through their first order; sellers who place one order usually keep going.</li>
            <li>Share the catalogue and delivery times, not just the link.</li>
            <li>Your commission is calculated on Tejaraa profit, so bigger baskets mean bigger payouts.</li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
