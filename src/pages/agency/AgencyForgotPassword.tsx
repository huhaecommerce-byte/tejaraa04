import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AgencyAuthShell } from '@/components/agency/auth/AgencyAuthShell';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Loader2, MailCheck } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';

export default function AgencyForgotPassword() {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast.error(err?.message || t('agency.forgotPassword.errorSend'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AgencyAuthShell
      eyebrow={t('agency.forgotPassword.eyebrow')}
      title={sent ? t('agency.forgotPassword.titleSent') : t('agency.forgotPassword.titleForm')}
      subtitle={sent ? t('agency.forgotPassword.subtitleSent') : t('agency.forgotPassword.subtitleForm')}
      footer={<><Link to="/agency/signin" className="font-semibold text-retail-green hover:underline">{t('agency.forgotPassword.backToSignIn')}</Link><span className="mx-2">·</span><Link to="/agency/signup" className="font-semibold text-retail-green hover:underline">{t('agency.forgotPassword.createAccount')}</Link></>}
    >
      {sent ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-retail-light-green text-retail-green">
            <MailCheck className="h-6 w-6" />
          </div>
          <p className="text-sm leading-6 text-retail-muted">{t('agency.forgotPassword.sentText', { email })}</p>
          <Button asChild variant="outline" className="h-11 w-full border-retail-border"><Link to="/agency/signin">{t('agency.forgotPassword.returnToSignIn')}</Link></Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">{t('agency.forgotPassword.emailLabel')}</Label>
            <Input id="email" type="email" autoComplete="email" placeholder={t('agency.forgotPassword.emailPlaceholder')} required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
          </div>
          <Button type="submit" className="h-11 w-full bg-retail-green font-bold hover:bg-retail-dark-green" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('agency.forgotPassword.submit')} {!submitting ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
          </Button>
        </form>
      )}
    </AgencyAuthShell>
  );
}
