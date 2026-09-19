import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { useAgency, inviteLink } from '@/hooks/useAgency';
import { Copy, MessageCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from '@/i18n/LocaleProvider';

export default function AgencyLink() {
  const { t } = useLocale();
  const { agency } = useAgency();
  const code = agency?.code || '';
  const link = code ? inviteLink(code) : '';

  const pitchEn = t('agency.link.pitch', { link });
  const pitchAr = `ابدأ الدروب شيبنج في السعودية مع تجارة — التوريد والتخزين والتغليف والتوصيل، كل شيء علينا. سجّل عبر رابطي: ${link}`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('agency.link.linkCopied', { label }));
  };

  return (
    <>
      <PageHeader
        title={t('agency.link.title')}
        highlight={t('agency.link.highlight')}
        subtitle={t('agency.link.subtitle')}
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('agency.link.inviteCode')}</div>
            <div className="mt-1 text-3xl font-black tracking-widest">{code || '—'}</div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={link} className="font-mono text-sm" />
            <Button onClick={() => copy(link, t('agency.link.copyLink'))}><Copy className="mr-2 h-4 w-4" /> {t('agency.link.copyLink')}</Button>
            <Button
              variant="outline"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(pitchEn)}`, '_blank')}
            >
              <MessageCircle className="mr-2 h-4 w-4" /> {t('agency.link.whatsapp')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 p-6">
          <h2 className="flex items-center gap-2 font-bold"><Share2 className="h-4 w-4" /> {t('agency.link.readyMessages')}</h2>
          {[
            [t('agency.link.labelEnglish'), pitchEn, 'ltr'],
            [t('agency.link.labelArabic'), pitchAr, 'rtl'],
          ].map(([label, text, dir]) => (
            <div key={label as string} className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
              <p dir={dir as 'ltr' | 'rtl'} className="text-sm">{text}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => copy(text as string, label as string)}>
                <Copy className="mr-2 h-3.5 w-3.5" /> {t('agency.link.copy')}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-bold">{t('agency.link.tipsTitle')}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>{t('agency.link.tip1')}</li>
            <li>{t('agency.link.tip2')}</li>
            <li>{t('agency.link.tip3')}</li>
            <li>{t('agency.link.tip4')}</li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
