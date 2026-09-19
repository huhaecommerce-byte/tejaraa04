import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AgencyAuthShell } from '@/components/agency/auth/AgencyAuthShell';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { canAccess, loadAccessProfile } from '@/lib/access-tiers';
import { useLocale } from '@/i18n/LocaleProvider';

import { toast } from 'sonner';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function AgencySignIn() {
  const { t } = useLocale();
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (isLoading || !user || blocked) return;
    let active = true;
    void loadAccessProfile(user.id).then((access) => {
      if (!active) return;
      if (canAccess(access.tier, 'agency')) navigate('/agency/portal', { replace: true });
      else setBlocked(true);
    });
    return () => { active = false; };
  }, [isLoading, user, blocked, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      const { data } = await supabase.auth.getUser();
      const access = await loadAccessProfile(data.user?.id);
      if (!canAccess(access.tier, 'agency')) {
        setBlocked(true);
        toast.error(t('agency.signin.errorNotPartner'));
        return;
      }
      navigate('/agency/portal', { replace: true });
    } catch (err: any) {
      toast.error(err?.message || t('agency.signin.errorSignIn'));
    } finally {
      setSubmitting(false);
    }
  };

  if (blocked) {
    return (
      <AgencyAuthShell
        eyebrow={t('agency.signin.blockedEyebrow')}
        title={t('agency.signin.blockedTitle')}
        subtitle={t('agency.signin.blockedSubtitle')}
      >
        <div className="space-y-3">
          <Button asChild className="h-11 w-full bg-retail-green font-bold hover:bg-retail-dark-green">
            <Link to="/agency/apply">{t('agency.signin.createPartnerAccount')}</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 w-full">
            <Link to="/dropshipping">{t('agency.signin.backToSelling')}</Link>
          </Button>
        </div>
      </AgencyAuthShell>
    );
  }


  return (
    <AgencyAuthShell
      eyebrow={t('agency.signin.eyebrow')}
      title={t('agency.signin.title')}
      subtitle={t('agency.signin.subtitle')}
      footer={<>{t('agency.signin.newToProgramme')} <Link to="/agency/signup" className="font-semibold text-retail-green hover:underline">{t('agency.signin.createPartnerAccountLink')}</Link></>}
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">{t('agency.signin.emailLabel')}</Label>
          <Input id="email" type="email" autoComplete="email" placeholder={t('agency.signin.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">{t('agency.signin.passwordLabel')}</Label>
            <Link to="/agency/forgot-password" className="text-xs font-semibold text-retail-green hover:underline">{t('agency.signin.forgotPassword')}</Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" placeholder={t('agency.signin.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11" />
        </div>
        <Button type="submit" className="h-11 w-full bg-retail-green font-bold hover:bg-retail-dark-green" disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t('agency.signin.submit')} {!submitting ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
        </Button>
      </form>
    </AgencyAuthShell>
  );
}
