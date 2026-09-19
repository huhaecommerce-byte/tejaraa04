import { useState } from 'react';
import { Link } from "@/lib/router-compat";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, ShieldCheck, Zap, Users, ArrowRight, ArrowLeft, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/BrandLogo';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';

type Audience = 'shop' | 'dropshipping';

const ForgotPassword = ({ audience = 'shop' }: { audience?: Audience }) => {
  const isDropship = audience === 'dropshipping';
  const signinHref = isDropship ? '/selling/signin' : '/shop/signin';
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset link');
    } finally {
      setSubmitting(false);
    }
  };

  const card = (
    <div className={isDropship
      ? "lg:bg-transparent lg:p-0 lg:border-0 lg:shadow-none lg:backdrop-blur-none bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl p-5 sm:p-8"
      : "rounded-2xl border border-retail-border bg-retail-card shadow-sm p-6 sm:p-8"}>
      {isDropship && (
        <Link
          to="/"
          className="mb-4 inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-button transition-transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-4 w-4" /> Back to homepage
        </Link>
      )}
      {sent ? (
        <div className="text-center">
          <div className={isDropship
            ? "mx-auto w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4"
            : "mx-auto w-12 h-12 rounded-full bg-retail-light-green flex items-center justify-center mb-4"}>
            <MailCheck className={isDropship ? "h-7 w-7 text-emerald-600" : "h-5 w-5 text-retail-dark-green"} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Check your inbox</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            We sent a password reset link to <span className="font-semibold text-foreground">{email}</span>. Follow the link to set a new password.
          </p>
          <Link to={signinHref} className="btn-pill-primary w-full text-base md:text-sm group min-h-11 md:min-h-12 mt-6 inline-flex">
            Back to sign in <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <button type="button" onClick={() => setSent(false)} className="mt-3 text-sm text-muted-foreground hover:text-foreground">
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <div className="mb-5 lg:mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">{isDropship ? 'Reset your password' : 'Forgot password?'}</h1>
            <p className="text-muted-foreground mt-2">{isDropship ? 'Enter your business email and we\'ll send you a secure reset link.' : 'Enter your email and we\'ll send you a reset link.'}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3.5 lg:space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={isDropship ? "seller@example.com" : "you@example.com"} required className="focus-glow rounded-xl mt-1.5 h-11 md:h-10 text-base md:text-sm" />
            </div>
            <button type="submit" className="btn-pill-primary w-full text-base md:text-sm group min-h-11 md:min-h-12 active:scale-[0.98] transition-transform" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</span>
              ) : (
                <>Send reset link <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
              )}
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-5 lg:mt-6">
            Remembered it? <Link to={signinHref} className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </>
      )}
    </div>
  );

  if (!isDropship) {
    return (
      <RetailPublicShell contentClassName="flex items-start justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-md animate-scale-in">{card}</div>
      </RetailPublicShell>
    );
  }

  return (
    <div className="min-h-[100dvh] lg:min-h-screen grid lg:grid-cols-2 overflow-hidden">
      <div className="relative hidden lg:flex flex-col justify-between p-12 mesh-gradient-cta overflow-hidden">
        <span className="sparkle-dot top-16 left-[20%]" />
        <span className="sparkle-dot top-1/3 right-[25%]" style={{ animationDelay: '0.6s' }} />
        <span className="sparkle-dot bottom-32 left-[40%] !w-1.5 !h-1.5" style={{ animationDelay: '1.1s' }} />
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-green-400/15 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2.5 group w-fit">
          <BrandLogo variant="storefront" onDark />
        </Link>

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md px-4 py-1.5 text-sm text-white font-medium mb-6">
            <Sparkles className="h-4 w-4 text-emerald-300" /> Reset your password
          </span>
          <h2 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight text-white">
            Forgot it? <span className="scribble-underline text-gradient-light">No worries</span>.
          </h2>
          <p className="mt-5 text-white/75 text-lg max-w-md leading-relaxed">
            We'll email you a secure link to set a new password and get you right back into your dashboard.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 max-w-sm">
            {[
              { icon: ShieldCheck, label: 'Secure, time-limited link' },
              { icon: Zap, label: 'Arrives within seconds' },
              { icon: Users, label: 'Trusted by 500+ sellers' },
            ].map((f, i) => (
              <div key={i} className="glass-card-float-dark px-4 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shrink-0">
                  <f.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-white">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/75">© 2026 Tejaraa.com · Built for KSA sellers</p>
      </div>

      <div className="relative flex min-h-[100dvh] lg:min-h-0 items-center justify-center px-5 sm:px-6 py-5 lg:py-12 bg-emerald-900 lg:bg-background overflow-hidden overscroll-none">
        <Link
          to={signinHref}
          className="absolute top-5 left-5 z-30 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border bg-white/15 border-white/25 text-white backdrop-blur-md hover:bg-white/25 transition lg:bg-transparent lg:text-muted-foreground lg:border-border lg:hover:text-foreground lg:hover:bg-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>

        <div className="fixed inset-0 lg:hidden mesh-gradient-cta pointer-events-none" />
        <div className="lg:hidden fixed -top-20 -right-20 w-80 h-80 rounded-full bg-emerald-400/25 blur-3xl pointer-events-none" />
        <div className="lg:hidden fixed -bottom-20 -left-20 w-80 h-80 rounded-full bg-green-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md animate-scale-in">
          <Link to="/" className="lg:hidden flex items-center justify-center gap-2 mb-5 group">
            <BrandLogo variant="storefront" onDark />
          </Link>
          {card}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
