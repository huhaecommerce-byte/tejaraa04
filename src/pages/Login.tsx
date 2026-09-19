import { useState, useEffect } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { Link, useNavigate, useSearchParams } from "@/lib/router-compat";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Sparkles, ShieldCheck, Zap, Users, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { celebrateLogin } from '@/lib/celebrate';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';



type Audience = 'shop' | 'dropshipping';

const Login = ({ audience = 'shop' }: { audience?: Audience }) => {
  const isDropship = audience === 'dropshipping';
  const homeDest = isDropship ? '/dropshipping' : '/account';
  const signupHref = isDropship ? '/selling/signup' : '/shop/signup';
  const forgotHref = isDropship ? '/selling/forgot-password' : '/shop/forgot-password';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const role = params.get('role') === 'supplier' ? 'supplier' : params.get('role') === 'seller' ? 'seller' : 'buyer';

  // One sign-in entry: suppliers continue in the wholesaler portal.
  useEffect(() => {
    if (role === 'supplier') navigate('/partners/signin', { replace: true });
  }, [role, navigate]);

  useEffect(() => {
    if (isLoading || !user) return;
    navigate(homeDest, { replace: true });
  }, [isLoading, navigate, user, homeDest]);

  if (!isLoading && user) {
    return <div className="min-h-screen bg-background" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      const { data: { session } } = await supabase.auth.getSession();
      const displayName = session?.user.user_metadata?.display_name || session?.user.email?.split('@')[0] || '';
      celebrateLogin();
      toast.success(`Welcome back${displayName ? `, ${displayName}` : ''} 👋`);
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
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
      <div className="mb-5 lg:mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">{isDropship ? 'Dropshipping sign in' : 'Welcome back'}</h1>
        <p className="text-muted-foreground mt-2">{isDropship ? 'Sign in to your dropshipping portal' : 'Sign in to your shopping account'}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3.5 lg:space-y-4">
        <div>
          <Label htmlFor="login-email">Email</Label>
          <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="focus-glow rounded-xl mt-1.5 h-11 md:h-10 text-base md:text-sm" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <Link to={forgotHref} className="text-xs text-primary font-medium hover:underline">Forgot password?</Link>
          </div>
          <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="focus-glow rounded-xl mt-1.5 h-11 md:h-10 text-base md:text-sm" />
        </div>
        <button type="submit" className="btn-pill-primary w-full text-base md:text-sm group min-h-11 md:min-h-12 active:scale-[0.98] transition-transform" disabled={submitting}>
          {submitting ? (
            <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</span>
          ) : (
            <>Sign In <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
          )}
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-5 lg:mt-6">
        Don't have an account? <Link to={signupHref} className="text-primary font-semibold hover:underline">Sign up</Link>
      </p>
    </div>
  );

  // Shop sign-in renders as a normal page inside the shop site chrome.
  if (!isDropship) {
    return (
      <RetailPublicShell contentClassName="flex items-start justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-md animate-scale-in">{formCard}</div>
      </RetailPublicShell>
    );
  }

  return (
    <div className="min-h-[100dvh] lg:min-h-screen grid lg:grid-cols-2 overflow-hidden">
      <div className="relative hidden lg:flex flex-col mesh-gradient-cta overflow-hidden py-12 px-10 xl:px-16">
        <span className="sparkle-dot top-16 left-[20%]" />
        <span className="sparkle-dot top-1/3 right-[25%]" style={{ animationDelay: '0.6s' }} />
        <span className="sparkle-dot bottom-32 left-[40%] !w-1.5 !h-1.5" style={{ animationDelay: '1.1s' }} />
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-green-400/15 blur-3xl" />

        <div className="relative w-full max-w-lg mx-auto flex flex-col flex-1">
          <Link to="/" className="flex items-center gap-2.5 group w-fit">
            <BrandLogo variant="storefront" onDark />
          </Link>

          <div className="flex-1 flex flex-col justify-center py-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md px-4 py-1.5 text-sm text-white font-medium mb-6 w-fit">
              <Sparkles className="h-4 w-4 text-emerald-300" /> Welcome back
            </span>
            <h2 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight text-white">
              Sign in & keep <span className="scribble-underline text-gradient-light">scaling</span>.
            </h2>
            <p className="mt-5 text-white/75 text-lg leading-relaxed">
              Manage your sourcing, orders, and fulfillment from one beautiful dashboard built for KSA sellers.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3">
              {[
                { icon: ShieldCheck, label: 'FBA & FBN compliance' },
                { icon: Zap, label: 'Same-day dispatch' },
                { icon: Users, label: '500+ sellers trust us' },
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
          <Link to="/" className="lg:hidden flex items-center justify-center gap-2 mb-5 group">
            <BrandLogo variant="storefront" onDark />
          </Link>
          {formCard}
        </div>
      </div>
    </div>
  );
};

export default Login;
