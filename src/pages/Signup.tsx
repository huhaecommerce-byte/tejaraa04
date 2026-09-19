import { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate, useSearchParams } from "@/lib/router-compat";
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Sparkles, ShieldCheck, Zap, TrendingUp, ArrowRight, ArrowLeft, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { celebrateSignup } from '@/lib/celebrate';
import { WelcomeOverlay } from '@/components/auth/WelcomeOverlay';
import { trackReferralVisit } from '@/lib/referrals.functions';
import { sendSignupOtp, verifySignupOtp } from '@/lib/signupOtp.functions';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';




type Audience = 'shop' | 'dropshipping';


/**
 * Applies an invite code from the URL. Agency codes and customer referral codes
 * live in separate programmes, so we try both — only one can ever match.
 */
async function applyInviteCode(code: string): Promise<{ message?: string } | null> {
  const upper = code.toUpperCase();
  const { data: agencyResult } = await (supabase as any).rpc('apply_agency_code', { _code: upper });
  if (agencyResult?.ok) return { message: `You were referred by ${agencyResult.agency}` };
  const { data } = await (supabase as any).rpc('apply_referral_code', { _code: upper });
  return data?.ok ? data : null;
}

const Signup = ({ audience = 'shop' }: { audience?: Audience }) => {
  const isDropship = audience === 'dropshipping';
  const homeDest = isDropship ? '/dropshipping' : '/account';
  const loginHref = isDropship ? '/selling/signin' : '/shop/signin';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const { signup, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const refCode = params.get('ref') || '';

  // One registration entry: wholesalers continue in the supplier portal.
  useEffect(() => {
    if (params.get('role') === 'supplier') navigate('/partners/signup', { replace: true });
  }, [params, navigate]);


  // Track referral link visit (fire-and-forget, pre-auth, handled server-side)
  useEffect(() => {
    if (!refCode) return;
    trackReferralVisit({
      data: {
        code: refCode.toUpperCase(),
        meta: { ua: navigator.userAgent, ref: document.referrer || null },
      },
    }).catch(() => { /* ignore */ });
  }, [refCode]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (!isLoading && user && step === 'form') {
      // If a ref code was on the URL, try to apply it before redirecting
      if (refCode) {
        applyInviteCode(refCode).then((res) => {
          if (res?.message) toast.success(res.message);
        });
      }
      navigate(homeDest, { replace: true });
    }
  }, [user, isLoading, navigate, refCode, step, homeDest]);

  if (!isLoading && user && step === 'form') {
    return <Navigate to={homeDest} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signup(email, password, name);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Email confirmation is disabled — account is already active
        if (refCode) await applyInviteCode(refCode);
        celebrateSignup();
        toast.success('🎉 Welcome to Tejaraa! Your seller account is ready.');
        setShowWelcome(true);
        return;
      }
      await sendSignupOtp({ data: { email } });
      setStep('otp');
      setResendIn(45);
      toast.success(`We sent a 4-digit code to ${email}`);
    } catch (err: any) {
      toast.error(err.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (value?: string) => {
    const token = (value ?? code).trim();
    if (token.length !== 4) return;
    setVerifying(true);
    try {
      await verifySignupOtp({ data: { email, code: token } });
      // Email is now confirmed server-side — sign the user in directly
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Link any guest orders placed with this email and copy the details over
      try {
        await (supabase as any).rpc('claim_guest_shop_orders');
      } catch { /* non-blocking */ }


      if (refCode) {
        await applyInviteCode(refCode);
      }
      celebrateSignup();
      toast.success('🎉 Email verified! Your seller account is ready.');
      setShowWelcome(true);
    } catch (err: any) {
      setCode('');
      toast.error(err.message || 'Invalid or expired code');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      await sendSignupOtp({ data: { email } });
      setResendIn(45);
      toast.success('A new code is on its way');
    } catch (err: any) {
      toast.error(err.message || 'Could not resend the code');
    }
  };


  const formCard = (
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
      {step === 'otp' ? (
        <>
          <div className="mb-5 lg:mb-8 text-center">
            <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MailCheck className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Verify your email</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Enter the 4-digit code we sent to <span className="font-semibold text-foreground">{email}</span>
            </p>
          </div>
          <div className="flex justify-center">
            <InputOTP
              maxLength={4}
              value={code}
              onChange={(v) => {
                setCode(v);
                if (v.length === 4) void handleVerify(v);
              }}
              disabled={verifying}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3].map((i) => (
                  <InputOTPSlot key={i} index={i} className="h-14 w-14 text-xl" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <button
            type="button"
            onClick={() => void handleVerify()}
            disabled={verifying || code.length !== 4}
            className="btn-pill-primary w-full text-base md:text-sm group min-h-11 md:min-h-12 mt-5 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {verifying ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</span>
            ) : (
              <>Verify & continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
            )}
          </button>
          <p className="text-center text-sm text-muted-foreground mt-5">
            Didn't get the code?{' '}
            {resendIn > 0 ? (
              <span>Resend in {resendIn}s</span>
            ) : (
              <button type="button" onClick={() => void handleResend()} className="text-primary font-semibold hover:underline">
                Resend code
              </button>
            )}
          </p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            <button type="button" onClick={() => { setStep('form'); setCode(''); }} className="hover:underline">
              Use a different email
            </button>
          </p>
        </>
      ) : (
        <>
          <div className="mb-5 lg:mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">{isDropship ? 'Create your dropshipping account' : 'Create your account'}</h1>
            <p className="text-muted-foreground mt-2">{isDropship ? 'Same email works across Tejaraa shopping too' : 'Shop with one Tejaraa account'}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3.5 lg:space-y-4">
            <div>
              <Label htmlFor="signup-name">Full Name</Label>
              <Input id="signup-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ahmed Al-Rashid" required className="focus-glow rounded-xl mt-1.5 h-11 md:h-10 text-base md:text-sm" />
            </div>
            <div>
              <Label htmlFor="signup-email">Email</Label>
              <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="focus-glow rounded-xl mt-1.5 h-11 md:h-10 text-base md:text-sm" />
            </div>
            <div>
              <Label htmlFor="signup-password">Password</Label>
              <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="focus-glow rounded-xl mt-1.5 h-11 md:h-10 text-base md:text-sm" />
            </div>
            <button type="submit" className="btn-pill-primary w-full text-base md:text-sm group min-h-11 md:min-h-12 active:scale-[0.98] transition-transform" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</span>
              ) : (
                <>Create Account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
              )}
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-5 lg:mt-6">
            Already have an account? <Link to={loginHref} className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </>
      )}
    </div>
  );

  // Shop sign-up renders as a normal page inside the shop site chrome.
  const shopPage = (
    <RetailPublicShell contentClassName="flex items-start justify-center px-4 py-10 md:py-16">
      <div className="w-full max-w-md animate-scale-in">{formCard}</div>
    </RetailPublicShell>
  );

  return (
    <>

    {showWelcome && (
      <WelcomeOverlay
        name={name}
        onDone={() => {
          // Hard navigation so the freshly created session is fully hydrated
          // before the dashboard loads (avoids getting stuck on the overlay).
          window.location.replace(homeDest);
        }}
      />
    )}
    {!isDropship && shopPage}
    {isDropship && (
    <div className="min-h-[100dvh] lg:min-h-screen grid lg:grid-cols-2 overflow-hidden">
      <div className="relative hidden lg:flex flex-col mesh-gradient-cta overflow-hidden py-12 px-10 xl:px-16">
        <span className="sparkle-dot top-16 left-[20%]" />
        <span className="sparkle-dot top-1/3 right-[25%]" style={{ animationDelay: '0.6s' }} />
        <span className="sparkle-dot bottom-32 left-[40%] !w-1.5 !h-1.5" style={{ animationDelay: '1.1s' }} />
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-green-400/15 blur-3xl" />

        <div className="relative w-full max-w-lg mx-auto flex flex-col flex-1">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-white group w-fit">
            <Package className="h-7 w-7 transition-transform duration-300 group-hover:rotate-12" />
            <span>Tejaraa<span className="text-emerald-300 font-extrabold">.com</span></span>
          </Link>

          <div className="flex-1 flex flex-col justify-center py-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md px-4 py-1.5 text-sm text-white font-medium mb-6 w-fit">
              <Sparkles className="h-4 w-4 text-emerald-300" /> Free to start
            </span>
            <h2 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight text-white">
              Start sourcing & <span className="scribble-underline text-gradient-light">selling</span> today.
            </h2>
            <p className="mt-5 text-white/75 text-lg leading-relaxed">
              Join 500+ Amazon and Noon sellers across KSA. No credit card required for the Starter plan.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3">
              {[
                { icon: ShieldCheck, label: 'Vetted suppliers, quality-checked' },
                { icon: Zap, label: 'FBA/FBN labelling included' },
                { icon: TrendingUp, label: 'Scale from 1 to 10,000 units' },
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

          <p className="text-xs text-white/75">© 2026 Tejaraa.com · Built for KSA sellers</p>
        </div>
      </div>

      <div className="relative flex min-h-[100dvh] lg:min-h-0 items-center justify-center px-5 sm:px-6 py-5 lg:py-12 bg-emerald-900 lg:bg-background overflow-hidden overscroll-none">
        <div className="fixed inset-0 lg:hidden mesh-gradient-cta pointer-events-none" />
        <div className="lg:hidden fixed -top-20 -right-20 w-80 h-80 rounded-full bg-emerald-400/25 blur-3xl pointer-events-none" />
        <div className="lg:hidden fixed -bottom-20 -left-20 w-80 h-80 rounded-full bg-green-400/20 blur-3xl pointer-events-none" />
        <span className="lg:hidden sparkle-dot top-20 left-[15%] pointer-events-none" />
        <span className="lg:hidden sparkle-dot top-1/3 right-[20%] pointer-events-none" style={{ animationDelay: '0.6s' }} />
        <span className="lg:hidden sparkle-dot bottom-32 left-[35%] !w-1.5 !h-1.5 pointer-events-none" style={{ animationDelay: '1.1s' }} />

        <div className="relative z-10 w-full max-w-md animate-scale-in">
          <Link to="/" className="lg:hidden flex items-center justify-center gap-2 font-bold text-xl mb-5 group">
            <Package className="h-7 w-7 text-white transition-transform duration-300 group-hover:rotate-12" />
            <span className="text-white">Tejaraa<span className="text-emerald-300">.com</span></span>
          </Link>
          {formCard}
        </div>
      </div>
    </div>
    )}
    </>
  );
};

export default Signup;
