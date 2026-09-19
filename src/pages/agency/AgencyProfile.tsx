import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAgency, num } from '@/hooks/useAgency';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';

interface Profile {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  website: string | null;
  audience: string | null;
  payout_method: string | null;
  payout_details: Record<string, any> | null;
}

export default function AgencyProfilePage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const { agency } = useAgency();
  const [form, setForm] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('agency_profiles')
      .select('company_name, contact_name, email, phone, country, website, audience, payout_method, payout_details')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setForm((data as Profile) || null));
  }, [user]);

  const set = (k: keyof Profile, v: any) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = async () => {
    if (!form || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from('agency_profiles')
      .update({
        company_name: form.company_name,
        contact_name: form.contact_name,
        phone: form.phone,
        country: form.country,
        website: form.website,
        audience: form.audience,
        payout_method: form.payout_method,
        payout_details: form.payout_details || {},
      } as never)
      .eq('user_id', user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(t('agency.profile.savedToast'));
  };

  if (!form) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const details = form.payout_details || {};

  return (
    <>
      <PageHeader
        title={t('agency.profile.title')}
        highlight={t('agency.profile.highlight')}
        subtitle={t('agency.profile.subtitle', { rate: num(agency?.rate) })}
      />
      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('agency.profile.agencyName')}</Label>
              <Input value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('agency.profile.contactName')}</Label>
              <Input value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('agency.profile.email')}</Label>
              <Input value={form.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>{t('agency.profile.phone')}</Label>
              <Input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('agency.profile.country')}</Label>
              <Input value={form.country || ''} onChange={(e) => set('country', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('agency.profile.website')}</Label>
              <Input value={form.website || ''} onChange={(e) => set('website', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('agency.profile.recruitLabel')}</Label>
            <Textarea rows={3} value={form.audience || ''} onChange={(e) => set('audience', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 p-6">
          <h2 className="font-bold">{t('agency.profile.payoutDetails')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('agency.profile.preferredMethod')}</Label>
              <Input value={form.payout_method || ''} onChange={(e) => set('payout_method', e.target.value)} placeholder={t('agency.profile.preferredMethodPlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label>{t('agency.profile.accountHolder')}</Label>
              <Input value={details.holder || ''} onChange={(e) => set('payout_details', { ...details, holder: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t('agency.profile.bankName')}</Label>
              <Input value={details.bank || ''} onChange={(e) => set('payout_details', { ...details, bank: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t('agency.profile.iban')}</Label>
              <Input value={details.iban || ''} onChange={(e) => set('payout_details', { ...details, iban: e.target.value })} />
            </div>
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {t('agency.profile.saveChanges')}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
