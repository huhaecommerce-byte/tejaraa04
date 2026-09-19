import { useEffect, useState } from 'react';
import { Link, useNavigate } from "@/lib/router-compat";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Package, Sparkles, ShieldCheck, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/BrandLogo';
import { useLocale } from '@/i18n/LocaleProvider';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { t } = useLocale();

  useEffect(() => {
    // Wait a tick for Supabase detectSessionInUrl to consume the recovery hash
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setHasSession(!!data.session);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error(t('shopx.reset.toastMinLength'));
    if (password !== confirm) return toast.error(t('shopx.reset.toastMismatch'));
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success(t('shopx.reset.toastSuccess'));
      navigate('/shop/signin');
    } catch (err: any) {
      toast.error(err.message || t('shopx.reset.toastFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] lg:min-h-screen grid lg:grid-cols-2 overflow-hidden">
      <div className="relative hidden lg:flex flex-col justify-between p-12 mesh-gradient-cta overflow-hidden">
        <span className="sparkle-dot top-16 left-[20%]" />
        <span className="sparkle-dot top-1/3 right-[25%]" style={{ animationDelay: '0.6s' }} />
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-green-400/15 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2.5 group w-fit">
          <BrandLogo variant="storefront" onDark />
        </Link>

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md px-4 py-1.5 text-sm text-white font-medium mb-6">
            <Sparkles className="h-4 w-4 text-emerald-300" /> {t('shopx.reset.almostThere')}
          </span>
          <h2 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight text-white">
            {t('shopx.reset.setNewPassword')}
          </h2>
          <p className="mt-5 text-white/75 text-lg max-w-md leading-relaxed">
            {t('shopx.reset.chooseStrong')}
          </p>

          <div className="mt-8 max-w-sm">
            <div className="glass-card-float-dark px-4 py-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-white">{t('shopx.reset.atLeast6')}</span>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-white/75">© 2026 Tejaraa.com · Built for KSA sellers</p>
      </div>

      <div className="relative flex min-h-[100dvh] lg:min-h-0 items-center justify-center px-5 sm:px-6 py-5 lg:py-12 bg-emerald-900 lg:bg-background overflow-hidden overscroll-none">
        <Link
          to="/shop/signin"
          className="absolute top-5 left-5 z-30 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border bg-white/15 border-white/25 text-white backdrop-blur-md hover:bg-white/25 transition lg:bg-transparent lg:text-muted-foreground lg:border-border lg:hover:text-foreground lg:hover:bg-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t('shopx.reset.backToSignIn')}
        </Link>

        <div className="fixed inset-0 lg:hidden mesh-gradient-cta pointer-events-none" />
        <div className="lg:hidden fixed -top-20 -right-20 w-80 h-80 rounded-full bg-emerald-400/25 blur-3xl pointer-events-none" />
        <div className="lg:hidden fixed -bottom-20 -left-20 w-80 h-80 rounded-full bg-green-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md animate-scale-in">
          <Link to="/" className="lg:hidden flex items-center justify-center gap-2 mb-5 group">
            <BrandLogo variant="storefront" onDark />
          </Link>
          <div className="lg:bg-transparent lg:p-0 lg:border-0 lg:shadow-none lg:backdrop-blur-none bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl p-5 sm:p-8">
            {hasSession === false ? (
              <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
                  <KeyRound className="h-7 w-7 text-red-600" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight">{t('shopx.reset.invalidLinkTitle')}</h1>
                <p className="text-muted-foreground mt-2 text-sm">
                  {t('shopx.reset.invalidLinkDescription')}
                </p>
                <Link to="/forgot-password" className="btn-pill-primary w-full text-base md:text-sm group min-h-11 md:min-h-12 mt-6 inline-flex">
                  {t('shopx.reset.requestNewLink')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-5 lg:mb-8">
                  <h1 className="text-3xl font-extrabold tracking-tight">{t('shopx.reset.newPasswordTitle')}</h1>
                  <p className="text-muted-foreground mt-2">{t('shopx.reset.chooseNewPassword')}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3.5 lg:space-y-4">
                  <div>
                    <Label>{t('shopx.reset.newPasswordLabel')}</Label>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="focus-glow rounded-xl mt-1.5 h-11 md:h-10 text-base md:text-sm" />
                  </div>
                  <div>
                    <Label>{t('shopx.reset.confirmPasswordLabel')}</Label>
                    <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required minLength={6} className="focus-glow rounded-xl mt-1.5 h-11 md:h-10 text-base md:text-sm" />
                  </div>
                  <button type="submit" className="btn-pill-primary w-full text-base md:text-sm group min-h-11 md:min-h-12 active:scale-[0.98] transition-transform" disabled={submitting || hasSession === null}>
                    {submitting ? (
                      <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('shopx.reset.updating')}</span>
                    ) : (
                      <>{t('shopx.reset.updatePassword')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
